'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import LineItemEditor, { LineItem } from '@/components/forms/LineItemEditor';
import { api } from '@/lib/api';

export default function NewInvoicePage() {
  const router = useRouter();
  const [formValues, setFormValues] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    reference: '',
  });
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await api.get<any[]>('/v1/customers');
        if (data && Array.isArray(data)) {
          setCustomers(data);
        }
      } catch (err) {
        console.warn('Failed to load customers from backend:', err);
      }
    }
    loadCustomers();
  }, []);

  // Line items state (transaction mode requires quantity, unitPrice, taxRate)
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', accountId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0, debit: 0, credit: 0 },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formValues.customerId) {
      toast.error('Please select a customer.');
      return;
    }

    if (items.some((item) => !item.accountId)) {
      toast.error('Please assign an account to all lines.');
      return;
    }

    if (items.reduce((sum, item) => sum + (item.quantity * item.unitPrice || 0), 0) <= 0) {
      toast.error('Invoice total must be greater than zero.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        customerId: formValues.customerId,
        date: `${formValues.date}T00:00:00Z`,
        dueDate: formValues.dueDate ? `${formValues.dueDate}T00:00:00Z` : `${formValues.date}T00:00:00Z`,
        notes: formValues.reference,
        lines: items.map((item) => ({
          accountId: item.accountId,
          description: item.description || undefined,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxCodeId: item.taxCodeId || undefined,
        })),
      };

      const invoice = await api.post<{ id: string }>('/v1/invoices', payload);
      await api.post(`/v1/invoices/${invoice.id}/post`);
      toast.success('Invoice successfully created.');
      router.push('/sales/invoices');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to create invoice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/sales/invoices"
          className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Invoice</h1>
          <p className="text-sm text-slate-500 mt-0.5">Send itemized invoice to a customer.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-soft grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Customer
            </label>
            <select
              required
              value={formValues.customerId}
              onChange={(e) => setFormValues(prev => ({ ...prev, customerId: e.target.value }))}
              className="input-base appearance-none font-semibold text-slate-800"
            >
              <option value="">Select a customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Invoice Date
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
              Reference
            </label>
            <input
              type="text"
              placeholder="e.g. PO-8902"
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
            href="/sales/invoices"
            className="btn-base bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2 text-sm font-semibold"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-base bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 text-sm font-semibold shadow-soft"
          >
            {loading ? 'Saving...' : 'Save & Issue Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
