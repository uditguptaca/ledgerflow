'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import LineItemEditor, { LineItem } from '@/components/forms/LineItemEditor';

const MOCK_VENDORS = [
  { id: '1', name: 'Amazon Web Services' },
  { id: '2', name: 'WeWork Office Space' },
  { id: '3', name: 'Google Cloud Platform' },
];

export default function NewBillPage() {
  const router = useRouter();
  const [vendorId, setVendorId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState<LineItem[]>([
    { id: '1', accountId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0, debit: 0, credit: 0 },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vendorId) {
      toast.error('Please select a vendor.');
      return;
    }

    if (items.some((item) => !item.accountId)) {
      toast.error('Please assign an account to all lines.');
      return;
    }

    if (items.reduce((sum, item) => sum + (item.quantity * item.unitPrice || 0), 0) <= 0) {
      toast.error('Bill total must be greater than zero.');
      return;
    }

    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success('Bill successfully recorded and posted to Accounts Payable.');
      router.push('/purchases/bills');
    } catch {
      toast.error('Failed to record bill.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/purchases/bills"
          className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Record Bill</h1>
          <p className="text-sm text-slate-500 mt-0.5">Record a vendor invoice / bill to accounts payable.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-soft grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Vendor
            </label>
            <select
              required
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="input-base appearance-none font-semibold text-slate-800"
            >
              <option value="">Select a vendor...</option>
              {MOCK_VENDORS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Bill Date
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
              Due Date
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input-base font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Reference / Invoice #
            </label>
            <input
              type="text"
              placeholder="e.g. AWS-890A"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="input-base font-mono"
            />
          </div>
        </div>

        {/* Transaction Line Items Editor */}
        <LineItemEditor items={items} onChange={setItems} mode="transaction" />

        {/* Footer actions */}
        <div className="flex justify-end gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-soft">
          <Link
            href="/purchases/bills"
            className="btn-base bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2 text-sm font-semibold"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-base bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 text-sm font-semibold shadow-soft"
          >
            {loading ? 'Recording...' : 'Record Vendor Bill'}
          </button>
        </div>
      </form>
    </div>
  );
}
