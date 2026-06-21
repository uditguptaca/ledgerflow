'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

interface BillSummary {
  id: string;
  billNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue';
}

interface VendorDetails {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  balance: number;
  bills: BillSummary[];
}

const MOCK_VENDOR: Record<string, VendorDetails> = {
  'VEND-001': {
    id: 'VEND-001',
    name: 'Amazon Web Services',
    email: 'billing@aws.amazon.com',
    company: 'Amazon Web Services LLC',
    phone: '+1 (800) 280-4800',
    balance: 1280.5,
    bills: [
      { id: 'BILL-001', billNumber: 'BILL-AWS-9082', date: '2026-06-15', dueDate: '2026-07-15', amount: 1280.5, status: 'unpaid' },
      { id: 'BILL-002', billNumber: 'BILL-AWS-8890', date: '2026-05-15', dueDate: '2026-06-15', amount: 980.0, status: 'paid' },
    ],
  },
  'VEND-002': {
    id: 'VEND-002',
    name: 'WeWork Office Space',
    email: 'tenants@wework.com',
    company: 'WeWork Inc',
    phone: '+1 (555) 012-7766',
    balance: 2400.0,
    bills: [
      { id: 'BILL-003', billNumber: 'BILL-WW-06', date: '2026-06-01', dueDate: '2026-06-30', amount: 2400.0, status: 'unpaid' },
    ],
  },
};

export default function VendorDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const vendor = MOCK_VENDOR[id] || {
    id: 'VEND-003',
    name: 'Google Cloud Platform',
    email: 'payments@google.com',
    company: 'Google LLC',
    phone: '+1 (800) 419-0120',
    balance: 0.0,
    bills: [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/purchases/vendors"
          className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{vendor.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{vendor.company}</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft">
          <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Payable Balance</span>
          <h2 className="text-3xl font-extrabold text-amber-600 mt-2 font-mono">
            ${vendor.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft col-span-2 space-y-3">
          <h3 className="text-sm font-bold text-slate-800">Vendor Meta</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400 block text-xs">Email Address</span>
              <span className="font-semibold text-slate-700">{vendor.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">Phone Number</span>
              <span className="font-semibold text-slate-700">{vendor.phone || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bills table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-soft">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Bills & Invoices</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="table-header">Bill Number</th>
                <th className="table-header">Issue Date</th>
                <th className="table-header">Due Date</th>
                <th className="table-header text-right">Amount</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendor.bills.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/20 transition-colors">
                  <td className="table-cell font-semibold text-brand-600">
                    <Link href={`/purchases/bills/${b.id}`} className="hover:underline">
                      {b.billNumber}
                    </Link>
                  </td>
                  <td className="table-cell font-mono text-xs">{b.date}</td>
                  <td className="table-cell font-mono text-xs">{b.dueDate}</td>
                  <td className="table-cell text-right font-mono font-semibold text-slate-800">
                    ${b.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="table-cell text-center">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border capitalize ${
                      b.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : b.status === 'overdue'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="table-cell text-center">
                    <Link
                      href={`/purchases/bills/${b.id}`}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {vendor.bills.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-sm text-slate-400">
                    No bills recorded for this vendor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
