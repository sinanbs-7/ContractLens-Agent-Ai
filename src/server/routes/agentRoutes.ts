import { Router, Request, Response, NextFunction } from 'express';
import { AgentChatQuerySchema } from '../lib/validation.js';
import { searchSimilarChunks } from '../services/vectorService.js';
import { chatWithAgent } from '../services/geminiService.js';
import { memoryDb, supabase, isSupabaseConfigured } from '../lib/supabase.js';

const router = Router();

/**
 * POST /api/agent/chat
 * Multi-contract or single-contract grounded conversational query endpoint.
 * Backed by vector search RAG and mathematical tool calling.
 */
router.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, contractId, conversationHistory } = AgentChatQuerySchema.parse(req.body);

    // 1. Retrieve contract metadata if a specific contract is selected
    let contractMeta: { title: string; counterparty: string } | undefined = undefined;

    if (contractId) {
      let contract = memoryDb.contracts.find(c => c.id === contractId);
      if (!contract && isSupabaseConfigured) {
        const { data } = await supabase.from('contracts').select('title, counterparty').eq('id', contractId).single();
        if (data) contract = data;
      }
      if (contract) {
        contractMeta = {
          title: contract.title,
          counterparty: contract.counterparty
        };
      }
    }

    // 2. Perform Hybrid / Vector Semantic Search
    console.log(`[INFO] Agent Chat Query: "${message}" (Contract: ${contractId || 'All Contracts'})`);
    const relevantChunks = await searchSimilarChunks(message, contractId, 0.35, 6);

    // 3. Grounded Chat Execution via Gemini 2.5 Flash with Tool Calling
    const agentResult = await chatWithAgent(
      message,
      relevantChunks,
      contractMeta,
      conversationHistory || []
    );

    res.json({
      success: true,
      data: {
        reply: agentResult.reply,
        citations: agentResult.citations,
        toolsUsed: agentResult.toolsUsed,
        contextChunksCount: relevantChunks.length
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
