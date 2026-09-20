import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  !supabaseUrl.includes('your-supabase-project') &&
  supabaseServiceKey &&
  !supabaseServiceKey.includes('your-supabase')
);

if (!isSupabaseConfigured) {
  console.warn('[WARNING] Live Supabase credentials are not configured in .env. The server will use in-memory store for contracts, obligations, risks, and alerts during evaluation.');
}

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseServiceKey : 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// Memory fallback store for when Supabase credentials are not yet entered
export interface InMemoryDb {
  contracts: any[];
  obligations: any[];
  risks: any[];
  embeddings: any[];
  alerts: any[];
}

export const memoryDb: InMemoryDb = {
  contracts: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      user_id: '00000000-0000-0000-0000-000000000001',
      title: 'Master Cloud Platform Services Agreement (Apex Cloud)',
      category: 'Vendor & Procurement Agreements',
      counterparty: 'Apex Cloud Technologies, Inc.',
      file_path: 'contracts/apex_cloud_msa_v1.pdf',
      file_url: 'https://raw.githubusercontent.com/contractlens/demo/main/contracts/apex_cloud_msa_v1.pdf',
      effective_date: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      expiration_date: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      renewal_type: 'Auto-Renew',
      notice_period_days: 60,
      notice_deadline_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      total_value: 240000.00,
      currency: 'USD',
      governing_law: 'State of Delaware',
      risk_score: 78,
      raw_text: `MASTER CLOUD PLATFORM SERVICES AGREEMENT

This Master Cloud Platform Services Agreement ("Agreement") is made effective as of the Effective Date by and between Enterprise Client Corp ("Company") and Apex Cloud Technologies, Inc. ("Vendor").

SECTION 1. SCOPE AND SERVICES
Vendor agrees to provide managed cloud orchestration, storage infrastructure, and real-time observability telemetry as detailed in Order Form #APX-9021.

SECTION 2. TERM AND RENEWAL MECHANISMS
2.1 Initial Term. The initial term of this Agreement shall commence on the Effective Date and continue for a period of twelve (12) consecutive months ("Initial Term").
2.2 Automatic Renewal. This Agreement shall automatically renew for successive twelve (12) month terms unless either party provides written notice of non-renewal at least sixty (60) days prior to the expiration of the then-current term.
2.3 Notice Period Penalty. Failure by Company to issue written cancellation notice at least sixty (60) days prior to expiration constitutes an irrevocable commitment to the subsequent twelve-month renewal at standard published rates plus a minimum 7.5% annual escalation.

SECTION 3. FEES AND PAYMENT OBLIGATIONS
3.1 Subscription Fees. Company shall pay Vendor a recurring annual fee of $240,000 USD, billed quarterly in advance in four installments of $60,000 USD each.
3.2 Late Payment Interest. Any invoice unpaid after thirty (30) days from issuance date shall accrue penalty interest at the rate of 1.5% per month or the highest lawful rate permitted under Delaware law.

SECTION 4. LIMITATION OF LIABILITY AND INDEMNIFICATION
4.1 Uncapped Liability. Vendor liability for direct damages arising out of security incidents or service outages shall be capped at twelve (12) months of fees paid. However, Company liability for any alleged breach of intellectual property, acceptable use, or confidentiality covenants shall be strictly UNLIMITED.
4.2 Unilateral Indemnity. Company shall indemnify, defend, and hold harmless Vendor and its affiliates from and against any and all third-party claims, liabilities, and legal defense costs resulting from Company data payloads or system integration endpoints.`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      user_id: '00000000-0000-0000-0000-000000000001',
      title: 'Enterprise Customer Software Licensing & SLA',
      category: 'Customer & Sales Contracts',
      counterparty: 'OmniGlobal Logistics Holdings',
      file_path: 'contracts/omniglobal_sla_2026.pdf',
      file_url: 'https://raw.githubusercontent.com/contractlens/demo/main/contracts/omniglobal_sla_2026.pdf',
      effective_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      expiration_date: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      renewal_type: 'Manual',
      notice_period_days: 30,
      notice_deadline_date: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      total_value: 520000.00,
      currency: 'USD',
      governing_law: 'State of New York',
      risk_score: 35,
      raw_text: `ENTERPRISE SOFTWARE LICENSE AND SERVICE LEVEL AGREEMENT

This Enterprise Software License and Service Level Agreement ("Agreement") is executed between Software Solutions Inc ("Provider") and OmniGlobal Logistics Holdings ("Customer").

SECTION 1. SUBSCRIPTION GRANT & SLA COMMITMENT
Provider grants Customer an enterprise-wide license to utilize the Dispatch Optimization Engine. Provider guarantees ninety-nine point nine percent (99.9%) system availability during each calendar month.

SECTION 2. SERVICE CREDITS
If availability falls below 99.9% in any billing month, Customer shall be entitled to a 10% credit against future invoices. If availability falls below 99.0%, Customer may terminate this Agreement without penalty upon thirty (30) days written notice.

SECTION 3. PAYMENT TERMS
Customer shall pay an aggregate fee of $520,000 USD payable in bi-annual installments of $260,000 USD due within 45 days of invoice receipt.

SECTION 4. AUDIT RIGHTS
Provider retains the right, upon fifteen (15) business days written notice, to conduct an independent verification audit of Customer active user seat allocations during regular business hours.`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  obligations: [
    {
      id: '33333333-3333-3333-3333-333333333331',
      contract_id: '11111111-1111-1111-1111-111111111111',
      party_responsible: 'Company',
      obligation_type: 'Renewal Notice',
      description: 'Provide formal written notice of non-renewal to prevent automatic 12-month extension with 7.5% fee escalation.',
      due_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_recurring: false,
      recurrence_pattern: null,
      citation_text: 'This Agreement shall automatically renew for successive twelve (12) month terms unless either party provides written notice of non-renewal at least sixty (60) days prior to the expiration',
      page_number: 1,
      section_number: 'Section 2.2',
      status: 'Pending',
      created_at: new Date().toISOString()
    },
    {
      id: '33333333-3333-3333-3333-333333333332',
      contract_id: '11111111-1111-1111-1111-111111111111',
      party_responsible: 'Company',
      obligation_type: 'Payment',
      description: 'Remit quarterly cloud infrastructure installment payment of $60,000 USD.',
      due_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_recurring: true,
      recurrence_pattern: 'Quarterly',
      citation_text: 'Company shall pay Vendor a recurring annual fee of $240,000 USD, billed quarterly in advance in four installments of $60,000 USD each.',
      page_number: 2,
      section_number: 'Section 3.1',
      status: 'Pending',
      created_at: new Date().toISOString()
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      contract_id: '22222222-2222-2222-2222-222222222222',
      party_responsible: 'Counterparty',
      obligation_type: 'Payment',
      description: 'Receive bi-annual license installment of $260,000 USD from OmniGlobal Logistics within 45 days of invoice.',
      due_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_recurring: true,
      recurrence_pattern: 'Semi-Annually',
      citation_text: 'Customer shall pay an aggregate fee of $520,000 USD payable in bi-annual installments of $260,000 USD due within 45 days of invoice receipt.',
      page_number: 1,
      section_number: 'Section 3',
      status: 'Pending',
      created_at: new Date().toISOString()
    },
    {
      id: '33333333-3333-3333-3333-333333333334',
      contract_id: '22222222-2222-2222-2222-222222222222',
      party_responsible: 'Company',
      obligation_type: 'Deliverable',
      description: 'Maintain 99.9% system availability SLA and deliver monthly uptime audit reporting.',
      due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_recurring: true,
      recurrence_pattern: 'Monthly',
      citation_text: 'Provider guarantees ninety-nine point nine percent (99.9%) system availability during each calendar month.',
      page_number: 1,
      section_number: 'Section 1',
      status: 'Pending',
      created_at: new Date().toISOString()
    }
  ],
  risks: [
    {
      id: '44444444-4444-4444-4444-444444444441',
      contract_id: '11111111-1111-1111-1111-111111111111',
      risk_level: 'Critical',
      clause_category: 'Liability',
      explanation: 'Asymmetrical liability cap: Vendor liability is capped at 12 months fees, while Company liability for IP and confidentiality breaches is explicitly unlimited.',
      mitigation_suggestion: 'Negotiate a mutual reciprocal liability ceiling equal to 1x or 2x the annual contract value ($240,000 to $480,000).',
      citation_text: 'Company liability for any alleged breach of intellectual property, acceptable use, or confidentiality covenants shall be strictly UNLIMITED.',
      page_number: 2,
      created_at: new Date().toISOString()
    },
    {
      id: '44444444-4444-4444-4444-444444444442',
      contract_id: '11111111-1111-1111-1111-111111111111',
      risk_level: 'High',
      clause_category: 'Auto-Renewal',
      explanation: 'Aggressive 60-day auto-renewal deadline with non-negotiable 7.5% price escalation upon auto-renewal rollover.',
      mitigation_suggestion: 'Issue non-renewal notification immediately or draft contract amendment capping renewal indexation to CPI (maximum 3%).',
      citation_text: 'Failure by Company to issue written cancellation notice at least sixty (60) days prior to expiration constitutes an irrevocable commitment to the subsequent twelve-month renewal at standard published rates plus a minimum 7.5% annual escalation.',
      page_number: 1,
      created_at: new Date().toISOString()
    },
    {
      id: '44444444-4444-4444-4444-444444444443',
      contract_id: '11111111-1111-1111-1111-111111111111',
      risk_level: 'Medium',
      clause_category: 'Indemnification',
      explanation: 'One-sided indemnification obligation requiring Company to indemnify Vendor without reciprocal indemnification for Vendor IP infringement.',
      mitigation_suggestion: 'Demand mutual indemnification clauses protecting Company against third-party patent or copyright infringement claims arising from Vendor software.',
      citation_text: 'Company shall indemnify, defend, and hold harmless Vendor and its affiliates from and against any and all third-party claims',
      page_number: 2,
      created_at: new Date().toISOString()
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      contract_id: '22222222-2222-2222-2222-222222222222',
      risk_level: 'Medium',
      clause_category: 'Termination',
      explanation: 'Customer has unilateral penalty-free termination right if monthly availability dips below 99.0%.',
      mitigation_suggestion: 'Implement automated multi-region failover safeguards and set real-time synthetic latency alerts at 99.5% threshold.',
      citation_text: 'If availability falls below 99.0%, Customer may terminate this Agreement without penalty upon thirty (30) days written notice.',
      page_number: 1,
      created_at: new Date().toISOString()
    }
  ],
  embeddings: [],
  alerts: [
    {
      id: '55555555-5555-5555-5555-555555555551',
      contract_id: '11111111-1111-1111-1111-111111111111',
      obligation_id: '33333333-3333-3333-3333-333333333331',
      alert_type: 'Renewal Window',
      title: 'Action Required: Apex Cloud 60-Day Renewal Notice Window Closing',
      message: 'Only 12 days remaining before the 60-day non-renewal notice deadline expires. Unnotified lapse triggers mandatory $258,000 auto-renewal commitment.',
      trigger_date: new Date().toISOString().split('T')[0],
      is_dismissed: false,
      severity: 'Critical',
      created_at: new Date().toISOString()
    },
    {
      id: '55555555-5555-5555-5555-555555555552',
      contract_id: '22222222-2222-2222-2222-222222222222',
      obligation_id: '33333333-3333-3333-3333-333333333334',
      alert_type: 'Obligation Pending',
      title: 'Monthly SLA Telemetry Audit Due',
      message: 'Monthly uptime performance metrics report must be certified and transmitted to OmniGlobal Logistics within 10 days.',
      trigger_date: new Date().toISOString().split('T')[0],
      is_dismissed: false,
      severity: 'Info',
      created_at: new Date().toISOString()
    }
  ]
};
