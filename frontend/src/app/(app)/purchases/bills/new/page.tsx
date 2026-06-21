'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import LineItemEditor, { LineItem } from '@/components/forms/LineItemEditor';
import { api } from '@/lib/api';

export default function NewBillPage() {
  const router = useRouter();
  const [formValues, setFormValues] = useState({
    vendorId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    reference: '',
  });
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function loadVendors() {
      try {
        const data = await api.get<any[]>('/v1/vendors');
        if (data && Array.isArray(data)) {
          setVendors(data);
        }
      } catch (err) {
        console.warn('Failed to load vendors from backend:', err);
      }
    }
    loadVendors();
  }, []);

  const [items, setItems] = useState<LineItem[]>([
    { id: '1', accountId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0, debit: 0, credit: 0 },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formValues.vendorId) {
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
      const payload = {
        vendorId: formValues.vendorId,
        vendorInvoiceNo: formValues.reference || undefined,
        date: `${formValues.date}T00:00:00Z`,
        dueDate: formValues.dueDate ? `${formValues.dueDate}T00:00:00Z` : `${formValues.date}T00:00:00Z`,
        notes: formValues.reference || undefined,
        lines: items.map((item) => ({
          accountId: item.accountId,
          description: item.description || undefined,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxCodeId: item.taxCodeId || undefined,
        })),
      };

      const newBill = await api.post<{ id: string }>('/v1/bills', payload);
      await api.post(`/v1/bills/${newBill.id}/post`);

      toast.success('Bill successfully recorded and posted to Accounts Payable.');
      router.push('/purchases/bills');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to record bill.');
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
              value={formValues.vendorId}
              onChange={(e) => setFormValues(prev => ({ ...prev, vendorId: e.target.value }))}
              className="input-base appearance-none font-semibold text-slate-800"
            >
              <option value="">Select a vendor...</option>
              {vendors.map((v) => (
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
              value={formValues.date}
              onChange={(e) => setFormValues(prev => ({ ...prev, date: e.target.value }))}
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
              value={formValues.dueDate}
              onChange={(e) => setFormValues(prev => ({ ...prev, dueDate: e.target.value }))}
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
              value={formValues.reference}
              onChange={(e) => setFormValues(prev => ({ ...prev, reference: e.target.value }))}
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
