'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';
import { useCompany } from '@/contexts/CompanyContext';

interface WorkspaceCompany {
  id: string;
  name: string;
  currency: string;
  country: string;
}

export default function WorkspaceSettingsPage() {
  const { currentCompany, refreshCompanies } = useCompany();
  const [companies, setCompanies] = useState<WorkspaceCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [country, setCountry] = useState('US');

  const workspaceId = currentCompany?.workspaceId;

  const loadCompanies = async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const res = await api.get<any[]>(`/v1/companies?workspaceId=${workspaceId}`);
      setCompanies(
        res.map((c) => ({
          id: c.id,
          name: c.name,
          currency: c.baseCurrency,
          country: c.country,
        }))
      );
    } catch (err) {
      console.error('Failed to load workspace companies:', err);
      // Fallback
      setCompanies([
        { id: '1', name: 'BluePeak Construction', currency: 'USD', country: 'US' },
        { id: '2', name: 'Cedar Lane Retail', currency: 'USD', country: 'CA' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, [workspaceId]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('Company Name is required.');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/v1/companies?workspaceId=${workspaceId}`, {
        name,
        baseCurrency: currency,
        country,
      });

      toast.success(`Company ${name} created successfully.`);
      setName('');
      setIsModalOpen(false);
      
      // Reload lists and refresh company context
      await loadCompanies();
      await refreshCompanies();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create company.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (id: string, name: string) => {
    if (companies.length <= 1) {
      toast.error('A workspace must have at least one active company.');
      return;
    }

    if (!confirm(`Are you sure you want to delete company "${name}"? This action will permanently remove all associated ledger data and cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/v1/companies/${id}`);
      toast.success(`Company "${name}" deleted.`);
      
      // Reload and refresh company context
      await loadCompanies();
      await refreshCompanies();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete company. Ensure you have admin access.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Workspace Companies</h1>
          <p className="text-xs text-slate-500 mt-0.5">Segregate entities, subsidiaries, or legal departments.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-base bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-xs font-semibold shadow-soft"
        >
          <PlusIcon className="w-4 h-4" />
          Add Company
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading && companies.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
              Loading companies...
            </div>
          </div>
        ) : (
          companies.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft hover:shadow-card transition-all flex justify-between items-center"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                <p className="text-2xs text-slate-400 font-mono mt-1 uppercase tracking-wider">
                  Currency: {c.currency} | Country: {c.country}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteCompany(c.id, c.name)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Delete Company"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-scale-in">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Create Company</h3>
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Company / Subsidiary Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Holding Europe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Base Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="input-base appearance-none font-semibold text-slate-800"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Country Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="US / CA / GB"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="input-base"
                  />
                </div>
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
                  Create Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
