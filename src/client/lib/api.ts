import { supabase } from './supabaseClient.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || 'demo-token';
  return {
    'Authorization': `Bearer ${token}`
  };
}

export interface Contract {
  id: string;
  title: string;
  category: string;
  counterparty: string;
  file_path: string;
  file_url: string;
  effective_date: string | null;
  expiration_date: string | null;
  renewal_type: 'Auto-Renew' | 'Manual' | 'Non-Renewing';
  notice_period_days: number;
  notice_deadline_date: string | null;
  total_value: number | null;
  currency: string;
  governing_law: string | null;
  risk_score: number;
  raw_text: string;
  created_at: string;
  obligations?: Obligation[];
  risks?: Risk[];
  alerts?: Alert[];
  obligationsCount?: number;
  risksCount?: number;
}

export interface Obligation {
  id: string;
  contract_id: string;
  party_responsible: string;
  obligation_type: 'Payment' | 'Deliverable' | 'Renewal Notice' | 'Audit' | 'Termination';
  description: string;
  due_date: string | null;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  citation_text: string;
  page_number: number;
  section_number: string | null;
  status: 'Pending' | 'Fulfilled' | 'Overdue' | 'Breached';
}

export interface Risk {
  id: string;
  contract_id: string;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  clause_category: 'Liability' | 'Indemnification' | 'Termination' | 'IP Right' | 'Auto-Renewal';
  explanation: string;
  mitigation_suggestion: string | null;
  citation_text: string;
  page_number: number;
}

export interface Alert {
  id: string;
  contract_id: string;
  obligation_id?: string | null;
  alert_type: 'Renewal Window' | 'Payment Due' | 'Obligation Pending' | 'Risk Review';
  title: string;
  message: string;
  trigger_date: string;
  is_dismissed: boolean;
  severity: 'Info' | 'Warning' | 'Critical';
  contract_title?: string;
  counterparty?: string;
}

export interface SemanticDiffResult {
  contractA: { id: string; title: string; counterparty: string };
  contractB: { id: string; title: string; counterparty: string };
  summaryOfChanges: string;
  riskDelta: 'Increased' | 'Decreased' | 'Unchanged';
  materialChanges: Array<{
    category: string;
    docA_Version: string;
    docB_Version: string;
    impactAnalysis: string;
  }>;
}

export const api = {
  async getContracts(params?: { category?: string; search?: string; riskScoreMin?: number }): Promise<Contract[]> {
    const authHeaders = await getAuthHeaders();
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.riskScoreMin !== undefined) query.set('riskScoreMin', String(params.riskScoreMin));

    const res = await fetch(`${API_BASE}/contracts?${query.toString()}`, {
      headers: authHeaders
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch contracts');
    return json.data;
  },

  async getContractById(id: string): Promise<Contract> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/contracts/${id}`, {
      headers: authHeaders
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch contract');
    return json.data;
  },

  async uploadContract(formData: FormData): Promise<Contract> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/contracts/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formData
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to upload contract');
    return json.data;
  },

  async deleteContract(id: string): Promise<void> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/contracts/${id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete contract');
  },

  async compareContracts(contractIdA: string, contractIdB: string): Promise<SemanticDiffResult> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/contracts/compare`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ contractIdA, contractIdB })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to run semantic comparison');
    return json.data;
  },

  async chatWithAgent(message: string, contractId?: string, conversationHistory?: Array<{ role: 'user' | 'model'; content: string }>) {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/agent/chat`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, contractId, conversationHistory })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Agent chat failed');
    return json.data;
  },

  async getActiveAlerts(): Promise<Alert[]> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/alerts/active`, {
      headers: authHeaders
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch alerts');
    return json.data;
  },

  async dismissAlert(alertId: string): Promise<void> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/alerts/${alertId}/dismiss`, {
      method: 'PATCH',
      headers: authHeaders
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to dismiss alert');
  }
};
