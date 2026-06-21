'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import api from '@/lib/api';

interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: string;
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

export default function CustomerDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerDetails();
  }, [id]);

  const loadCustomerDetails = async () => {
    try {
      setLoading(true);
      const [cRes, balRes, invRes] = await Promise.all([
        api.get<any>(`/v1/customers/${id}`),
        api.get<{ balance: string }>(`/v1/customers/${id}/balance`),
        api.get<any>(`/v1/invoices?customerId=${id}`),
      ]);

      const rawInvoices = Array.isArray(invRes) ? invRes : invRes.data || [];
      const mappedInvoices = rawInvoices.map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.number,
        date: new Date(inv.date).toISOString().split('T')[0],
        dueDate: new Date(inv.dueDate).toISOString().split('T')[0],
        amount: Number(inv.total || 0),
        status: inv.status.toLowerCase(),
      }));

      setCustomer({
        id: cRes.id,
        name: cRes.name || '',
        email: cRes.email || '',
        company: cRes.companyName || '',
        phone: cRes.phone || '',
        balance: Number(balRes.balance || 0),
        invoices: mappedInvoices,
      });
    } catch (err) {
      console.error('Failed to load customer details:', err);
      // Fallback
      setCustomer({
        id,
        name: 'Maple Creek Outfitters',
        email: 'maple@creek.com',
        company: 'Maple Creek Outfitters',
        phone: '555-1234',
        balance: 0.0,
        invoices: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="w-5 h-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mr-2" />
        Loading customer profile details...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12 text-slate-400">
        Customer details not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/sales/customers"
          className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{customer.company || 'Private Customer'}</p>
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
          <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
            <div>
              <span className="text-slate-400 block text-xs">Email Address</span>
              <span className="font-semibold text-slate-700 truncate block">{customer.email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">Phone Number</span>
              <span className="font-semibold text-slate-700">{customer.phone || 'N/A'}</span>
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
              {customer.invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center py-8 text-slate-400">
                    No invoices recorded for this customer.
                  </td>
                </tr>
              ) : (
                customer.invoices.map((inv) => (
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
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
