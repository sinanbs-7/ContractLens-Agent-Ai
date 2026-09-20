import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Bell, 
  Database, 
  Cpu, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle,
  Building,
  Save
} from 'lucide-react';
import { isLiveSupabase } from '../lib/supabaseClient.js';

export const SettingsPage: React.FC = () => {
  const [orgName, setOrgName] = useState('Enterprise Legal Operations');
  const [counselEmail, setCounselEmail] = useState('counsel@contractlens.ai');
  const [noticeWindow, setNoticeWindow] = useState('60');
  const [riskTolerance, setRiskTolerance] = useState('Medium');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-teal-400" />
          <span>Settings & Organization Profile</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure proactive alert schedules, risk thresholds, and inspect backend AI connectivity.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Config */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-800">
            <Building className="w-4 h-4 text-teal-400" />
            <span>Organization & Legal Department Profile</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1.5">
                Organization Entity Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1.5">
                Lead Legal Counsel Notification Email
              </label>
              <input
                type="email"
                value={counselEmail}
                onChange={(e) => setCounselEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Alert Thresholds */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-800">
            <Bell className="w-4 h-4 text-teal-400" />
            <span>Proactive Deadline Alert Thresholds</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1.5">
                Notice Period Advance Alert (Days)
              </label>
              <select
                value={noticeWindow}
                onChange={(e) => setNoticeWindow(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="30">30 Days in advance</option>
                <option value="60">60 Days in advance (Standard Corporate)</option>
                <option value="90">90 Days in advance (Conservative)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1.5">
                Contract Risk Tolerance Policy
              </label>
              <select
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="Low">Strict (Flags all non-mutual clauses & short notices)</option>
                <option value="Medium">Balanced (Flags unlimited liability & penalty hikes)</option>
                <option value="High">Permissive (Flags only catastrophic breach risks)</option>
              </select>
            </div>
          </div>
        </div>

        {/* System Architecture & Connectivity Status */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-800">
            <Cpu className="w-4 h-4 text-teal-400" />
            <span>AI Model & Database Architecture Status</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Supabase Status */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-teal-400" />
                  <span>Supabase PostgreSQL + pgvector</span>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isLiveSupabase 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                }`}>
                  {isLiveSupabase ? 'CONNECTED (LIVE)' : 'ACTIVE (HYBRID DEMO)'}
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Migration script ready in <code className="text-teal-300 font-mono">supabase/migrations/001_initial_schema.sql</code>.
              </p>
            </div>

            {/* Gemini Status */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Google GenAI SDK (2.5 Flash)</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  READY
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Extraction, semantic diffing, and grounded tool-calling active.
              </p>
            </div>
          </div>

          {/* Database Migration Runner Instructions */}
          <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex items-center space-x-2 text-slate-300 font-semibold">
              <Terminal className="w-4 h-4 text-teal-400" />
              <span>Apply PostgreSQL Schema to Supabase Cloud:</span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded text-teal-300 overflow-x-auto select-all">
              npm run migrate
            </div>
            <p className="text-slate-500 text-[11px] font-sans">
              Applies all tables, indexes, vector embeddings, RLS policies, and seed contracts directly to your Supabase PostgreSQL instance.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings updated successfully</span>
            </span>
          )}
          <button
            type="submit"
            className="ml-auto flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 shadow-md shadow-teal-500/20 active:scale-95 transition-all text-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
