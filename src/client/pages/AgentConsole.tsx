import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Contract } from '../lib/api.js';
import { AgentChatWindow } from '../components/AgentChatWindow.js';
import { Bot, Sparkles } from 'lucide-react';

interface AgentConsoleProps {
  contracts: Contract[];
}

export const AgentConsole: React.FC<AgentConsoleProps> = ({ contracts }) => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q');

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Bot className="w-6 h-6 text-teal-400" />
          <span>Autonomous Legal Intelligence Agent Console</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Grounded multi-contract reasoning powered by Gemini 2.5 Flash, pgvector similarity search, and automated calculation tools.
        </p>
      </div>

      <AgentChatWindow contracts={contracts} />
    </div>
  );
};
