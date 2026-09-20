import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { supabase, isSupabaseConfigured, memoryDb } from '../lib/supabase.js';
import { parseDocumentBuffer } from '../utils/pdfParser.js';
import { analyzeContractText, compareContractVersions } from '../services/geminiService.js';
import { chunkContractDocument, saveContractEmbeddings } from '../services/vectorService.js';
import { scanAndGenerateAlerts } from '../services/alertEngine.js';
import { ContractFilterSchema, ContractDiffQuerySchema } from '../lib/validation.js';

const router = Router();

// Configure Multer for file upload in memory (15MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMime = ['application/pdf', 'text/plain', 'application/octet-stream'];
    const allowedExt = ['.pdf', '.txt', '.md'];
    const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();

    if (allowedMime.includes(file.mimetype) || allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and TXT documents are supported.'));
    }
  }
});

/**
 * POST /api/contracts/upload
 * Ingests PDF/TXT, extracts text, runs Gemini extraction, saves embeddings, and generates alerts.
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: 'No contract file provided. Please upload a PDF or TXT file.' });
      return;
    }

    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    const formTitle = req.body.title || file.originalname.replace(/\.[^/.]+$/, '');
    const formCategory = req.body.category || 'Vendor & Procurement Agreements';
    const formCounterparty = req.body.counterparty || 'Identified Counterparty';

    console.log(`[INFO] Processing uploaded contract: "${file.originalname}" (${(file.size / 1024).toFixed(1)} KB)`);

    // 1. Parse Document Text preserving page indexes
    const parsedDoc = await parseDocumentBuffer(file.buffer, file.mimetype, file.originalname);

    // 2. Upload file to Supabase Storage if configured
    let filePath = `contracts/${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
    let fileUrl = `http://localhost:5000/api/contracts/files/${encodeURIComponent(file.originalname)}`;

    if (isSupabaseConfigured) {
      try {
        const { error: uploadError } = await supabase.storage
          .from('contracts')
          .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: true });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('contracts').getPublicUrl(filePath);
          fileUrl = publicUrlData.publicUrl;
        }
      } catch (err: any) {
        console.warn(`[WARNING] Supabase storage upload failed: ${err.message}`);
      }
    }

    // 3. Deep Analysis via Gemini 2.5 Flash
    console.log('[INFO] Invoking Gemini 2.5 Flash for deep contract extraction...');
    const analysis = await analyzeContractText(parsedDoc.fullText, formTitle);

    const contractId = (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : `cnt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const newContract = {
      id: contractId,
      user_id: userId,
      title: analysis.title || formTitle,
      category: analysis.category || formCategory,
      counterparty: analysis.counterparty || formCounterparty,
      file_path: filePath,
      file_url: fileUrl,
      effective_date: analysis.effectiveDate || new Date().toISOString().split('T')[0],
      expiration_date: analysis.expirationDate || null,
      renewal_type: analysis.renewalType || 'Manual',
      notice_period_days: analysis.noticePeriodDays || 30,
      notice_deadline_date: analysis.noticeDeadlineDate || null,
      total_value: analysis.totalValue || null,
      currency: analysis.currency || 'USD',
      governing_law: analysis.governingLaw || null,
      risk_score: analysis.riskScore || 50,
      raw_text: parsedDoc.fullText,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 4. Prepare Obligations & Risks
    const obligations = (analysis.obligations || []).map((ob: any) => ({
      id: (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : `ob-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      contract_id: contractId,
      party_responsible: ob.partyResponsible || 'Company',
      obligation_type: ob.obligationType || 'Deliverable',
      description: ob.description,
      due_date: ob.dueDate || null,
      is_recurring: ob.isRecurring || false,
      recurrence_pattern: ob.recurrencePattern || null,
      citation_text: ob.citationText || 'Source contract text',
      page_number: ob.pageNumber || 1,
      section_number: ob.sectionNumber || null,
      status: 'Pending',
      created_at: new Date().toISOString()
    }));

    const risks = (analysis.risks || []).map((rk: any) => ({
      id: (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : `rk-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      contract_id: contractId,
      risk_level: rk.riskLevel || 'Medium',
      clause_category: rk.clauseCategory || 'Liability',
      explanation: rk.explanation,
      mitigation_suggestion: rk.mitigationSuggestion || null,
      citation_text: rk.citationText || 'Risk citation',
      page_number: rk.pageNumber || 1,
      created_at: new Date().toISOString()
    }));

    // 5. Store in Supabase or Memory Fallback
    if (isSupabaseConfigured) {
      try {
        await supabase.from('contracts').insert(newContract);
        if (obligations.length > 0) {
          await supabase.from('contract_obligations').insert(obligations);
        }
        if (risks.length > 0) {
          await supabase.from('contract_risks').insert(risks);
        }
      } catch (err: any) {
        console.warn(`[WARNING] Failed writing to Supabase: ${err.message}. Persisting to memory store.`);
        memoryDb.contracts.unshift(newContract);
        memoryDb.obligations.push(...obligations);
        memoryDb.risks.push(...risks);
      }
    } else {
      memoryDb.contracts.unshift(newContract);
      memoryDb.obligations.push(...obligations);
      memoryDb.risks.push(...risks);
    }

    // 6. Generate Embeddings & Vector Chunks
    console.log('[INFO] Chunking contract text and generating embeddings...');
    const chunks = chunkContractDocument(contractId, parsedDoc.pages);
    await saveContractEmbeddings(chunks);

    // 7. Update Proactive Alerts
    await scanAndGenerateAlerts();

    res.status(201).json({
      success: true,
      data: {
        ...newContract,
        obligations,
        risks
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/contracts
 * Returns list of contracts with filtering, search, and summary stats.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = ContractFilterSchema.parse(req.query);

    let contracts: any[] = [];

    if (isSupabaseConfigured) {
      try {
        let dbQuery = supabase.from('contracts').select('*').order('created_at', { ascending: false });

        if (query.category) {
          dbQuery = dbQuery.eq('category', query.category);
        }
        if (query.search) {
          dbQuery = dbQuery.ilike('title', `%${query.search}%`);
        }
        if (query.riskScoreMin !== undefined) {
          dbQuery = dbQuery.gte('risk_score', query.riskScoreMin);
        }

        const { data, error } = await dbQuery.range(query.offset, query.offset + query.limit - 1);
        if (!error && data) {
          contracts = data;
        }
      } catch (err: any) {
        console.warn(`[WARNING] Supabase fetch failed: ${err.message}`);
        contracts = memoryDb.contracts;
      }
    } else {
      contracts = memoryDb.contracts;
    }

    // Apply memory filters if Supabase was bypassed or empty
    if (!isSupabaseConfigured || contracts.length === 0) {
      contracts = memoryDb.contracts.filter(c => {
        if (query.category && c.category !== query.category) return false;
        if (query.search) {
          const s = query.search.toLowerCase();
          const matchTitle = c.title?.toLowerCase().includes(s);
          const matchCounterparty = c.counterparty?.toLowerCase().includes(s);
          if (!matchTitle && !matchCounterparty) return false;
        }
        if (query.riskScoreMin !== undefined && (c.risk_score || 0) < query.riskScoreMin) return false;
        return true;
      });
    }

    // Attach obligation and risk counts for UI badges
    const contractsWithCounts = contracts.map(c => {
      const obCount = memoryDb.obligations.filter(o => o.contract_id === c.id).length;
      const rkCount = memoryDb.risks.filter(r => r.contract_id === c.id).length;
      return {
        ...c,
        obligationsCount: obCount,
        risksCount: rkCount
      };
    });

    res.json({
      success: true,
      data: contractsWithCounts,
      total: contractsWithCounts.length
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/contracts/:id
 * Deep dive view: returns contract, obligations, risks, and alerts.
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    let contract: any = null;
    let obligations: any[] = [];
    let risks: any[] = [];
    let alerts: any[] = [];

    if (isSupabaseConfigured) {
      try {
        const [cRes, oRes, rRes, aRes] = await Promise.all([
          supabase.from('contracts').select('*').eq('id', id).single(),
          supabase.from('contract_obligations').select('*').eq('contract_id', id).order('due_date', { ascending: true }),
          supabase.from('contract_risks').select('*').eq('contract_id', id).order('risk_level', { ascending: false }),
          supabase.from('contract_alerts').select('*').eq('contract_id', id).eq('is_dismissed', false)
        ]);

        if (cRes.data) {
          contract = cRes.data;
          obligations = oRes.data || [];
          risks = rRes.data || [];
          alerts = aRes.data || [];
        }
      } catch (err: any) {
        console.warn(`Supabase fetch detail error: ${err.message}`);
      }
    }

    if (!contract) {
      contract = memoryDb.contracts.find(c => c.id === id);
      if (!contract) {
        res.status(404).json({ success: false, error: 'Contract not found' });
        return;
      }
      obligations = memoryDb.obligations.filter(o => o.contract_id === id);
      risks = memoryDb.risks.filter(r => r.contract_id === id);
      alerts = memoryDb.alerts.filter(a => a.contract_id === id && !a.is_dismissed);
    }

    res.json({
      success: true,
      data: {
        ...contract,
        obligations,
        risks,
        alerts
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/contracts/:id
 * Cascades removal of contract, obligations, risks, alerts, and embeddings.
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured) {
      await supabase.from('contracts').delete().eq('id', id);
    }

    // Remove from memory
    memoryDb.contracts = memoryDb.contracts.filter(c => c.id !== id);
    memoryDb.obligations = memoryDb.obligations.filter(o => o.contract_id !== id);
    memoryDb.risks = memoryDb.risks.filter(r => r.contract_id !== id);
    memoryDb.alerts = memoryDb.alerts.filter(a => a.contract_id !== id);
    memoryDb.embeddings = memoryDb.embeddings.filter(e => e.contract_id !== id);

    res.json({ success: true, message: 'Contract deleted successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/contracts/compare
 * Accepts contractIdA & contractIdB. Performs semantic diff via Gemini 2.5 Flash.
 */
