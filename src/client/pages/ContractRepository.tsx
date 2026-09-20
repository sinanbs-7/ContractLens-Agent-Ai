import React, { useState } from 'react';
import { Search, Filter, PlusCircle, FileText, Building2, SlidersHorizontal } from 'lucide-react';
import { Contract } from '../lib/api.js';
import { ContractCard } from '../components/ContractCard.js';

interface ContractRepositoryProps {
  contracts: Contract[];
  onOpenUpload: () => void;
  onDeleteContract?: (id: string) => void;
}

export const ContractRepository: React.FC<ContractRepositoryProps> = ({
  contracts,
  onOpenUpload,
  onDeleteContract
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minRiskScore, setMinRiskScore] = useState<number>(0);

  const categories = [
    'All',
    'Vendor & Procurement Agreements',
    'Customer & Sales Contracts',
    'Partnership & Joint Venture',
    'Corporate & Employment',
    'Real Estate & Equipment'
  ];

  const filteredContracts = contracts.filter(c => {
    if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
    if (minRiskScore > 0 && (c.risk_score || 0) < minRiskScore) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchCounterparty = c.counterparty.toLowerCase().includes(q);
      if (!matchTitle && !matchCounterparty) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Ingestion trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-400" />
            <span>Contract Repository</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized corporate legal agreements with automated extraction and RAG indexing.
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 shadow-md shadow-teal-500/20 active:scale-95 transition-all text-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Upload Contract</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search contracts or counterparty name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Risk Score Filter */}
          <div className="flex items-center space-x-2 w-full md:w-auto text-xs text-slate-400">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span>Min Risk Score:</span>
            <select
              value={minRiskScore}
              onChange={(e) => setMinRiskScore(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-teal-500 text-xs"
            >
              <option value={0}>All Scores (0+)</option>
              <option value={30}>Medium Risk (30+)</option>
              <option value={50}>High Risk (50+)</option>
              <option value={75}>Critical Risk (75+)</option>
            </select>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm shadow-teal-500/10'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts Grid */}
      {filteredContracts.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No contracts found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or ingest a new PDF or TXT agreement.
          </p>
          <button
            onClick={onOpenUpload}
            className="mt-4 px-4 py-2 rounded-xl bg-teal-500 text-navy-950 font-bold text-xs hover:bg-teal-400 transition-colors"
          >
            Ingest Contract Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              onDelete={onDeleteContract}
            />
          ))}
        </div>
      )}
    </div>
  );
};
