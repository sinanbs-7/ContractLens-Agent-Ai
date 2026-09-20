import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  GitCompare, 
  Bot, 
  LayoutDashboard, 
  Settings, 
  PlusCircle, 
  Bell,
  ShieldAlert,
  Scale
} from 'lucide-react';

interface NavbarProps {
  activeAlertCount?: number;
  onOpenUpload?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeAlertCount = 0, onOpenUpload }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/contracts', label: 'Contracts', icon: FileText },
    { path: '/contracts/compare', label: 'Version Diff', icon: GitCompare },
    { path: '/agent', label: 'Agent Console', icon: Bot },
    { path: '/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-navy-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-400 p-0.5 shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/40 transition-all">
                <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
                  <Scale className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-teal-300">
                  Contract<span className="text-teal-400 font-extrabold">Lens</span>
                </span>
                <span className="text-[10px] tracking-widest text-slate-400 uppercase font-mono">
                  Autonomous Legal Agent
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-sm shadow-teal-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions: Alert Counter, Upload Button, User Badge */}
          <div className="flex items-center space-x-3">
            {/* Active Alerts Pill */}
            <Link
              to="/"
              className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
              title={`${activeAlertCount} active alerts`}
            >
              <Bell className="w-5 h-5" />
              {activeAlertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-navy-950 animate-pulse">
                  {activeAlertCount}
                </span>
              )}
            </Link>

            {/* Ingest Contract Button */}
            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-navy-950 font-semibold shadow-md shadow-teal-500/20 hover:shadow-teal-500/30 transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Ingest Contract</span>
              </button>
            )}

            {/* Active Workspace / User */}
            <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-800 text-xs">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-teal-400 text-xs">
                CL
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-slate-200 font-medium leading-tight">Senior Counsel</span>
                <span className="text-slate-400 text-[10px]">Contract Intelligence</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
