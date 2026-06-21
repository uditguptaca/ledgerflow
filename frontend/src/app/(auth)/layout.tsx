'use client';

import React from 'react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-100 opacity-30 blur-3xl pointer-events-none -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-indigo-100 opacity-25 blur-3xl pointer-events-none translate-y-1/2 translate-x-1/2" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <Link href="/" className="flex items-center justify-center gap-2 font-bold text-2xl text-slate-900 tracking-tight mb-6">
          <span className="h-9 w-9 rounded-lg bg-gradient-brand flex items-center justify-center text-white shadow-soft font-mono text-lg">L</span>
          <span>Ledger<span className="text-brand-600">Flow</span></span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-4 shadow-soft rounded-2xl border border-slate-200/80 sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
