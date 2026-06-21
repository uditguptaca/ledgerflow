'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import LineItemEditor, { LineItem } from '@/components/forms/LineItemEditor';
import BalanceCheck from '@/components/reports/BalanceCheck';
import api from '@/lib/api';

export default function NewJournalEntryPage() {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [memo, setMemo] = useState('');
  const [status, setStatus] = useState<'draft' | 'posted'>('posted');
  const [loading, setLoading] = useState(false);

  // Line items state
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', accountId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0, debit: 0, credit: 0 },
    { id: '2', accountId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0, debit: 0, credit: 0 },
  ]);

  const totalDebits = items.reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
  const totalCredits = items.reduce((sum, item) => sum + (Number(item.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.some((item) => !item.accountId)) {
      toast.error('Please assign an account to all line items.');
      return;
    }

    if (totalDebits === 0 && totalCredits === 0) {
      toast.error('Journal entry cannot be empty.');
      return;
    }

    if (!isBalanced) {
      toast.error('The journal entry is unbalanced. Debits must equal Credits.');
      return;
    }

    try {
      setLoading(true);
      const lines = items.map((item) => ({
        accountId: item.accountId,
        debit: Number(item.debit) > 0 ? Number(item.debit).toFixed(4) : undefined,
        credit: Number(item.credit) > 0 ? Number(item.credit).toFixed(4) : undefined,
        description: item.description || undefined,
      }));

      await api.post('/v1/accounting/journals', {
        date: `${date}T12:00:00.000Z`,
        memo: memo || undefined,
        lines,
      });

      toast.success(`Journal entry successfully ${status === 'posted' ? 'posted' : 'saved as draft'}.`);
      router.push('/accounting/journal-entries');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create journal entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/accounting/journal-entries"
          className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Journal Entry</h1>
          <p className="text-sm text-slate-500 mt-0.5">Record double-entry ledger transactions.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-soft grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-base font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Reference
            </label>
            <input
              type="text"
              placeholder="e.g. INV-102 or BANK-PAY"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="input-base font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Memo / Narration
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Allocation of monthly cloud subscription expense"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="input-base"
            />
          </div>
        </div>

        {/* Balance checker widget */}
        <div className="max-w-md">
          <BalanceCheck
            leftValue={totalDebits}
            rightValue={totalCredits}
            leftLabel="Total Debits"
            rightLabel="Total Credits"
            title="Double-Entry Balance Verification"
            helpText="In double-entry bookkeeping, your debits must balance with credits exactly."
          />
        </div>

        {/* Line Items Editor */}
        <LineItemEditor items={items} onChange={setItems} mode="journal" />

        {/* Action Buttons */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-soft">
          <div>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
              <span>Post directly to Ledger:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'posted')}
                className="input-base py-1 w-32 appearance-none font-semibold text-slate-800"
              >
                <option value="posted">Post (Active)</option>
                <option value="draft">Save Draft</option>
              </select>
            </label>
          </div>
          
          <div className="flex gap-3">
            <Link
              href="/accounting/journal-entries"
              className="btn-base bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-base bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 text-sm font-semibold shadow-soft disabled:opacity-50"
            >
              {loading ? 'Submitting...' : status === 'posted' ? 'Post Journal Entry' : 'Save Draft Entry'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
