import { supabase, isSupabaseConfigured, memoryDb } from '../lib/supabase.js';

export interface AlertItem {
  id?: string;
  contract_id: string;
  obligation_id?: string | null;
  alert_type: 'Renewal Window' | 'Payment Due' | 'Obligation Pending' | 'Risk Review';
  title: string;
  message: string;
  trigger_date: string;
  is_dismissed: boolean;
  severity: 'Info' | 'Warning' | 'Critical';
  created_at?: string;
  contract_title?: string;
  counterparty?: string;
}

/**
 * Scans contracts and obligations to identify impending renewal windows,
 * notice deadlines, and payment obligations within 30, 60, and 90 day thresholds.
 */
export async function scanAndGenerateAlerts(): Promise<AlertItem[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let contracts: any[] = [];
  let obligations: any[] = [];

  if (isSupabaseConfigured) {
    try {
      const contractsRes = await supabase.from('contracts').select('*');
      const obligationsRes = await supabase.from('contract_obligations').select('*');
      contracts = contractsRes.data || [];
      obligations = obligationsRes.data || [];
    } catch (err: any) {
      console.warn(`[WARNING] Failed to fetch contracts/obligations for alert scan: ${err.message}. Using memory store.`);
      contracts = memoryDb.contracts;
      obligations = memoryDb.obligations;
    }
  } else {
    contracts = memoryDb.contracts;
    obligations = memoryDb.obligations;
  }

  const generatedAlerts: AlertItem[] = [];

  // 1. Check Contract Notice Deadlines and Expiration Windows
  for (const contract of contracts) {
    if (contract.notice_deadline_date) {
      const noticeDate = new Date(contract.notice_deadline_date);
      noticeDate.setHours(0, 0, 0, 0);
      const daysUntilNotice = Math.ceil((noticeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilNotice <= 30 && daysUntilNotice >= 0) {
        generatedAlerts.push({
          contract_id: contract.id,
          obligation_id: null,
          alert_type: 'Renewal Window',
          title: `Action Required: ${contract.counterparty} Notice Window (${daysUntilNotice}d left)`,
          message: `Notice deadline on ${contract.notice_deadline_date}. Failure to provide notice within ${daysUntilNotice} days may trigger automatic renewal commitment.`,
          trigger_date: today.toISOString().split('T')[0],
          is_dismissed: false,
          severity: daysUntilNotice <= 14 ? 'Critical' : 'Warning',
          contract_title: contract.title,
          counterparty: contract.counterparty
        });
      } else if (daysUntilNotice < 0 && daysUntilNotice >= -7) {
        // Recently passed deadline
        generatedAlerts.push({
          contract_id: contract.id,
          obligation_id: null,
          alert_type: 'Renewal Window',
          title: `Renewal Notice Deadline Passed: ${contract.counterparty}`,
          message: `The non-renewal notice deadline (${contract.notice_deadline_date}) has lapsed. Auto-renewal may already have taken effect.`,
          trigger_date: today.toISOString().split('T')[0],
          is_dismissed: false,
          severity: 'Critical',
          contract_title: contract.title,
          counterparty: contract.counterparty
        });
      }
    }

    // High risk contract alerts
    if (contract.risk_score && contract.risk_score >= 75) {
      const exists = generatedAlerts.some(a => a.contract_id === contract.id && a.alert_type === 'Risk Review');
      if (!exists) {
        generatedAlerts.push({
          contract_id: contract.id,
          obligation_id: null,
          alert_type: 'Risk Review',
          title: `High Risk Contract Review: ${contract.title}`,
          message: `Risk score is ${contract.risk_score}/100. Asymmetrical liability or broad indemnification clauses detected.`,
          trigger_date: today.toISOString().split('T')[0],
          is_dismissed: false,
          severity: 'Warning',
          contract_title: contract.title,
          counterparty: contract.counterparty
        });
      }
    }
  }

  // 2. Check Granular Obligations (Payment due dates, Deliverables)
  for (const obligation of obligations) {
    if (obligation.due_date && obligation.status !== 'Fulfilled') {
      const dueDate = new Date(obligation.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const parentContract = contracts.find(c => c.id === obligation.contract_id);
      const contractTitle = parentContract ? parentContract.title : 'Contract';
      const counterparty = parentContract ? parentContract.counterparty : 'Counterparty';

      if (daysUntilDue <= 30 && daysUntilDue >= 0) {
        generatedAlerts.push({
          contract_id: obligation.contract_id,
          obligation_id: obligation.id,
          alert_type: obligation.obligation_type === 'Payment' ? 'Payment Due' : 'Obligation Pending',
          title: `${obligation.obligation_type} Pending: ${counterparty} (${daysUntilDue}d left)`,
          message: `${obligation.description} Due Date: ${obligation.due_date}.`,
          trigger_date: today.toISOString().split('T')[0],
          is_dismissed: false,
          severity: daysUntilDue <= 7 ? 'Critical' : 'Warning',
          contract_title: contractTitle,
          counterparty
        });
      } else if (daysUntilDue < 0) {
        generatedAlerts.push({
          contract_id: obligation.contract_id,
          obligation_id: obligation.id,
          alert_type: obligation.obligation_type === 'Payment' ? 'Payment Due' : 'Obligation Pending',
          title: `Overdue Obligation: ${obligation.obligation_type} for ${counterparty}`,
          message: `Was due on ${obligation.due_date} (${Math.abs(daysUntilDue)} days overdue). ${obligation.description}`,
          trigger_date: today.toISOString().split('T')[0],
          is_dismissed: false,
          severity: 'Critical',
          contract_title: contractTitle,
          counterparty
        });
      }
    }
  }

  // Merge and persist into memoryDb or Supabase
  for (const alert of generatedAlerts) {
    const existing = memoryDb.alerts.find(
      a => a.contract_id === alert.contract_id &&
           a.title === alert.title &&
           !a.is_dismissed
    );
    if (!existing) {
      const newAlert = {
        ...alert,
        id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        created_at: new Date().toISOString()
      };
      memoryDb.alerts.unshift(newAlert);

      if (isSupabaseConfigured) {
        try {
          await supabase.from('contract_alerts').insert({
            contract_id: alert.contract_id,
            obligation_id: alert.obligation_id,
            alert_type: alert.alert_type,
            title: alert.title,
            message: alert.message,
            trigger_date: alert.trigger_date,
            severity: alert.severity,
            is_dismissed: false
          });
        } catch (insertErr: any) {
          console.warn(`Supabase alert insert failed: ${insertErr.message}`);
        }
      }
    }
  }

  // Return active non-dismissed alerts
  const activeAlerts = memoryDb.alerts.filter(a => !a.is_dismissed);
  return activeAlerts;
}

/**
 * Dismisses an alert by ID.
 */
export async function dismissAlert(alertId: string): Promise<boolean> {
  const alertIndex = memoryDb.alerts.findIndex(a => a.id === alertId);
  if (alertIndex !== -1) {
    memoryDb.alerts[alertIndex].is_dismissed = true;
  }

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('contract_alerts')
        .update({ is_dismissed: true })
        .eq('id', alertId);
    } catch (err: any) {
      console.warn(`[WARNING] Failed to dismiss alert in Supabase: ${err.message}`);
    }
  }

  return true;
}
