'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Show a premium loading screen while resolving authentication state
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 select-none">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-bold text-slate-500 mt-4 animate-pulse-soft">
          Loading LedgerFlow workspace...
        </p>
      </div>
    );
  }

  // Render raw content (e.g. Login, SignUp, or external landings) without AppShell
  if (!isAuthenticated) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-55">
      {/* Navigation Drawer */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main panel containing header and page content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Main Header */}
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Primary Page Content Wrapper */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-8">
          <div className="mx-auto max-w-7xl w-full animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
