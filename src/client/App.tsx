import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Navbar } from './components/Navbar.js';
import { AlertBanner } from './components/AlertBanner.js';
import { UploadModal } from './components/UploadModal.js';
import { Dashboard } from './pages/Dashboard.js';
import { ContractRepository } from './pages/ContractRepository.js';
import { ContractDetail } from './pages/ContractDetail.js';
import { VersionDiff } from './pages/VersionDiff.js';
import { AgentConsole } from './pages/AgentConsole.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { AuthPage } from './pages/AuthPage.js';
import { api, Contract, Alert } from './lib/api.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30000
    }
  }
});

function AppContent() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Fetch contracts
  const { data: contracts = [], refetch: refetchContracts } = useQuery<Contract[]>({
    queryKey: ['contracts'],
    queryFn: () => api.getContracts()
  });

  // Fetch active alerts
  const { data: alerts = [], refetch: refetchAlerts } = useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: () => api.getActiveAlerts()
  });

  const handleDismissAlert = async (id: string) => {
    try {
      await api.dismissAlert(id);
      refetchAlerts();
    } catch (err: any) {
      console.error('Failed to dismiss alert', err);
    }
  };

  const handleDeleteContract = async (id: string) => {
    if (confirm('Are you sure you want to delete this contract and all associated records?')) {
      try {
        await api.deleteContract(id);
        refetchContracts();
        refetchAlerts();
      } catch (err: any) {
        alert(err.message || 'Failed to delete contract');
      }
    }
  };

  const handleUploadSuccess = () => {
    refetchContracts();
    refetchAlerts();
  };

  const activeAlerts = alerts.filter(a => !a.is_dismissed);

  return (
    <div className="min-h-screen flex flex-col bg-[#060a12] text-slate-100 font-sans">
      <Navbar
        activeAlertCount={activeAlerts.length}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Real-time Alert Stream Banner */}
      <AlertBanner
        alerts={alerts}
        onDismiss={handleDismissAlert}
      />

      {/* Main Routes */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                contracts={contracts}
                alerts={alerts}
                onOpenUpload={() => setIsUploadOpen(true)}
                onDeleteContract={handleDeleteContract}
              />
            }
          />
          <Route
            path="/contracts"
            element={
              <ContractRepository
                contracts={contracts}
                onOpenUpload={() => setIsUploadOpen(true)}
                onDeleteContract={handleDeleteContract}
              />
            }
          />
          <Route
            path="/contracts/compare"
            element={<VersionDiff contracts={contracts} />}
          />
          <Route
            path="/contracts/:id"
            element={<ContractDetail />}
          />
          <Route
            path="/agent"
            element={<AgentConsole contracts={contracts} />}
          />
          <Route
            path="/settings"
            element={<SettingsPage />}
          />
          <Route
            path="/auth"
            element={<AuthPage />}
          />
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </main>

      {/* Upload Contract Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900/80 bg-navy-950/60 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ContractLens Intelligence Agent • Grounded in Gemini 2.5 Flash & pgvector</span>
          <span className="text-slate-600">Enterprise Legal Automation</span>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
