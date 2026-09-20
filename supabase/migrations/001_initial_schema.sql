-- =====================================================================
-- CONTRACTLENS - PRODUCTION-GRADE POSTGRESQL SCHEMA WITH PGVECTOR & RLS
-- Migration: 001_initial_schema.sql
-- =====================================================================

-- 1. Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Clean Existing Tables If Necessary (Order matters for foreign keys)
DROP TABLE IF EXISTS public.contract_alerts CASCADE;
DROP TABLE IF EXISTS public.contract_embeddings CASCADE;
DROP TABLE IF EXISTS public.contract_risks CASCADE;
DROP TABLE IF EXISTS public.contract_obligations CASCADE;
DROP TABLE IF EXISTS public.contracts CASCADE;

-- 3. CONTRACTS TABLE
CREATE TABLE public.contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- references auth.users(id) in Supabase Auth
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Vendor & Procurement Agreements', 'Customer & Sales Contracts', etc.
    counterparty VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    effective_date DATE,
    expiration_date DATE,
    renewal_type VARCHAR(50) DEFAULT 'Manual', -- 'Auto-Renew', 'Manual', 'Non-Renewing'
    notice_period_days INT DEFAULT 30,
    notice_deadline_date DATE,
    total_value NUMERIC(15, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    governing_law VARCHAR(100),
    risk_score INT CHECK (risk_score BETWEEN 0 AND 100),
    raw_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CONTRACT CLAUSES & OBLIGATIONS TABLE
CREATE TABLE public.contract_obligations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    party_responsible VARCHAR(255) NOT NULL, -- e.g., 'Company', 'Counterparty', 'Both'
    obligation_type VARCHAR(100) NOT NULL, -- 'Payment', 'Deliverable', 'Renewal Notice', 'Audit', 'Termination'
    description TEXT NOT NULL,
    due_date DATE,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50), -- 'Monthly', 'Quarterly', 'Annually'
    citation_text TEXT NOT NULL,
    page_number INT DEFAULT 1,
    section_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Fulfilled', 'Overdue', 'Breached'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. CONTRACT RISKS TABLE
CREATE TABLE public.contract_risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    risk_level VARCHAR(20) NOT NULL, -- 'Low', 'Medium', 'High', 'Critical'
    clause_category VARCHAR(100) NOT NULL, -- 'Liability', 'Indemnification', 'Termination', 'IP Right', 'Auto-Renewal'
    explanation TEXT NOT NULL,
    mitigation_suggestion TEXT,
    citation_text TEXT NOT NULL,
    page_number INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. CONTRACT EMBEDDINGS TABLE (FOR GROUNDED QA RAG)
