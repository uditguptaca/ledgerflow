'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPayments = () => {
    setLoading(true);
    api.get<{ data: any[] }>('/v1/payments')
      .then((res) => {
        setPayments(res.data || []);
      })
      .catch((err) => {
        console.error('Failed to load payments:', err);
        toast.error('Failed to load payments.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleVoid = async (id: string) => {
    if (!confirm('Are you sure you want to void this payment? This will reverse the ledger journal entries and restore invoice balances.')) {
      return;
    }

    try {
      setActionLoading(true);
      await api.post(`/v1/payments/${id}/void`);
      toast.success('Payment voided successfully!');
      fetchPayments();
    } catch (err: any) {
      toast.error(err.message || 'Failed to void payment');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    return (
      (p.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.number || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.reference || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track payments received and bank deposits matched.</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-soft">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by payment number, customer or reference..."
            className="input-base pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-sm text-slate-500">Loading payments...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="table-header">Payment Number</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Deposit Account</th>
                  <th className="table-header">Reference / Notes</th>
                  <th className="table-header text-center">Status</th>
                  <th className="table-header text-right">Amount</th>
                  <th className="table-header w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => {
                  const status = p.isVoided ? 'voided' : 'applied';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="table-cell font-bold text-slate-700">{p.number}</td>
                      <td className="table-cell font-mono text-xs">{p.date ? new Date(p.date).toISOString().split('T')[0] : '-'}</td>
                      <td className="table-cell font-medium text-slate-900">{p.customer?.name || 'Unknown'}</td>
                      <td className="table-cell font-medium text-slate-500">{p.bankAccount?.name || 'Cash/Bank Account'}</td>
                      <td className="table-cell text-slate-500">
                        {p.reference && <span className="font-mono text-xs block">Ref: {p.reference}</span>}
                        {p.notes && <span className="text-xs block">{p.notes}</span>}
                      </td>
                      <td className="table-cell text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                          status === 'voided'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="table-cell text-right font-mono font-bold text-slate-800">
                        ${Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="table-cell text-center">
                        {!p.isVoided && (
                          <button
                            onClick={() => handleVoid(p.id)}
                            disabled={actionLoading}
                            className="text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded"
                            title="Void Payment"
                          >
                            <TrashIcon className="w-4.5 h-4.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {!loading && filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">No payments found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
