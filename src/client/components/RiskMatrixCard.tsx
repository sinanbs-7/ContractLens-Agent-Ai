import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Lightbulb, 
  Quote,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Risk } from '../lib/api.js';

interface RiskMatrixCardProps {
  risks: Risk[];
  onSelectCitation?: (citation: string) => void;
}

export const RiskMatrixCard: React.FC<RiskMatrixCardProps> = ({ risks, onSelectCitation }) => {
  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(risks[0]?.id || null);

  const getRiskSeverityBadge = (level: string) => {
    switch (level) {
      case 'Critical':
        return {
          badge: 'bg-red-500/10 text-red-400 border-red-500/40',
          dot: 'bg-red-500 animate-pulse'
        };
      case 'High':
        return {
          badge: 'bg-orange-500/10 text-orange-400 border-orange-500/40',
          dot: 'bg-orange-500'
        };
      case 'Medium':
        return {
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/40',
          dot: 'bg-amber-500'
        };
      default:
        return {
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40',
          dot: 'bg-emerald-500'
        };
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedRiskId(expandedRiskId === id ? null : id);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <span>Contract Risk Matrix & Clause Analysis</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic risk scoring and suggested redline mitigations for unbalanced clauses.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {risks.length} Clauses Flagged
        </span>
      </div>

      {/* Risk Accordion List */}
      <div className="mt-5 space-y-3">
        {risks.map((risk) => {
          const isExpanded = expandedRiskId === risk.id;
          const severity = getRiskSeverityBadge(risk.risk_level);

          return (
            <div
              key={risk.id}
              className={`rounded-xl border transition-all overflow-hidden ${
                isExpanded
                  ? 'bg-slate-900/80 border-slate-700 ring-1 ring-slate-700/50'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Accordion Trigger Header */}
              <button
                onClick={() => toggleExpand(risk.id)}
                className="w-full p-4 text-left flex items-center justify-between gap-3 focus:outline-none"
              >
                <div className="flex items-center space-x-3">
                  <div className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-xs font-bold ${severity.badge}`}>
                    <span className={`w-2 h-2 rounded-full ${severity.dot}`} />
                    <span>{risk.risk_level.toUpperCase()}</span>
                  </div>

                  <span className="text-xs font-semibold uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {risk.clause_category}
                  </span>

                  <h4 className="text-sm font-semibold text-slate-200 line-clamp-1">
                    {risk.explanation.slice(0, 75)}...
                  </h4>
                </div>

                <div className="flex items-center space-x-2 text-slate-400">
                  <span className="text-[11px] font-mono">Page {risk.page_number}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Accordion Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 space-y-3 text-xs">
                  {/* Full Explanation */}
                  <div>
                    <h5 className="text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                      Legal Exposure & Assessment
                    </h5>
                    <p className="text-slate-200 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                      {risk.explanation}
                    </p>
                  </div>

                  {/* Mitigation Suggestion */}
                  {risk.mitigation_suggestion && (
                    <div className="bg-teal-950/20 border border-teal-500/30 p-3 rounded-lg">
                      <div className="flex items-center space-x-1.5 text-teal-400 font-semibold mb-1">
                        <Lightbulb className="w-4 h-4" />
                        <span>Recommended Redline & Mitigation Strategy</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">
                        {risk.mitigation_suggestion}
                      </p>
                    </div>
                  )}

                  {/* Verbatim Source Quote */}
                  <div 
                    onClick={() => onSelectCitation && onSelectCitation(risk.citation_text)}
                    className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-400 italic cursor-pointer hover:border-teal-500/40 hover:text-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] text-teal-400 font-mono not-italic mb-1">
                      <span>Source Quote [Page {risk.page_number}]</span>
                      <span className="text-slate-500 font-sans hover:text-teal-300">Click to locate in viewer &rarr;</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Quote className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                      <span>"{risk.citation_text}"</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
