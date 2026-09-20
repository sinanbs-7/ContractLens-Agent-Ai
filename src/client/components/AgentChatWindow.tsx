import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  Calculator, 
  Quote, 
  Bookmark, 
  AlertCircle,
  FileCheck2,
  ChevronRight
} from 'lucide-react';
import { api, Contract } from '../lib/api.js';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  citations?: Array<{ pageNumber: number; snippet: string; section?: string }>;
  toolsUsed?: Array<{ toolName: string; input: any; result: any }>;
  timestamp: string;
}

interface AgentChatWindowProps {
  contractId?: string;
  contractTitle?: string;
  contracts?: Contract[];
  onSelectCitation?: (citation: string) => void;
}

export const AgentChatWindow: React.FC<AgentChatWindowProps> = ({
  contractId,
  contractTitle,
  contracts = [],
  onSelectCitation
}) => {
  const [selectedContractId, setSelectedContractId] = useState<string | undefined>(contractId);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `Hello, I am ContractLens. I analyze contracts with uncompromising accuracy, extract exact citations, and perform verified mathematical calculations. How can I assist you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contractId) {
      setSelectedContractId(contractId);
    }
  }, [contractId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await api.chatWithAgent(userMessage.content, selectedContractId, history);

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: res.reply,
        citations: res.citations,
        toolsUsed: res.toolsUsed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `Error communicating with legal agent: ${err.message || 'Unknown error'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "What are our indemnification obligations and liability caps?",
    "Calculate notice deadline for expiration 2026-12-31 with 60 days notice",
    "Calculate penalty interest on $60,000 balance overdue for 45 days at 1.5%",
    "What are the termination clauses and notice penalties?"
  ];

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col h-[750px] overflow-hidden">
      {/* Console Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>ContractLens Grounded Agent</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Gemini 2.5 Flash
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Grounded exclusively in source contracts with verbatim citations and precision math tooling.
            </p>
          </div>
        </div>

        {/* Contract Selector */}
        {contracts.length > 0 && !contractId && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-mono">Scope:</span>
            <select
              value={selectedContractId || ''}
              onChange={(e) => setSelectedContractId(e.target.value || undefined)}
              className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-teal-500 max-w-xs truncate"
            >
              <option value="">All Contracts Corpus</option>
              {contracts.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        )}

        {contractTitle && (
          <div className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 max-w-xs truncate">
            Scope: {contractTitle}
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center space-x-2 mb-1 text-[11px] text-slate-500 font-mono">
              <span>{m.role === 'user' ? 'Legal Counsel' : 'ContractLens Agent'}</span>
              <span>•</span>
              <span>{m.timestamp}</span>
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white font-medium shadow-md shadow-teal-500/10'
                  : 'bg-slate-900/90 border border-slate-800 text-slate-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>

              {/* Mathematical Tool Execution Output Badge */}
              {m.toolsUsed && m.toolsUsed.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="text-[10px] font-mono uppercase text-teal-400 font-bold flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Automated Agent Tool Calculations</span>
                  </div>
                  {m.toolsUsed.map((tool, idx) => (
                    <div key={idx} className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 font-mono text-xs">
                      <div className="text-slate-400 font-semibold mb-1">
                        Function: <span className="text-teal-300">{tool.toolName}</span>
                      </div>
                      <div className="text-slate-300 grid grid-cols-2 gap-2 text-[11px]">
                        {Object.entries(tool.result).map(([k, v]) => (
                          <div key={k}>
                            <span className="text-slate-500">{k}:</span>{' '}
                            <span className="font-bold text-slate-200">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pinpoint Citations Chips */}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                  <div className="text-[10px] font-mono uppercase text-teal-400 font-bold flex items-center gap-1">
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Pinpoint Citations</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.citations.map((cit, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSelectCitation && onSelectCitation(cit.snippet)}
                        className="flex items-center space-x-1 text-[11px] px-2.5 py-1 rounded-md bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 transition-colors"
                        title={cit.snippet}
                      >
                        <Quote className="w-3 h-3" />
                        <span>Page {cit.pageNumber} {cit.section ? `(${cit.section})` : ''}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-xs text-teal-400 font-mono p-3 rounded-xl bg-slate-900/60 border border-slate-800 w-fit">
            <Sparkles className="w-4 h-4 animate-spin text-teal-400" />
            <span>Consulting contract corpus and computing exact citations...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-4 py-2 bg-slate-900/40 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[10px] font-mono uppercase text-slate-500 shrink-0">Suggestions:</span>
        {samplePrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="px-2.5 py-1 rounded-full bg-slate-800/70 hover:bg-slate-700 text-slate-300 border border-slate-700/60 shrink-0 text-xs transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask any legal question, request notice math, or audit liability terms..."
          disabled={loading}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 font-bold shadow-md shadow-teal-500/20 active:scale-95 disabled:opacity-40 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