CREATE TABLE public.contract_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    page_number INT NOT NULL,
    chunk_index INT NOT NULL,
    embedding VECTOR(768), -- Dimensions for Google text-embedding-004
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. ALERTS & NOTIFICATIONS TABLE
CREATE TABLE public.contract_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    obligation_id UUID REFERENCES public.contract_obligations(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'Renewal Window', 'Payment Due', 'Obligation Pending', 'Risk Review'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    trigger_date DATE NOT NULL,
    is_dismissed BOOLEAN DEFAULT FALSE,
    severity VARCHAR(20) DEFAULT 'Medium', -- 'Info', 'Warning', 'Critical'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. INDEXES FOR PERFORMANCE & VECTOR SIMILARITY
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON public.contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_obligations_contract_id ON public.contract_obligations(contract_id);
CREATE INDEX IF NOT EXISTS idx_risks_contract_id ON public.contract_risks(contract_id);
CREATE INDEX IF NOT EXISTS idx_alerts_trigger ON public.contract_alerts(trigger_date, is_dismissed);

-- Vector Cosine Similarity Index
CREATE INDEX IF NOT EXISTS idx_contract_embeddings_vector 
ON public.contract_embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 9. VECTOR MATCHING STORED FUNCTION
CREATE OR REPLACE FUNCTION match_contract_chunks (
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT,
  filter_contract_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  contract_id UUID,
  content TEXT,
  page_number INT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.contract_id,
    ce.content,
    ce.page_number,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM public.contract_embeddings ce
  WHERE (filter_contract_id IS NULL OR ce.contract_id = filter_contract_id)
    AND 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_alerts ENABLE ROW LEVEL SECURITY;

-- Contracts Policy
CREATE POLICY "Users can manage their own contracts" 
ON public.contracts FOR ALL 
USING (auth.uid() = user_id OR auth.role() = 'service_role') 
WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- Obligations Policy
CREATE POLICY "Users can manage obligations via contract ownership" 
ON public.contract_obligations FOR ALL 
USING (
  auth.role() = 'service_role' OR 
  EXISTS (SELECT 1 FROM public.contracts WHERE id = contract_obligations.contract_id AND user_id = auth.uid())
)
WITH CHECK (
  auth.role() = 'service_role' OR 
  EXISTS (SELECT 1 FROM public.contracts WHERE id = contract_obligations.contract_id AND user_id = auth.uid())
);

-- Risks Policy
CREATE POLICY "Users can manage risks via contract ownership" 
ON public.contract_risks FOR ALL 
USING (
  auth.role() = 'service_role' OR 
  EXISTS (SELECT 1 FROM public.contracts WHERE id = contract_risks.contract_id AND user_id = auth.uid())
)
WITH CHECK (
  auth.role() = 'service_role' OR 
  EXISTS (SELECT 1 FROM public.contracts WHERE id = contract_risks.contract_id AND user_id = auth.uid())
);

-- Embeddings Policy
CREATE POLICY "Users can manage embeddings via contract ownership" 
ON public.contract_embeddings FOR ALL 
USING (
  auth.role() = 'service_role' OR 
  EXISTS (SELECT 1 FROM public.contracts WHERE id = contract_embeddings.contract_id AND user_id = auth.uid())
)
WITH CHECK (
  auth.role() = 'service_role' OR 
  EXISTS (SELECT 1 FROM public.contracts WHERE id = contract_embeddings.contract_id AND user_id = auth.uid())
);

-- Alerts Policy
CREATE POLICY "Users can manage alerts via contract ownership" 
ON public.contract_alerts FOR ALL 
USING (
  auth.role() = 'service_role' OR 
  EXISTS (SELECT 1 FROM public.contracts WHERE id = contract_alerts.contract_id AND user_id = auth.uid())
)
WITH CHECK (
  auth.role() = 'service_role' OR 
  EXISTS (SELECT 1 FROM public.contracts WHERE id = contract_alerts.contract_id AND user_id = auth.uid())
);

-- =====================================================================
-- 11. PRODUCTION SEED DATA (Enterprise Contracts for Instant Evaluation)
-- =====================================================================

DO $$
DECLARE
  v_demo_user UUID := '00000000-0000-0000-0000-000000000001';
  v_contract_1_id UUID := '11111111-1111-1111-1111-111111111111';
  v_contract_2_id UUID := '22222222-2222-2222-2222-222222222222';
  v_ob1 UUID := '33333333-3333-3333-3333-333333333331';
  v_ob2 UUID := '33333333-3333-3333-3333-333333333332';
  v_ob3 UUID := '33333333-3333-3333-3333-333333333333';
  v_ob4 UUID := '33333333-3333-3333-3333-333333333334';
BEGIN

  -- 1. Insert Contract 1: Apex Cloud Technologies Master Services Agreement
  INSERT INTO public.contracts (
    id, user_id, title, category, counterparty, file_path, file_url,
    effective_date, expiration_date, renewal_type, notice_period_days,
    notice_deadline_date, total_value, currency, governing_law, risk_score, raw_text
  ) VALUES (
    v_contract_1_id,
    v_demo_user,
    'Master Cloud Platform Services Agreement (Apex Cloud)',
    'Vendor & Procurement Agreements',
    'Apex Cloud Technologies, Inc.',
    'contracts/apex_cloud_msa_v1.pdf',
    'https://raw.githubusercontent.com/contractlens/demo/main/contracts/apex_cloud_msa_v1.pdf',
    CURRENT_DATE - INTERVAL '10 months',
    CURRENT_DATE + INTERVAL '2 months',
    'Auto-Renew',
    60,
    CURRENT_DATE + INTERVAL '12 days', -- Approaching urgent notice window!
    240000.00,
    'USD',
    'State of Delaware',
    78,
    'MASTER CLOUD PLATFORM SERVICES AGREEMENT

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
4.2 Unilateral Indemnity. Company shall indemnify, defend, and hold harmless Vendor and its affiliates from and against any and all third-party claims, liabilities, and legal defense costs resulting from Company data payloads or system integration endpoints.'
  );

  -- 2. Obligations for Contract 1
  INSERT INTO public.contract_obligations (
    id, contract_id, party_responsible, obligation_type, description,
    due_date, is_recurring, recurrence_pattern, citation_text, page_number, section_number, status
  ) VALUES
  (
    v_ob1,
    v_contract_1_id,
    'Company',
    'Renewal Notice',
    'Provide formal written notice of non-renewal to prevent automatic 12-month extension with 7.5% fee escalation.',
    CURRENT_DATE + INTERVAL '12 days',
    FALSE,
    NULL,
    'This Agreement shall automatically renew for successive twelve (12) month terms unless either party provides written notice of non-renewal at least sixty (60) days prior to the expiration',
    1,
    'Section 2.2',
    'Pending'
  ),
  (
    v_ob2,
    v_contract_1_id,
    'Company',
    'Payment',
    'Remit quarterly cloud infrastructure installment payment of $60,000 USD.',
    CURRENT_DATE + INTERVAL '25 days',
    TRUE,
    'Quarterly',
    'Company shall pay Vendor a recurring annual fee of $240,000 USD, billed quarterly in advance in four installments of $60,000 USD each.',
    2,
    'Section 3.1',
    'Pending'
  );

  -- 3. Risks for Contract 1
  INSERT INTO public.contract_risks (
    contract_id, risk_level, clause_category, explanation, mitigation_suggestion, citation_text, page_number
  ) VALUES
  (
    v_contract_1_id,
    'Critical',
    'Liability',
    'Asymmetrical liability cap: Vendor liability is capped at 12 months fees, while Company liability for IP and confidentiality breaches is explicitly unlimited.',
    'Negotiate a mutual reciprocal liability ceiling equal to 1x or 2x the annual contract value ($240,000 to $480,000).',
    'Company liability for any alleged breach of intellectual property, acceptable use, or confidentiality covenants shall be strictly UNLIMITED.',
    2
  ),
  (
    v_contract_1_id,
    'High',
    'Auto-Renewal',
    'Aggressive 60-day auto-renewal deadline with non-negotiable 7.5% price escalation upon auto-renewal rollover.',
    'Issue non-renewal notification immediately or draft contract amendment capping renewal indexation to CPI (maximum 3%).',
    'Failure by Company to issue written cancellation notice at least sixty (60) days prior to expiration constitutes an irrevocable commitment to the subsequent twelve-month renewal at standard published rates plus a minimum 7.5% annual escalation.',
    1
  ),
  (
    v_contract_1_id,
    'Medium',
    'Indemnification',
    'One-sided indemnification obligation requiring Company to indemnify Vendor without reciprocal indemnification for Vendor IP infringement.',
    'Demand mutual indemnification clauses protecting Company against third-party patent or copyright infringement claims arising from Vendor software.',
    'Company shall indemnify, defend, and hold harmless Vendor and its affiliates from and against any and all third-party claims',
    2
  );

  -- 4. Alerts for Contract 1
  INSERT INTO public.contract_alerts (
    contract_id, obligation_id, alert_type, title, message, trigger_date, is_dismissed, severity
  ) VALUES (
    v_contract_1_id,
    v_ob1,
    'Renewal Window',
    'Action Required: Apex Cloud 60-Day Renewal Notice Window Closing',
    'Only 12 days remaining before the 60-day non-renewal notice deadline expires. Unnotified lapse triggers mandatory $258,000 auto-renewal commitment.',
    CURRENT_DATE,
    FALSE,
    'Critical'
  );

  -- 5. Insert Contract 2: Global Enterprise Software SLA
  INSERT INTO public.contracts (
    id, user_id, title, category, counterparty, file_path, file_url,
    effective_date, expiration_date, renewal_type, notice_period_days,
    notice_deadline_date, total_value, currency, governing_law, risk_score, raw_text
  ) VALUES (
    v_contract_2_id,
    v_demo_user,
    'Enterprise Customer Software Licensing & SLA',
    'Customer & Sales Contracts',
    'OmniGlobal Logistics Holdings',
    'contracts/omniglobal_sla_2026.pdf',
    'https://raw.githubusercontent.com/contractlens/demo/main/contracts/omniglobal_sla_2026.pdf',
    CURRENT_DATE - INTERVAL '3 months',
    CURRENT_DATE + INTERVAL '9 months',
    'Manual',
    30,
    CURRENT_DATE + INTERVAL '8 months',
    520000.00,
    'USD',
    'State of New York',
    35,
    'ENTERPRISE SOFTWARE LICENSE AND SERVICE LEVEL AGREEMENT

This Enterprise Software License and Service Level Agreement ("Agreement") is executed between Software Solutions Inc ("Provider") and OmniGlobal Logistics Holdings ("Customer").

SECTION 1. SUBSCRIPTION GRANT & SLA COMMITMENT
Provider grants Customer an enterprise-wide license to utilize the Dispatch Optimization Engine. Provider guarantees ninety-nine point nine percent (99.9%) system availability during each calendar month.

SECTION 2. SERVICE CREDITS
If availability falls below 99.9% in any billing month, Customer shall be entitled to a 10% credit against future invoices. If availability falls below 99.0%, Customer may terminate this Agreement without penalty upon thirty (30) days written notice.

SECTION 3. PAYMENT TERMS
Customer shall pay an aggregate fee of $520,000 USD payable in bi-annual installments of $260,000 USD due within 45 days of invoice receipt.

SECTION 4. AUDIT RIGHTS
Provider retains the right, upon fifteen (15) business days written notice, to conduct an independent verification audit of Customer active user seat allocations during regular business hours.'
  );

  -- 6. Obligations for Contract 2
  INSERT INTO public.contract_obligations (
    id, contract_id, party_responsible, obligation_type, description,
    due_date, is_recurring, recurrence_pattern, citation_text, page_number, section_number, status
  ) VALUES
  (
    v_ob3,
    v_contract_2_id,
    'Counterparty',
    'Payment',
    'Receive bi-annual license installment of $260,000 USD from OmniGlobal Logistics within 45 days of invoice.',
    CURRENT_DATE + INTERVAL '45 days',
    TRUE,
    'Semi-Annually',
    'Customer shall pay an aggregate fee of $520,000 USD payable in bi-annual installments of $260,000 USD due within 45 days of invoice receipt.',
    1,
    'Section 3',
    'Pending'
  ),
  (
    v_ob4,
    v_contract_2_id,
    'Company',
    'Deliverable',
    'Maintain 99.9% system availability SLA and deliver monthly uptime audit reporting.',
    CURRENT_DATE + INTERVAL '10 days',
    TRUE,
    'Monthly',
    'Provider guarantees ninety-nine point nine percent (99.9%) system availability during each calendar month.',
    1,
    'Section 1',
    'Pending'
  );

  -- 7. Risks for Contract 2
  INSERT INTO public.contract_risks (
    contract_id, risk_level, clause_category, explanation, mitigation_suggestion, citation_text, page_number
  ) VALUES
  (
    v_contract_2_id,
    'Medium',
    'Termination',
    'Customer has unilateral penalty-free termination right if monthly availability dips below 99.0%.',
    'Implement automated multi-region failover safeguards and set real-time synthetic latency alerts at 99.5% threshold.',
    'If availability falls below 99.0%, Customer may terminate this Agreement without penalty upon thirty (30) days written notice.',
    1
  );

  -- 8. Alerts for Contract 2
  INSERT INTO public.contract_alerts (
    contract_id, obligation_id, alert_type, title, message, trigger_date, is_dismissed, severity
  ) VALUES (
    v_contract_2_id,
    v_ob4,
    'Obligation Pending',
    'Monthly SLA Telemetry Audit Due',
    'Monthly uptime performance metrics report must be certified and transmitted to OmniGlobal Logistics within 10 days.',
    CURRENT_DATE,
    FALSE,
    'Info'
  );

END $$;