router.post('/compare', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contractIdA, contractIdB } = req.body;

    if (!contractIdA || !contractIdB) {
      res.status(400).json({ success: false, error: 'Both contractIdA and contractIdB are required.' });
      return;
    }

    let docA = memoryDb.contracts.find(c => c.id === contractIdA);
    let docB = memoryDb.contracts.find(c => c.id === contractIdB);

    if (isSupabaseConfigured) {
      if (!docA) {
        const { data } = await supabase.from('contracts').select('*').eq('id', contractIdA).single();
        if (data) docA = data;
      }
      if (!docB) {
        const { data } = await supabase.from('contracts').select('*').eq('id', contractIdB).single();
        if (data) docB = data;
      }
    }

    if (!docA || !docB) {
      res.status(404).json({ success: false, error: 'One or both contracts could not be found for comparison.' });
      return;
    }

    console.log(`[INFO] Comparing Version A ("${docA.title}") against Version B ("${docB.title}")...`);
    const diffResult = await compareContractVersions(docA.raw_text, docB.raw_text);

    res.json({
      success: true,
      data: {
        contractA: { id: docA.id, title: docA.title, counterparty: docA.counterparty },
        contractB: { id: docB.id, title: docB.title, counterparty: docB.counterparty },
        ...diffResult
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
