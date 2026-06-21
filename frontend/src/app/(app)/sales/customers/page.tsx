'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  balance: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>('/v1/customers');
      const data = Array.isArray(res) ? res : res.data || [];
      setCustomers(
        data.map((c: any) => ({
          id: c.id,
          name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
          email: c.email || '',
          company: c.companyName || c.company || '',
          phone: c.phone || '',
          balance: Number(c.balance || c.outstandingBalance || 0),
        }))
      );
    } catch (err) {
      console.error('Failed to load customers:', err);
      // Fallback to empty
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Customer Name and Email are required.');
      return;
    }

    try {
      await api.post('/v1/customers', { name, email, companyName: company, phone });
      toast.success(`Customer ${name} added.`);
      setName('');
      setEmail('');
      setCompany('');
      setPhone('');
      setIsModalOpen(false);
      loadCustomers();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create customer.');
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (val: number) =>
    val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your customer contacts and view receivable balances.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-base bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-sm shadow-sm"
        >
          <PlusIcon className="w-4 h-4" />
          New Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base pl-9"
        />
      </div>

      {/* Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Company</th>
                <th className="table-header">Email</th>
                <th className="table-header">Phone</th>
                <th className="table-header text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="table-cell text-center py-12 text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                      Loading customers...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-cell text-center py-12 text-slate-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="table-cell font-semibold text-slate-900">
                      <Link href={`/sales/customers/${c.id}`} className="hover:text-brand-600 transition-colors">
                        {c.name}
                      </Link>
                    </td>
                    <td className="table-cell">{c.company}</td>
                    <td className="table-cell text-slate-500">{c.email}</td>
                    <td className="table-cell text-slate-500">{c.phone}</td>
                    <td className="table-cell text-right font-mono font-semibold">
                      <span className={c.balance > 0 ? 'text-amber-600' : 'text-green-600'}>
                        {formatCurrency(c.balance)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-full max-w-md mx-4 animate-in">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add Customer</h2>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-base" placeholder="John Smith" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-base" placeholder="john@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="input-base" placeholder="Company Inc." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-base" placeholder="+1 (555) 123-4567" />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-base flex-1 border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-base flex-1 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-sm shadow-sm">
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
