import React, { useState } from 'react';
import { X, UploadCloud, FileText, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api.js';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (contract: any) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Vendor & Procurement Agreements');
  const [counterparty, setCounterparty] = useState('');
  const [internalEmail, setInternalEmail] = useState('legal.team@enterprise.com');
  const [riskTolerance, setRiskTolerance] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    'Vendor & Procurement Agreements',
    'Customer & Sales Contracts',
    'Partnership & Joint Venture',
    'Corporate & Employment',
    'Real Estate & Equipment'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a contract PDF or TXT file.');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('category', category);
    formData.append('counterparty', counterparty || 'Identified Counterparty');
    formData.append('internalOwnerEmail', internalEmail);
    formData.append('riskToleranceThreshold', riskTolerance);

    try {
      const created = await api.uploadContract(formData);
      onUploadSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to ingest contract.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900/95 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UploadCloud className="w-5 h-5 text-teal-400" />
            <h3 className="text-lg font-bold text-slate-100">Ingest Contract Document</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* File Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1.5">
              Contract Document (PDF or Plain TXT)
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-teal-500 rounded-xl p-6 text-center transition-colors cursor-pointer bg-slate-950/50">
              <input
                type="file"
                accept=".pdf,.txt,.md,text/plain,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="contract-file-upload"
              />
              <label htmlFor="contract-file-upload" className="cursor-pointer block">
                {file ? (
                  <div className="flex items-center justify-center space-x-2 text-teal-300 font-medium text-sm">
                    <FileText className="w-5 h-5" />
                    <span className="truncate max-w-xs">{file.name}</span>
                    <span className="text-xs text-slate-500 font-mono">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <UploadCloud className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-300">Click to select PDF or TXT contract</p>
                    <p className="text-xs text-slate-500">Supports up to 15MB file size</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Document Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1.5">
              Contract Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Master Cloud Platform Services Agreement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Category & Counterparty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1.5">
                Domain Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1.5">
                Counterparty Entity
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Cloud Technologies, Inc."
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Internal Owner & Risk Tolerance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1.5">
                Internal Legal Owner Email
              </label>
              <input
                type="email"
                required
                value={internalEmail}
                onChange={(e) => setInternalEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1.5">
                Risk Tolerance Threshold
              </label>
              <select
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="Low">Low (Strict Risk Flagging)</option>
                <option value="Medium">Medium (Balanced)</option>
                <option value="High">High (Major Violations Only)</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 shadow-md shadow-teal-500/20 active:scale-95 disabled:opacity-50 transition-all"
            >
              {uploading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Analyzing with Gemini 2.5 Flash...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Start Extraction & Vectorization</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
