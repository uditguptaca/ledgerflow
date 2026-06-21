'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function CompanySettingsPage() {
  const [companyName, setCompanyName] = useState('Acme Software Corp');
  const [taxId, setTaxId] = useState('EIN-90-8812022');
  const [address, setAddress] = useState('120 Hawthorne St, Palo Alto, CA 94301');
  const [loading, setLoading] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Company metadata updated successfully.');
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Company Details</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage company details, tax registrations, and invoice headers.</p>
      </div>

      <div className="max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-soft">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Legal Entity Name
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="input-base"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Tax Registration Number / EIN
            </label>
            <input
              type="text"
              required
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="input-base font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Official Registered Address
            </label>
            <textarea
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-base h-20"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-base bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 text-sm font-semibold shadow-soft"
            >
              {loading ? 'Saving...' : 'Save Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
