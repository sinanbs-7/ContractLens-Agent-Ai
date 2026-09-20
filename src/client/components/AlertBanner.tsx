import React from 'react';
import { AlertTriangle, Clock, X, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Alert } from '../lib/api.js';
import { Link } from 'react-router-dom';

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onDismiss }) => {
  const activeAlerts = alerts.filter(a => !a.is_dismissed);

  if (activeAlerts.length === 0) return null;

  // Highlight the most critical alert
  const primaryAlert = activeAlerts.find(a => a.severity === 'Critical') || activeAlerts[0];

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-950/70 border-red-500/40 text-red-200';
      case 'Warning':
        return 'bg-amber-950/70 border-amber-500/40 text-amber-200';
      default:
        return 'bg-blue-950/70 border-blue-500/40 text-blue-200';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'Warning':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <div className={`relative rounded-xl border p-4 backdrop-blur-md shadow-lg transition-all ${getSeverityStyle(primaryAlert.severity)}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="mt-0.5 p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${getSeverityBadge(primaryAlert.severity)}`}>
                  {primaryAlert.severity.toUpperCase()} ALERT
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {primaryAlert.alert_type}
                </span>
                {activeAlerts.length > 1 && (
                  <span className="text-xs text-slate-400 font-medium">
                    +{activeAlerts.length - 1} more alert{activeAlerts.length > 2 ? 's' : ''}
                  </span>
                )}
              </div>
              <h4 className="mt-1 text-sm font-semibold text-white">
                {primaryAlert.title}
              </h4>
              <p className="mt-0.5 text-xs text-slate-300 leading-relaxed">
                {primaryAlert.message}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {primaryAlert.contract_id && (
              <Link
                to={`/contracts/${primaryAlert.contract_id}`}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors"
              >
                <span>View Clause</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
            <button
              onClick={() => onDismiss(primaryAlert.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
