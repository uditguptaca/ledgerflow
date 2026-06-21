'use client';

import React from 'react';
import Link from 'next/link';
import {
  DocumentTextIcon,
  ClockIcon,
  CalculatorIcon,
  ArrowLongRightIcon,
} from '@heroicons/react/24/outline';

const REPORT_GROUPS = [
  {
    title: 'Financial Statements',
    desc: 'Core regulatory double-entry statements.',
    icon: DocumentTextIcon,
    items: [
      { name: 'Profit & Loss', href: '/reports/profit-loss', desc: 'Assess revenue, expenses, and net margin over time.' },
      { name: 'Balance Sheet', href: '/reports/balance-sheet', desc: 'Reconcile assets, liabilities, and equity balances.' },
      { name: 'Cash Flow', href: '/reports/cash-flow', desc: 'Monitor statement inflows and outflows by category.' },
    ],
  },
  {
    title: 'Aged Ledgers (AR / AP)',
    desc: 'Track outstanding invoice collections and bills.',
    icon: ClockIcon,
    items: [
      { name: 'Aged Receivables', href: '/reports/aged-receivables', desc: 'Analyze customers with outstanding invoice debts.' },
      { name: 'Aged Payables', href: '/reports/aged-payables', desc: 'Identify vendor bills approaching due limits.' },
    ],
  },
  {
    title: 'Taxes & Compliance',
    desc: 'Summarize tax liabilities and audit totals.',
    icon: CalculatorIcon,
    items: [
      { name: 'Tax Summary', href: '/reports/tax-summary', desc: 'Track sales and purchase taxes accrued for filing.' },
    ],
  },
];

export default function ReportsIndexPage() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Financial Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">Generate, audit, and print compliance financial statements.</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {REPORT_GROUPS.map((group) => (
          <div key={group.title} className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft hover:shadow-card transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-brand-600">
                  <group.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{group.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{group.desc}</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {group.items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block group/item hover:bg-slate-50 p-2.5 rounded-lg border border-transparent hover:border-slate-100 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-800 group-hover/item:text-brand-600 transition-colors">
                        {item.name}
                      </span>
                      <ArrowLongRightIcon className="w-4 h-4 text-slate-400 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
