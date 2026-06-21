'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Vendor {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  balance: number;
}

const INITIAL_VENDORS: Vendor[] = [
  { id: 'VEND-001', name: 'Amazon Web Services', email: 'billing@aws.amazon.com', company: 'Amazon Web Services LLC', phone: '+1 (800) 280-4800', balance: 1280.5 },
  { id: 'VEND-002', name: 'WeWork Office Space', email: 'tenants@wework.com', company: 'WeWork Inc', phone: '+1 (555) 012-7766', balance: 2400.0 },
  { id: 'VEND-003', name: 'Google Cloud Platform', email: 'payments@google.com', company: 'Google LLC', phone: '+1 (800) 419-0120', balance: 0.0 },
];

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Vendor Name and Email are required.');
      return;
    }

    const newVendor: Vendor = {
      id: `VEND-00${vendors.length + 1}`,
      name,
      email,
      company: company || name,
      phone,
      balance: 0.0,
    };

    setVendors([newVendor, ...vendors]);
    toast.success(`Vendor ${name} added.`);
    
    // Reset Form
    setName('');
    setEmail('');
    setCompany('');
    setPhone('');
    setIsModalOpen(false);
  };

  const filteredVendors = vendors.filter((v) => {
    return (
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase()) ||
      v.company.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendors</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage suppliers, service providers, and accounts payable balances.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-base bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-sm font-semibold shadow-soft"
        >
          <PlusIcon className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-soft">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vendor, contact, or company..."
            className="input-base pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="table-header">Vendor / Contact</th>
                <th className="table-header">Company</th>
                <th className="table-header">Email</th>
                <th className="table-header">Phone</th>
                <th className="table-header text-right">Payable Balance</th>
                <th className="table-header w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVendors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="table-cell font-semibold text-slate-900">{v.name}</td>
                  <td className="table-cell font-medium text-slate-505">{v.company}</td>
                  <td className="table-cell text-slate-600">{v.email}</td>
                  <td className="table-cell text-slate-500 font-mono text-xs">{v.phone || '-'}</td>
                  <td className={`table-cell text-right font-mono font-semibold ${
                    v.balance > 0 ? 'text-amber-600' : 'text-slate-500'
                  }`}>
                    ${v.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="table-cell text-center">
                    <Link
                      href={`/purchases/vendors/${v.id}`}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vendor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Vendor</h3>
            <form onSubmit={handleAddVendor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Vendor Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amazon Web Services"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. AWS LLC"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="billing@vendor.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. +1 (800) 555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-base"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 btn-base bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 py-2 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-base bg-brand-600 hover:bg-brand-700 text-white py-2 font-semibold shadow-soft"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
