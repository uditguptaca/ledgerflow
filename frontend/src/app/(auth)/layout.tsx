'use client';

import React from 'react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row relative overflow-hidden">
      {/* Left Column: Form Container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-12 xl:px-24 z-10 bg-white">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 font-bold text-2xl text-slate-900 tracking-tight mb-8 hover:opacity-90 transition-opacity">
            <span className="h-10 w-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white shadow-soft font-mono text-xl font-black">L</span>
            <span>Ledger<span className="text-brand-600">Flow</span></span>
          </Link>

          {/* Form wrapper */}
          <div className="bg-white">
            {children}
          </div>
        </div>
      </div>

      {/* Right Column: Premium Promo / Dashboard Preview (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0B0F19] text-white flex-col justify-between p-16 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-700/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none" />

        {/* Top Header: Badge */}
        <div className="z-10 flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
            Accounting SaaS
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-400 font-medium">Double-entry verified engine</span>
        </div>

        {/* Center Graphic: Glassmorphic Dashboard Preview */}
        <div className="z-10 my-auto flex flex-col items-center">
          <div className="w-full max-w-lg bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl relative overflow-hidden group hover:border-white/[0.12] transition-all duration-300">
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.02] to-white/[0.05] pointer-events-none" />
            
            {/* Card Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
                  <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Cedar Lane Retail</h3>
                  <p className="text-[10px] text-slate-400">Golden test company books</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono font-medium">In Balance</span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block mb-1">Total Assets</span>
                <span className="text-sm font-bold text-white font-mono">$78,480.00</span>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block mb-1">Total Liabilities</span>
                <span className="text-sm font-bold text-white font-mono">$20,130.00</span>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block mb-1">Net Income</span>
                <span className="text-sm font-bold text-rose-400 font-mono">-$1,650.00</span>
              </div>
            </div>

            {/* Mini SVG Line Chart */}
            <div className="relative h-32 w-full bg-white/[0.01] rounded-lg border border-white/[0.03] p-2">
              <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
                {/* Grid Lines */}
                <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
                <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
                {/* Area under curve */}
                <path d="M 0 30 L 0 20 Q 20 10 40 18 T 80 8 L 100 15 L 100 30 Z" fill="url(#chartGrad)"/>
                {/* Line path */}
                <path d="M 0 20 Q 20 10 40 18 T 80 8 L 100 15" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round"/>
                {/* Interactive Dot */}
                <circle cx="80" cy="8" r="1.5" fill="#818CF8" className="animate-pulse"/>
              </svg>
              <div className="absolute top-2 right-3 bg-slate-900/90 border border-white/10 px-2 py-0.5 rounded text-[9px] font-mono text-slate-300">
                T4 Paid: $2,260.00
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Value Propositions */}
        <div className="z-10 mt-auto">
          <h2 className="text-xl font-bold mb-4 tracking-tight">Streamline your multi-company books.</h2>
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
            <div className="flex items-start gap-2.5">
              <svg className="w-5 h-5 text-brand-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Multi-Tenant Workspace Isolation</span>
            </div>
            <div className="flex items-start gap-2.5">
              <svg className="w-5 h-5 text-brand-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Instant Balance Sheets & Reports</span>
            </div>
            <div className="flex items-start gap-2.5">
              <svg className="w-5 h-5 text-brand-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Strict Double-Entry Audit Trail</span>
            </div>
            <div className="flex items-start gap-2.5">
              <svg className="w-5 h-5 text-brand-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Bank Reconciliations & Rules</span>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
            <span>© 2026 LedgerFlow Inc. All rights reserved.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

