import React, { useState } from 'react';
import { Search, FileText, ExternalLink, Bookmark, Check, Copy, ZoomIn, ZoomOut } from 'lucide-react';
import { Contract } from '../lib/api.js';

interface ContractPDFViewerProps {
  contract: Contract;
  activeCitation?: string | null;
}

export const ContractPDFViewer: React.FC<ContractPDFViewerProps> = ({ contract, activeCitation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fontSize, setFontSize] = useState<number>(14);
  const [copied, setCopied] = useState(false);

  // Extract paragraphs for interactive reading
  const paragraphs = contract.raw_text.split(/\n\n+/);

  const handleCopy = () => {
    navigator.clipboard.writeText(contract.raw_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden flex flex-col h-[750px]">
      {/* Viewer Header Toolbar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-teal-400" />
          <h3 className="font-semibold text-slate-100 text-sm truncate max-w-xs md:max-w-md">
            {contract.title}
          </h3>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Verbatim Text Viewer
          </span>
        </div>

        {/* Toolbar controls: Search, Zoom, Copy */}
        <div className="flex items-center space-x-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search contract text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 w-44"
            />
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 p-0.5 text-xs text-slate-400">
            <button
              onClick={() => setFontSize(Math.max(12, fontSize - 1))}
              className="p-1 hover:text-white transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[10px]">{fontSize}px</span>
            <button
              onClick={() => setFontSize(Math.min(20, fontSize + 1))}
              className="p-1 hover:text-white transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Copy Full Text */}
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Main Dual-Pane Viewer Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#070b14] space-y-4 font-mono leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
        {paragraphs.map((paragraph, index) => {
          const isHighlighted = (activeCitation && paragraph.toLowerCase().includes(activeCitation.toLowerCase())) ||
            (searchTerm && paragraph.toLowerCase().includes(searchTerm.toLowerCase()));

          return (
            <div
              key={index}
              className={`p-3 rounded-lg border transition-all ${
                isHighlighted
                  ? 'bg-teal-500/10 border-teal-500/50 text-teal-100 ring-1 ring-teal-500/30 shadow-md shadow-teal-500/10'
                  : 'bg-slate-900/40 border-slate-800/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1 font-sans">
                <span className="uppercase tracking-wider">Paragraph {index + 1}</span>
                {isHighlighted && (
                  <span className="text-teal-400 font-bold tracking-normal flex items-center gap-1">
                    <Bookmark className="w-3 h-3" /> Pinpoint Citation Matched
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap">{paragraph}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
