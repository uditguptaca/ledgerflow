'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRightIcon,
  CheckIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  DocumentDuplicateIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';

export default function MarketingLandingPage() {
  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900 tracking-tight">
              <span className="h-8 w-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white shadow-soft font-mono">L</span>
              <span>Ledger<span className="text-brand-600">Flow</span></span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Pricing</a>
              <a href="#security" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Security</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="btn-base bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-sm font-semibold shadow-soft"
            >
              Get Started
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 lg:pt-32 lg:pb-24">
        {/* Background Gradients */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),white)] opacity-60" />
        <div className="absolute right-0 top-0 -z-10 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-brand-300 to-indigo-100 opacity-20 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200/50 rounded-full px-3 py-1 text-xs font-semibold text-brand-700 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
            LedgerFlow v2.0 is now live
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight sm:leading-none">
            Modern double-entry bookkeeping, <br className="hidden sm:inline" />
            <span className="text-gradient">engineered for hyper-growth.</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Automated journal entries, real-time financial statements, automated bank reconciliation, and granular audit trails. Built for accountants, founders, and finance teams.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="btn-base bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 text-base font-semibold shadow-soft"
            >
              Start Free Trial
            </Link>
            <a
              href="#features"
              className="btn-base bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-6 py-3 text-base font-semibold"
            >
              Explore Features
            </a>
          </div>

          {/* Interactive Mockup */}
          <div className="mt-16 border border-slate-200 rounded-2xl bg-white shadow-2xl p-4 max-w-5xl mx-auto relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-indigo-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden shadow-inner aspect-[16/10] flex flex-col">
              {/* Fake OS header */}
              <div className="h-10 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <div className="bg-white border border-slate-200 rounded text-[10px] text-slate-400 px-12 py-0.5 mx-auto font-mono">
                  app.ledgerflow.com/dashboard
                </div>
              </div>
              {/* Fake dashboard content */}
              <div className="flex-1 grid grid-cols-5 p-6 gap-6 text-left">
                <div className="col-span-1 space-y-4 border-r border-slate-200 pr-4">
                  <div className="h-4 w-2/3 bg-slate-300 rounded" />
                  <div className="h-3 w-4/5 bg-slate-200 rounded" />
                  <div className="h-3 w-3/4 bg-slate-200 rounded" />
                  <div className="h-3 w-5/6 bg-slate-200 rounded" />
                </div>
                <div className="col-span-4 space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 shadow-sm">
                      <div className="h-3 w-1/2 bg-slate-200 rounded" />
                      <div className="h-6 w-3/4 bg-slate-300 rounded" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 shadow-sm">
                      <div className="h-3 w-1/2 bg-slate-200 rounded" />
                      <div className="h-6 w-3/4 bg-slate-300 rounded" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 shadow-sm">
                      <div className="h-3 w-1/2 bg-slate-200 rounded" />
                      <div className="h-6 w-3/4 bg-slate-300 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-6 h-48 shadow-sm flex flex-col justify-end gap-2">
                    <div className="flex items-end justify-between h-32 px-4 gap-4">
                      <div className="bg-indigo-200 w-full h-1/3 rounded" />
                      <div className="bg-indigo-300 w-full h-1/2 rounded" />
                      <div className="bg-indigo-400 w-full h-3/4 rounded" />
                      <div className="bg-brand-500 w-full h-full rounded" />
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400 font-semibold font-mono">
                      <span>Q1</span>
                      <span>Q2</span>
                      <span>Q3</span>
                      <span>Q4</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold text-brand-600 uppercase tracking-widest">Everything You Need</h2>
            <p className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Powerful subledgers, intuitive reports, and secure control.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl border border-slate-200 hover:border-brand-500/50 hover:shadow-soft transition-all duration-300">
              <div className="h-10 w-10 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600 mb-4">
                <DocumentDuplicateIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Double-Entry Journals</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Ensure accounts are mathematically and legally balanced. Real-time debit and credit checks guide manual journal entry creation.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="p-6 rounded-xl border border-slate-200 hover:border-brand-500/50 hover:shadow-soft transition-all duration-300">
              <div className="h-10 w-10 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600 mb-4">
                <BanknotesIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Invoicing & Bills</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Send beautiful sales invoices, reconcile bills from vendors, tracking payments and tax summaries automatically inside one workflow.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="p-6 rounded-xl border border-slate-200 hover:border-brand-500/50 hover:shadow-soft transition-all duration-300">
              <div className="h-10 w-10 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600 mb-4">
                <PresentationChartLineIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Instant Reports</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Load Profit & Loss statements, Balance Sheets, and Cash Flow statements in seconds, grouped and sorted with subtotal calculations.
              </p>
            </div>
            {/* Feature 4 */}
            <div className="p-6 rounded-xl border border-slate-200 hover:border-brand-500/50 hover:shadow-soft transition-all duration-300">
              <div className="h-10 w-10 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600 mb-4">
                <ArrowPathIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Bank Reconciliation</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Sync with Plaid or import bank statements to match line items to physical cash receipts, ensuring complete compliance and accuracy.
              </p>
            </div>
            {/* Feature 5 */}
            <div className="p-6 rounded-xl border border-slate-200 hover:border-brand-500/50 hover:shadow-soft transition-all duration-300">
              <div className="h-10 w-10 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600 mb-4">
                <ShieldCheckIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Audit Logs & Controls</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Track who changed what when. Lock periods to prevent post-close modifications and maintain complete GAAP and IFRS audit readiness.
              </p>
            </div>
            {/* Feature 6 */}
            <div className="p-6 rounded-xl border border-slate-200 hover:border-brand-500/50 hover:shadow-soft transition-all duration-300">
              <div className="h-10 w-10 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600 mb-4">
                <ChartBarIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Flexible Multi-entity</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Manage multiple companies, currencies, and workspaces with absolute segregation of data and roles, all under a single login.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold text-brand-600 uppercase tracking-widest">Pricing</h2>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Simple, transparent pricing for teams of all sizes.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8">
            {/* Free Tier */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col justify-between shadow-soft">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Starter</h3>
                <p className="text-xs text-slate-400 mt-1">Perfect for freelancers and solo founders.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">$0</span>
                  <span className="text-xs font-semibold text-slate-400">/ month</span>
                </div>
                <ul className="mt-8 space-y-4">
                  <li className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span>Up to 100 journal entries / mo</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span>Basic invoices and bills</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span>P&L and Balance Sheet reports</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/signup"
                className="mt-8 btn-base bg-slate-900 hover:bg-slate-800 text-white w-full py-3 text-sm font-semibold"
              >
                Sign Up for Free
              </Link>
            </div>

            {/* Growth Tier */}
            <div className="bg-white rounded-2xl border-2 border-brand-500 p-8 flex flex-col justify-between shadow-lg relative">
              <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-brand-500 text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                Most Popular
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Growth</h3>
                <p className="text-xs text-slate-400 mt-1">For scaling startups and professional teams.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">$49</span>
                  <span className="text-xs font-semibold text-slate-400">/ month</span>
                </div>
                <ul className="mt-8 space-y-4">
                  <li className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="font-semibold">Unlimited journals, invoices & bills</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span>Bank Reconciliation & imports</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span>Aged Receivables & multi-company</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span>Audit logs and locking periods</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/signup"
                className="mt-8 btn-base bg-brand-600 hover:bg-brand-700 text-white w-full py-3 text-sm font-semibold shadow-soft"
              >
                Start 14-Day Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <span className="h-6 w-6 rounded bg-brand-500 flex items-center justify-center text-white font-mono text-sm">L</span>
            <span>LedgerFlow</span>
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-slate-200 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-200 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-200 transition-colors">Contact Support</a>
          </div>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} LedgerFlow Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
