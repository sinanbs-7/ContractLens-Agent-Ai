import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  FileCheck2, 
  ShieldAlert, 
  RotateCw, 
  Quote, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Obligation } from '../lib/api.js';

interface ObligationsTimelineProps {
  obligations: Obligation[];
  onSelectCitation?: (citation: string) => void;
}

export const ObligationsTimeline: React.FC<ObligationsTimelineProps> = ({ obligations, onSelectCitation }) => {
  const [selectedType, setSelectedType] = useState<string>('All');

  const filteredObligations = obligations.filter(ob => {
    if (selectedType === 'All') return true;
    return ob.obligation_type === selectedType;
  });

  // Sort by due_date ascending
  const sorted = [...filteredObligations].sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const getObligationColor = (type: string) => {
    switch (type) {
      case 'Renewal Notice':
        return {
          badge: 'bg-red-500/10 text-red-400 border-red-500/30',
          indicator: 'bg-red-500 shadow-red-500/50'
        };
      case 'Payment':
        return {
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          indicator: 'bg-emerald-500 shadow-emerald-500/50'
        };
      case 'Deliverable':
        return {
          badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          indicator: 'bg-blue-500 shadow-blue-500/50'
        };
      case 'Audit':
        return {
          badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          indicator: 'bg-purple-500 shadow-purple-500/50'
        };
      default:
        return {
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          indicator: 'bg-amber-500 shadow-amber-500/50'
        };
    }
  };

  const types = ['All', 'Renewal Notice', 'Payment', 'Deliverable', 'Audit', 'Termination'];

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-400" />
            <span>Obligations & Deadlines Timeline</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Chronological schedule of operational deliverables, notice windows, and payment triggers.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                selectedType === t
                  ? 'bg-teal-500 text-navy-950 font-semibold shadow-sm shadow-teal-500/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List */}
      {sorted.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          No obligations found matching the selected filter.
        </div>
      ) : (
        <div className="relative mt-6 pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {sorted.map((item) => {
            const colors = getObligationColor(item.obligation_type);

            return (
              <div key={item.id} className="relative group">
                {/* Timeline node dot */}
                <div className={`absolute -left-[27px] top-1.5 w-3 h-3 rounded-full border-2 border-navy-950 shadow-md ${colors.indicator}`} />

                <div className="glass-card rounded-xl p-4 border border-slate-800/80 hover:border-teal-500/30 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${colors.badge}`}>
                        {item.obligation_type}
                      </span>
                      <span className="text-xs text-slate-300 font-medium px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        Party: <strong className="text-teal-400">{item.party_responsible}</strong>
                      </span>
                      {item.is_recurring && (
                        <span className="text-[11px] text-cyan-400 flex items-center gap-1 font-medium bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/50">
                          <RotateCw className="w-3 h-3" />
                          {item.recurrence_pattern || 'Recurring'}
                        </span>
                      )}
                    </div>

                    {/* Due Date */}
                    <div className="flex items-center space-x-1 text-xs font-mono text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.due_date ? `Due: ${item.due_date}` : 'No fixed date'}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    {item.description}
                  </p>

                  {/* Verbatim Source Citation */}
                  <div 
                    onClick={() => onSelectCitation && onSelectCitation(item.citation_text)}
                    className="mt-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 italic cursor-pointer hover:border-teal-500/40 hover:text-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] text-teal-400 font-mono not-italic mb-1">
                      <span>Source Quote [{item.section_number || 'Section'}, Page {item.page_number}]</span>
                      <span className="text-slate-500 hover:text-teal-300 font-sans">Click to locate in text &rarr;</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Quote className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">"{item.citation_text}"</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
