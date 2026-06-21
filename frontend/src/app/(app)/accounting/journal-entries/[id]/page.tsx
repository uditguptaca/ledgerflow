'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface JournalLine {
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

interface JournalDetails {
  id: string;
  entryNumber: string;
  date: string;
  reference: string;
  memo: string;
  status: 'posted' | 'draft';
  lines: JournalLine[];
}

const MOCK_DETAILS: Record<string, JournalDetails> = {
  'JE-001': {
    id: 'JE-001',
    entryNumber: 'JE-2026-001',
    date: '2026-06-15',
    reference: 'INV-1023',
    memo: 'Record monthly SaaS subscription receipts',
    status: 'posted',
    lines: [
      { accountCode: '1020', accountName: 'Checking Account', description: 'Revenues collected via Stripe', debit: 8900.0, credit: 0 },
      { accountCode: '4000', accountName: 'SaaS Subscriptions', description: 'Sub receipts deferral', debit: 0, credit: 8900.0 },
    ],
  },
  'JE-002': {
    id: 'JE-002',
    entryNumber: 'JE-2026-002',
    date: '2026-06-15',
    reference: 'BILL-450',
    memo: 'AWS cloud hosting invoice accrual',
    status: 'posted',
    lines: [
      { accountCode: '5200', accountName: 'Hosting Expense', description: 'AWS infrastructure fees', debit: 1280.5, credit: 0 },
      { accountCode: '2000', accountName: 'Accounts Payable', description: 'AWS Invoice accrual', debit: 0, credit: 1280.5 },
    ],
  },
};

export default function JournalDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const entry = MOCK_DETAILS[id] || {
    id: 'JE-003',
    entryNumber: 'JE-2026-003',
    date: '2026-06-12',
    reference: 'TX-5098',
    memo: 'Owner cash injection to operating capital',
    status: 'posted',
    lines: [
      { accountCode: '1020', accountName: 'Checking Account', description: 'Owner capital contribution deposit', debit: 25000.0, credit: 0 },
      { accountCode: '3000', accountName: "Owner's Capital", description: 'Deposit contribution credit', debit: 0, credit: 25000.0 },
    ],
  };

  const totalDebits = entry.lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = entry.lines.reduce((sum, line) => sum + line.credit, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link
            href="/accounting/journal-entries"
            className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{entry.entryNumber}</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                entry.status === 'posted'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {entry.status === 'posted' ? 'Posted' : 'Draft'}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">Details and double-entry lines for this transaction.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="btn-base bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2 text-sm font-semibold"
          >
            Print Entry
          </button>
        </div>
      </div>

      {/* Details Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-soft grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</span>
          <span className="mt-1 block text-sm font-semibold text-slate-800 font-mono">{entry.date}</span>
        </div>
        <div>
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Reference</span>
          <span className="mt-1 block text-sm font-semibold text-slate-800 font-mono">{entry.reference || '-'}</span>
        </div>
        <div className="col-span-2">
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Memo / Narration</span>
          <span className="mt-1 block text-sm font-semibold text-slate-800">{entry.memo}</span>
        </div>
      </div>

      {/* Lines Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800">Double-Entry Allocation</h3>
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircleIcon className="w-4 h-4" />
            Verified balanced
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="table-header w-1/4">Account</th>
                <th className="table-header">Description</th>
                <th className="table-header w-32 text-right">Debit</th>
                <th className="table-header w-32 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-sm">
              {entry.lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-slate-50/20 transition-colors">
                  <td className="table-cell font-sans">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 font-semibold">{line.accountCode}</span>
                      <span className="text-slate-800 font-medium">{line.accountName}</span>
                    </div>
                  </td>
                  <td className="table-cell font-sans text-slate-500">{line.description}</td>
                  <td className="table-cell text-right text-slate-800">
                    {line.debit > 0 ? `$${line.debit.toFixed(2)}` : '-'}
                  </td>
                  <td className="table-cell text-right text-slate-800">
                    {line.credit > 0 ? `$${line.credit.toFixed(2)}` : '-'}
                  </td>
                </tr>
              ))}
              {/* Summary Row */}
              <tr className="bg-slate-50 font-bold border-t border-slate-200">
                <td colSpan={2} className="px-4 py-3 text-sm text-slate-800 text-right">
                  Total
                </td>
                <td className="px-4 py-3 text-right text-slate-900 border-t border-double border-slate-400">
                  ${totalDebits.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-slate-900 border-t border-double border-slate-400">
                  ${totalCredits.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
