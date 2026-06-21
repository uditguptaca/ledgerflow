'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function BillDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBill = () => {
    setLoading(true);
    api.get<any>(`/v1/bills/${id}`)
      .then((res) => {
        setBill(res);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load bill');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (id) {
      fetchBill();
    }
  }, [id]);

  const handlePost = async () => {
    try {
      setActionLoading(true);
      await api.post(`/v1/bills/${id}/post`);
      toast.success('Bill posted successfully!');
      fetchBill();
    } catch (err: any) {
      toast.error(err.message || 'Failed to post bill');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVoid = async () => {
    if (!confirm('Are you sure you want to void this bill? This will reverse all ledger entries.')) {
      return;
    }
    try {
      setActionLoading(true);
      await api.post(`/v1/bills/${id}/void`);
      toast.success('Bill voided successfully!');
      fetchBill();
    } catch (err: any) {
      toast.error(err.message || 'Failed to void bill');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Loading bill details...</div>;
  }

  if (error || !bill) {
    return (
      <div className="text-center py-12 text-rose-500">
        <p>{error || 'Bill not found'}</p>
        <Link href="/purchases/bills" className="mt-4 inline-block text-brand-600 hover:underline">
          Back to Bills
        </Link>
      </div>
    );
  }

  const status = (bill.status || 'draft').toLowerCase();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link
            href="/purchases/bills"
            className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{bill.number}</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border capitalize ${
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
            </div>
            <p className="text-sm text-slate-500 mt-0.5">Recorded vendor bill statement.</p>
          </div>
        </div>

        <div className="flex gap-2">
          {status === 'draft' && (
            <button
              onClick={handlePost}
              disabled={actionLoading}
              className="btn-base bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-sm font-semibold shadow-soft"
            >
              Post Bill
            </button>
          )}
          {(status === 'pending' || status === 'overdue' || status === 'partially_paid') && (
            <button
              onClick={handleVoid}
              disabled={actionLoading}
              className="btn-base bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2 text-sm font-semibold"
            >
              Void Bill
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="btn-base bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2 text-sm font-semibold"
          >
            Print Bill Details
          </button>
        </div>
      </div>

      {/* Details Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-slate-200 rounded-xl p-6 shadow-soft">
        <div>
          <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Vendor</span>
          <span className="mt-1 block text-sm font-bold text-slate-800">{bill.vendor?.name}</span>
          <span className="block text-xs text-slate-500 font-mono mt-0.5">{bill.vendor?.email || '-'}</span>
        </div>
        <div>
          <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Date & Term</span>
          <span className="mt-1 block text-sm text-slate-700">
            Bill Date: <span className="font-mono font-semibold">{bill.date ? new Date(bill.date).toISOString().split('T')[0] : '-'}</span>
          </span>
          <span className="block text-xs text-rose-500 font-semibold mt-0.5">
            Due Date: <span className="font-mono">{bill.dueDate ? new Date(bill.dueDate).toISOString().split('T')[0] : '-'}</span>
          </span>
        </div>
        <div>
          <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice Reference</span>
          <span className="mt-1 block text-sm font-semibold text-slate-800 font-mono">{bill.reference || '-'}</span>
        </div>
      </div>

      {/* Bill Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="table-header">Description</th>
                <th className="table-header w-20 text-right">Qty</th>
                <th className="table-header w-32 text-right">Unit Price</th>
                <th className="table-header w-20 text-right">Tax Rate</th>
                <th className="table-header w-32 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(bill.lines || []).map((line: any, index: number) => {
                const taxRate = line.taxCode ? Number(line.taxCode.rate) * 100 : 0;
                return (
                  <tr key={index} className="hover:bg-slate-50/20 transition-colors">
                    <td className="table-cell font-medium text-slate-800">{line.description}</td>
                    <td className="table-cell text-right font-mono">{Number(line.quantity)}</td>
                    <td className="table-cell text-right font-mono">${Number(line.unitPrice).toFixed(2)}</td>
                    <td className="table-cell text-right font-mono">{taxRate}%</td>
                    <td className="table-cell text-right font-mono font-semibold text-slate-800">
                      ${Number(line.lineTotal).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bill Summary */}
        <div className="flex justify-end p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="w-80 space-y-2 font-mono text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span>${Number(bill.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax Total:</span>
              <span>${Number(bill.taxTotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-800 pt-2 border-t border-slate-200">
              <span>Total:</span>
              <span>${Number(bill.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 pt-1">
              <span>Amount Paid:</span>
              <span>${Number(bill.amountPaid).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-rose-500 font-bold">
              <span>Amount Due:</span>
              <span>${Number(bill.amountDue).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
