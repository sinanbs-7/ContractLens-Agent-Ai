import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, ShieldCheck, Lock, Mail, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient.js';

interface AuthPageProps {
  onLoginSuccess?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setMessage('Registration successful! Please check your email for confirmation.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        if (onLoginSuccess) onLoginSuccess();
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    if (onLoginSuccess) onLoginSuccess();
    navigate('/');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel rounded-3xl border border-slate-800 p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-teal-500/20 mb-1">
            <div className="w-full h-full bg-navy-950 rounded-[14px] flex items-center justify-center">
              <Scale className="w-6 h-6 text-teal-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Contract<span className="text-teal-400">Lens</span>
          </h1>
          <p className="text-xs text-slate-400">
            Enterprise Autonomous Contract Intelligence Agent
          </p>
        </div>

        {/* Quick Demo Access Button */}
        <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 text-center space-y-2">
          <div className="flex items-center justify-center space-x-1.5 text-teal-400 text-xs font-bold uppercase tracking-wider font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Evaluation</span>
          </div>
          <p className="text-xs text-slate-300">
            Explore active contracts, RAG grounded chat, and version diffing immediately.
          </p>
          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 text-xs shadow-md shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center space-x-1.5"
          >
            <span>Enter as Lead Corporate Counsel</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-800" />
          <span className="flex-shrink mx-4 text-[10px] uppercase font-mono text-slate-500">
            or authenticate with supabase
          </span>
          <div className="flex-grow border-t border-slate-800" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="counsel@enterprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase font-mono mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-colors"
          >
            {loading ? 'Authenticating...' : isSignUp ? 'Create Legal Account' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="hover:text-teal-400 transition-colors"
          >
            {isSignUp ? 'Already registered? Sign in' : 'Need an enterprise account? Register here'}
          </button>
        </div>
      </div>
    </div>
  );
};
