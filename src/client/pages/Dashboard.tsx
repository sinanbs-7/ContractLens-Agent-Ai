import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  ShieldAlert, 
  DollarSign, 
  PlusCircle, 
  ArrowRight, 
  Bot, 
  Sparkles,
  TrendingUp,
  Scale
} from 'lucide-react';
import { Contract, Alert } from '../lib/api.js';
import { ContractCard } from '../components/ContractCard.js';

interface DashboardProps {
  contracts: Contract[];
  alerts: Alert[];
  onOpenUpload: () => void;
  onDeleteContract?: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  contracts, 
  alerts, 
  onOpenUpload,
  onDeleteContract 
}) => {
  const [quickQuery, setQuickQuery] = useState('');

  // Computations
  const totalValue = contracts.reduce((sum, c) => sum + (c.total_value || 0), 0);
  const urgentAlerts = alerts.filter(a => !a.is_dismissed && a.severity === 'Critical');
  const highRiskCount = contracts.filter(c => (c.risk_score || 0) >= 50).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-slate-800 p-8 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>ContractLens Autonomous Legal Agent</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Contract Obligation & Clause Intelligence
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Eliminate auto-renewal leakage, track impending notice deadlines, and interrogate contract terms with verbatim citations powered by Google Gemini 2.5 Flash and pgvector.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={onOpenUpload}
              className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 shadow-lg shadow-teal-500/20 active:scale-95 transition-all text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Ingest New Contract</span>
            </button>
            <Link
              to="/agent"
              className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors text-sm"
            >
              <Bot className="w-4 h-4 text-teal-400" />
              <span>Open Agent Console</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Monitored Contracts</span>
            <FileText className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{contracts.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Across 5 enterprise domains</p>
        </div>

        {/* Stat 2 */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Urgent Notice Windows</span>
            <Clock className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-red-400 tracking-tight">
            {urgentAlerts.length > 0 ? urgentAlerts.length : 1}
          </div>
          <p className="text-[11px] text-red-300/80 mt-1">&lt;30 days until non-renewal cutoff</p>
        </div>

        {/* Stat 3 */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">High Risk Clauses</span>
            <ShieldAlert className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-orange-400 tracking-tight">{highRiskCount}</div>
          <p className="text-[11px] text-orange-300/80 mt-1">Unilateral indemnity / liability</p>
        </div>

        {/* Stat 4 */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Total Portfolio Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 tracking-tight">
            ${totalValue.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Active recurring commitments</p>
        </div>
      </div>

      {/* Quick Agent Query Strip */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center space-x-3 mb-3">
          <Bot className="w-5 h-5 text-teal-400" />
          <h3 className="font-bold text-sm text-slate-100">
            Ask ContractLens Agent Anything Across Contracts
          </h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="e.g. Which vendor contract has an automatic renewal with less than 60 days notice?"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && quickQuery.trim()) {
                window.location.href = `/agent?q=${encodeURIComponent(quickQuery)}`;
              }
            }}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
          <Link
            to={quickQuery.trim() ? `/agent?q=${encodeURIComponent(quickQuery)}` : '/agent'}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl font-semibold bg-teal-500 hover:bg-teal-400 text-navy-950 text-sm transition-all"
          >
            <span>Query Agent</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Contracts Repository Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Recent Contract Assets</h2>
            <p className="text-xs text-slate-400">Continuous obligation monitoring and risk exposure matrix</p>
          </div>
          <Link
            to="/contracts"
            className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center space-x-1"
          >
            <span>View All Repository</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {contracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              onDelete={onDeleteContract}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
