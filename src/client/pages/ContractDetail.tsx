import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  ShieldAlert, 
  DollarSign, 
  ArrowLeft, 
  GitCompare, 
  Trash2, 
  Building2, 
  Calendar, 
  Scale, 
  Bot, 
  Bookmark,
  Share2
} from 'lucide-react';
import { Contract, api } from '../lib/api.js';
import { ContractPDFViewer } from '../components/ContractPDFViewer.js';
import { ObligationsTimeline } from '../components/ObligationsTimeline.js';
import { RiskMatrixCard } from '../components/RiskMatrixCard.js';
import { AgentChatWindow } from '../components/AgentChatWindow.js';

export const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'viewer' | 'obligations' | 'risks' | 'agent'>('overview');
  const [activeCitation, setActiveCitation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getContractById(id)
      .then(data => setContract(data))
      .catch(err => setError(err.message || 'Contract not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!contract) return;
    if (confirm(`Are you sure you want to delete "${contract.title}"?`)) {
      try {
        await api.deleteContract(contract.id);
        navigate('/contracts');
      } catch (err: any) {
        alert(err.message || 'Failed to delete contract');
      }
    }
  };

  const handleSelectCitation = (citation: string) => {
    setActiveCitation(citation);
    setActiveTab('viewer');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-mono text-slate-400">Loading contract workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="glass-panel rounded-2xl p-8 max-w-lg mx-auto text-center border border-red-500/30 my-12">
        <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-100">Contract Not Found</h2>
        <p className="text-xs text-slate-400 mt-1">{error || 'The requested contract does not exist.'}</p>
        <Link
          to="/contracts"
          className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-500 text-navy-950 font-bold text-xs hover:bg-teal-400"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Contracts</span>
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview & Metadata', icon: FileText },
    { id: 'viewer', label: 'PDF / Text Viewer', icon: Bookmark },
    { id: 'obligations', label: `Obligations Timeline (${contract.obligations?.length || 0})`, icon: Clock },
    { id: 'risks', label: `Risk Matrix (${contract.risks?.length || 0})`, icon: ShieldAlert },
    { id: 'agent', label: 'Grounded Legal Agent', icon: Bot }
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Back Link & Header */}
      <div>
        <Link
          to="/contracts"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-teal-400 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Contracts Repository</span>
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-teal-400 tracking-wide uppercase px-2.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                {contract.category}
              </span>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Law: {contract.governing_law || 'Unspecified'}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                contract.risk_score >= 75 ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                contract.risk_score >= 50 ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                Risk Score: {contract.risk_score}/100
              </span>
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight leading-snug">
              {contract.title}
            </h1>

            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Counterparty: <strong className="text-slate-200">{contract.counterparty}</strong></span>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center space-x-2 shrink-0 self-start lg:self-auto">
            <Link
              to={`/contracts/compare?a=${contract.id}`}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <GitCompare className="w-4 h-4 text-teal-400" />
              <span>Compare Version</span>
            </Link>

            <button
              onClick={handleDelete}
              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 border border-slate-800 transition-colors"
              title="Delete Contract"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-teal-500 text-navy-950 shadow-md shadow-teal-500/20 font-bold'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-navy-950' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Metadata Summary Card */}
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
              <h3 className="text-base font-bold text-slate-100 pb-3 border-b border-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <span>Extracted Legal Fact Sheet & Commitments</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] uppercase font-mono text-slate-500">Effective Date</span>
                  <div className="text-sm font-semibold text-slate-200 mt-1">
                    {contract.effective_date || 'Not specified'}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] uppercase font-mono text-slate-500">Expiration Date</span>
                  <div className="text-sm font-semibold text-slate-200 mt-1">
                    {contract.expiration_date || 'Indefinite / Not Specified'}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] uppercase font-mono text-slate-500">Renewal Mechanism</span>
                  <div className="text-sm font-semibold text-slate-200 mt-1">
                    {contract.renewal_type} ({contract.notice_period_days} Days Required Notice)
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] uppercase font-mono text-slate-500">Notice Deadline Date</span>
                  <div className="text-sm font-semibold text-red-400 mt-1">
                    {contract.notice_deadline_date || 'Calculated dynamically'}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] uppercase font-mono text-slate-500">Total Contract Value</span>
                  <div className="text-sm font-semibold text-emerald-400 mt-1">
                    {contract.total_value ? `$${contract.total_value.toLocaleString()} ${contract.currency}` : 'Uncapped / Variable'}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] uppercase font-mono text-slate-500">Governing Law Jurisdiction</span>
                  <div className="text-sm font-semibold text-slate-200 mt-1">
                    {contract.governing_law || 'Delaware / New York'}
                  </div>
                </div>
              </div>

              {/* Quick Obligations Preview */}
              <div>
                <h4 className="text-xs font-bold font-mono uppercase text-slate-400 mb-3">
                  Critical Obligations at a Glance
                </h4>
                <div className="space-y-2">
                  {(contract.obligations || []).slice(0, 3).map((ob) => (
                    <div key={ob.id} className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 flex items-start justify-between gap-2 text-xs">
                      <div>
                        <span className="font-semibold text-teal-400 mr-2">[{ob.obligation_type}]</span>
                        <span className="text-slate-200">{ob.description}</span>
                      </div>
                      <span className="font-mono text-slate-400 shrink-0">{ob.due_date || 'Ongoing'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Side Risk Summary Card */}
            <div className="space-y-6">
              <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-orange-400" />
                  <span>Risk Score Evaluation</span>
                </h3>

                <div className="text-center py-4">
                  <div className="text-5xl font-black text-white tracking-tight">
                    {contract.risk_score}
                    <span className="text-lg text-slate-500 font-normal">/100</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    {contract.risk_score >= 75 ? 'CRITICAL EXPOSURE' :
                     contract.risk_score >= 50 ? 'HIGH RISK THRESHOLD' : 'BALANCED POSTURE'}
                  </p>
                </div>

                <div className="space-y-2 text-xs pt-3 border-t border-slate-800">
                  <div className="flex justify-between text-slate-400">
                    <span>Liability Structure</span>
                    <span className="text-red-400 font-bold">Asymmetrical</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Renewal Lockout</span>
                    <span className="text-orange-400 font-bold">{contract.notice_period_days} Days Strict</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Indemnity Mutual</span>
                    <span className="text-red-400 font-bold">Unilateral</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('risks')}
                  className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  Review Risk Matrix & Redlines &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'viewer' && (
          <ContractPDFViewer
            contract={contract}
            activeCitation={activeCitation}
          />
        )}

        {activeTab === 'obligations' && (
          <ObligationsTimeline
            obligations={contract.obligations || []}
            onSelectCitation={handleSelectCitation}
          />
        )}

        {activeTab === 'risks' && (
          <RiskMatrixCard
            risks={contract.risks || []}
            onSelectCitation={handleSelectCitation}
          />
        )}

        {activeTab === 'agent' && (
          <AgentChatWindow
            contractId={contract.id}
            contractTitle={contract.title}
            onSelectCitation={handleSelectCitation}
          />
        )}
      </div>
    </div>
  );
};
