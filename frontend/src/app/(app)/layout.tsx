'use client';

import React, { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export { useCompany, CompanyProvider } from '@/contexts/CompanyContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

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

  if (!isAuthenticated) {
    return null; // Prevent page flash before redirecting
  }

  return <AppShell>{children}</AppShell>;
}

