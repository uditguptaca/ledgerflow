'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get<{ data: any[] }>('/v1/invoices')
      .then((res) => {
        setInvoices(res.data || []);
      })
      .catch((err) => {
        console.error('Failed to load invoices:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredInvoices = invoices.filter((i) => {
    return (
      (i.number || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.customer?.name || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500 mt-0.5">Send billing receipts and track receivables ledger accounts.</p>
        </div>
        <Link
          href="/sales/invoices/new"
          className="btn-base bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-sm font-semibold shadow-soft"
        >
          <PlusIcon className="w-4 h-4" />
          Create Invoice
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-soft">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice # or customer..."
            className="input-base pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-sm text-slate-500">Loading invoices...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="table-header">Invoice Number</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Issue Date</th>
                  <th className="table-header">Due Date</th>
                  <th className="table-header text-right">Amount</th>
                  <th className="table-header text-center">Status</th>
                  <th className="table-header w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const status = (inv.status || 'draft').toLowerCase();
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="table-cell font-semibold text-brand-600">
                        <Link href={`/sales/invoices/${inv.id}`} className="hover:underline">
                          {inv.number}
                        </Link>
                      </td>
                      <td className="table-cell font-medium text-slate-800">{inv.customer?.name || 'Unknown'}</td>
                      <td className="table-cell font-mono text-xs">{inv.date ? new Date(inv.date).toISOString().split('T')[0] : '-'}</td>
                      <td className="table-cell font-mono text-xs">{inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '-'}</td>
                      <td className="table-cell text-right font-mono font-semibold text-slate-800">
                        ${Number(inv.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="table-cell text-center">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border capitalize ${
                          status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : status === 'overdue'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : status === 'draft'
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : status === 'voided'
                            ? 'bg-red-50 text-red-750 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <Link
                          href={`/sales/invoices/${inv.id}`}
                          className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {!loading && filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">No invoices found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
