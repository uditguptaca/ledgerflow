'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue';
}

interface CustomerDetails {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  balance: number;
  invoices: InvoiceSummary[];
}

const MOCK_CUSTOMER: Record<string, CustomerDetails> = {
  'CUST-001': {
    id: 'CUST-001',
    name: 'Alice Smith',
    email: 'alice@hooli.xyz',
    company: 'Hooli Inc',
    phone: '+1 (555) 019-2834',
    balance: 14500.0,
    invoices: [
      { id: 'INV-001', invoiceNumber: 'INV-2026-001', date: '2026-06-01', dueDate: '2026-07-01', amount: 10000.0, status: 'unpaid' },
      { id: 'INV-002', invoiceNumber: 'INV-2026-002', date: '2026-05-15', dueDate: '2026-06-15', amount: 4500.0, status: 'overdue' },
      { id: 'INV-003', invoiceNumber: 'INV-2026-003', date: '2026-04-10', dueDate: '2026-05-10', amount: 5000.0, status: 'paid' },
    ],
  },
  'CUST-002': {
    id: 'CUST-002',
    name: 'Richard Hendricks',
    email: 'richard@piedpiper.com',
    company: 'Pied Piper',
    phone: '+1 (555) 021-9988',
    balance: 3400.0,
    invoices: [
      { id: 'INV-004', invoiceNumber: 'INV-2026-004', date: '2026-06-10', dueDate: '2026-07-10', amount: 3400.0, status: 'unpaid' },
    ],
  },
};

export default function CustomerDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const customer = MOCK_CUSTOMER[id] || {
    id: 'CUST-003',
    name: 'Russ Hanneman',
    email: 'russ@threecommas.club',
    company: 'Hanneman Media',
    phone: '+1 (555) 999-3333',
    balance: 18900.0,
    invoices: [
      { id: 'INV-005', invoiceNumber: 'INV-2026-005', date: '2026-06-10', dueDate: '2026-07-10', amount: 18900.0, status: 'unpaid' },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/sales/customers"
          className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{customer.company}</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft">
          <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Outstanding Balance</span>
          <h2 className="text-3xl font-extrabold text-brand-600 mt-2 font-mono">
            ${customer.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft col-span-2 space-y-3">
          <h3 className="text-sm font-bold text-slate-800">Contact Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400 block text-xs">Email Address</span>
              <span className="font-semibold text-slate-700">{customer.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">Phone Number</span>
              <span className="font-semibold text-slate-700">{customer.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-soft">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Customer Invoices</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="table-header">Invoice Number</th>
                <th className="table-header">Issue Date</th>
                <th className="table-header">Due Date</th>
                <th className="table-header text-right">Amount</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customer.invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/20 transition-colors">
                  <td className="table-cell font-semibold text-brand-600">
                    <Link href={`/sales/invoices/${inv.id}`} className="hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="table-cell font-mono text-xs">{inv.date}</td>
                  <td className="table-cell font-mono text-xs">{inv.dueDate}</td>
                  <td className="table-cell text-right font-mono font-semibold text-slate-800">
                    ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="table-cell text-center">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border capitalize ${
                      inv.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : inv.status === 'overdue'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {inv.status}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
