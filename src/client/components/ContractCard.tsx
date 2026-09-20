import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  ShieldAlert,
  Trash2
} from 'lucide-react';
import { Contract } from '../lib/api.js';

interface ContractCardProps {
  contract: Contract;
  onDelete?: (id: string) => void;
}

export const ContractCard: React.FC<ContractCardProps> = ({ contract, onDelete }) => {
  // Risk Score formatting
  const getRiskBadge = (score: number) => {
    if (score >= 75) {
      return {
        label: 'CRITICAL RISK',
        bg: 'bg-red-500/10 text-red-400 border-red-500/30',
        dot: 'bg-red-500'
      };
    }
    if (score >= 50) {
      return {
        label: 'HIGH RISK',
        bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
        dot: 'bg-orange-500'
      };
    }
    if (score >= 30) {
      return {
        label: 'MEDIUM RISK',
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-500'
      };
    }
    return {
      label: 'LOW RISK',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-500'
    };
  };

  const riskBadge = getRiskBadge(contract.risk_score || 0);

  // Notice deadline countdown math
  const getNoticeCountdown = () => {
    if (!contract.notice_deadline_date) return null;
    const deadline = new Date(contract.notice_deadline_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    const days = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (days < 0) {
      return {
        text: `Notice Deadline Passed (${Math.abs(days)}d ago)`,
        urgent: true
      };
    }
    if (days <= 30) {
      return {
        text: `${days} Days to Notice Deadline`,
        urgent: true
      };
    }
    return {
      text: `Notice Window: ${days} Days`,
      urgent: false
    };
  };

  const countdown = getNoticeCountdown();

  return (
    <div className="glass-card rounded-2xl p-5 border flex flex-col justify-between group hover:border-teal-500/40 transition-all duration-200">
      <div>
        {/* Header: Category & Risk Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-semibold text-teal-400/90 tracking-wide uppercase px-2.5 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20">
            {contract.category}
          </span>
          <div className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${riskBadge.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${riskBadge.dot} animate-pulse`} />
            <span>{riskBadge.label} ({contract.risk_score}/100)</span>
          </div>
        </div>

        {/* Title */}
        <Link to={`/contracts/${contract.id}`} className="block group-hover:text-teal-300 transition-colors">
          <h3 className="text-base font-bold text-slate-100 tracking-tight line-clamp-2 leading-snug">
            {contract.title}
          </h3>
        </Link>

        {/* Counterparty info */}
        <div className="mt-2 flex items-center space-x-1.5 text-xs text-slate-400">
          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="font-medium text-slate-300 truncate">{contract.counterparty}</span>
        </div>

        {/* Metrics Grid */}
        <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-xs">
          {/* Total Value */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-slate-500 font-mono">Contract Value</span>
            <span className="font-semibold text-slate-200 mt-0.5">
              {contract.total_value ? `$${contract.total_value.toLocaleString()} ${contract.currency || 'USD'}` : 'Not Stated'}
            </span>
          </div>

          {/* Renewal Mechanism */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-slate-500 font-mono">Renewal Type</span>
            <span className={`font-semibold mt-0.5 ${contract.renewal_type === 'Auto-Renew' ? 'text-orange-400' : 'text-slate-300'}`}>
              {contract.renewal_type} ({contract.notice_period_days}d Notice)
            </span>
          </div>
        </div>

        {/* Impending Notice Deadline Alert Badge */}
        {countdown && (
          <div className={`mt-3 flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${
            countdown.urgent 
              ? 'bg-red-500/10 border-red-500/30 text-red-300 animate-pulse' 
              : 'bg-slate-800/60 border-slate-700/50 text-slate-300'
          }`}>
            <Clock className={`w-3.5 h-3.5 ${countdown.urgent ? 'text-red-400' : 'text-slate-400'}`} />
            <span>{countdown.text}</span>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-slate-400">
          <span>{contract.obligationsCount ?? contract.obligations?.length ?? 0} Obligations</span>
          <span>•</span>
          <span className="text-orange-400/90 font-medium">
            {contract.risksCount ?? contract.risks?.length ?? 0} Flags
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {onDelete && (
            <button
              onClick={() => onDelete(contract.id)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
              title="Delete Contract"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <Link
            to={`/contracts/${contract.id}`}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg font-medium bg-slate-800 hover:bg-teal-600 hover:text-navy-950 text-slate-200 transition-all"
          >
            <span>Analyze</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
