import React, { useState } from 'react';
import { 
  GitCompare, 
  ArrowRight, 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  Scale, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { Contract, SemanticDiffResult, api } from '../lib/api.js';

interface VersionDiffStudioProps {
  contracts: Contract[];
}

export const VersionDiffStudio: React.FC<VersionDiffStudioProps> = ({ contracts }) => {
  const [contractIdA, setContractIdA] = useState<string>(contracts[0]?.id || '');
  const [contractIdB, setContractIdB] = useState<string>(contracts[1]?.id || contracts[0]?.id || '');
  const [diffResult, setDiffResult] = useState<SemanticDiffResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunDiff = async () => {
    if (!contractIdA || !contractIdB) {
      setError('Please select both contract versions to compare.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.compareContracts(contractIdA, contractIdB);
      setDiffResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to generate comparison.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskDeltaBadge = (delta: string) => {
    switch (delta) {
      case 'Decreased':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: TrendingDown,
          text: 'LEGAL RISK DECREASED (Favorable)'
        };
      case 'Increased':
        return {
          bg: 'bg-red-500/10 text-red-400 border-red-500/30',
          icon: TrendingUp,
          text: 'LEGAL RISK INCREASED (Caution)'
        };
      default:
        return {
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          icon: Minus,
          text: 'RISK PROFILE UNCHANGED'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header & Selection Controls */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center space-x-2 pb-4 border-b border-slate-800">
          <GitCompare className="w-6 h-6 text-teal-400" />
          <div>
            <h2 className="text-xl font-bold text-slate-100">Semantic Version Diffing Studio</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Intelligent comparative analysis identifying material shifts in liability, obligations, and financial commitments.
            </p>
          </div>
        </div>

        {/* Dropdown selectors */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1.5">
              Version A (Baseline / Prior Iteration)
            </label>
            <select
              value={contractIdA}
              onChange={(e) => setContractIdA(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
            >
              {contracts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.counterparty})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1.5">
              Version B (Revised Draft / Amendment)
            </label>
            <select
              value={contractIdB}
              onChange={(e) => setContractIdB(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
            >
              {contracts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.counterparty})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Trigger Button */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleRunDiff}
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 shadow-md shadow-teal-500/20 active:scale-95 disabled:opacity-50 transition-all text-sm"
          >
            <GitCompare className="w-4 h-4" />
            <span>{loading ? 'Analyzing Semantic Diff via Gemini...' : 'Execute Comparative Diff'}</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Diff Results Output */}
      {diffResult && (
        <div className="space-y-6">
          {/* High-Level Overview Card */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Executive Summary of Changes</span>
                <h3 className="text-base font-bold text-slate-100 mt-1">
                  Comparing "{diffResult.contractA.title}" vs "{diffResult.contractB.title}"
                </h3>
              </div>

              {/* Risk Delta Indicator */}
              {(() => {
                const badge = getRiskDeltaBadge(diffResult.riskDelta);
                const Icon = badge.icon;
                return (
                  <div className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full border text-xs font-bold ${badge.bg}`}>
                    <Icon className="w-4 h-4" />
                    <span>{badge.text}</span>
                  </div>
                );
              })()}
            </div>

            <p className="mt-4 text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
              {diffResult.summaryOfChanges}
            </p>
          </div>

          {/* Material Changes Cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">
              Material Legal & Financial Variations ({diffResult.materialChanges.length})
            </h3>

            {diffResult.materialChanges.map((change, idx) => (
              <div key={idx} className="glass-card rounded-xl p-5 border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide font-mono px-2.5 py-1 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    {change.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Item #{idx + 1}</span>
                </div>

                {/* Side-by-Side Clause Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Version A */}
                  <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/90 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span className="font-semibold text-slate-300">Baseline (Version A)</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">
                      {change.docA_Version}
                    </p>
                  </div>

                  {/* Version B */}
                  <div className="bg-teal-950/20 p-4 rounded-xl border border-teal-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs text-teal-400 font-mono">
                      <span className="font-semibold text-teal-300">Revised (Version B)</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-mono">
                      {change.docB_Version}
                    </p>
                  </div>
                </div>

                {/* Impact Analysis */}
                <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 text-xs">
                  <span className="font-bold text-slate-300 uppercase font-mono text-[10px] block mb-1">
                    Legal & Financial Impact Analysis
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {change.impactAnalysis}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
