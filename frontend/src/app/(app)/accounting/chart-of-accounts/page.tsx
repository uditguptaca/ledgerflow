'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  description?: string;
  balance: number;
}

const TYPE_LABELS: Record<Account['type'], string> = {
  asset: 'Assets',
  liability: 'Liabilities',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expenses',
};

const TYPE_COLORS: Record<Account['type'], string> = {
  asset: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  liability: 'bg-blue-50 text-blue-700 border-blue-200',
  equity: 'bg-purple-50 text-purple-700 border-purple-200',
  revenue: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  expense: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<Account['type']>('asset');
  const [desc, setDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const [res, tb] = await Promise.all([
        api.get<any[]>('/v1/accounting/accounts'),
        api.get<any>('/v1/reports/trial-balance?asOfDate=2025-01-31T23:59:59Z').catch(() => ({ accounts: [] }))
      ]);

      const tbBalances = new Map<string, number>((tb.accounts || []).map((a: any) => [a.accountId, Number(a.balance || 0)]));

      const mapped = res.map((acc: any) => {
        let mappedType: Account['type'] = 'asset';
        const t = acc.type.toLowerCase();
        if (t === 'asset') mappedType = 'asset';
        else if (t === 'liability') mappedType = 'liability';
        else if (t === 'equity') mappedType = 'equity';
        else if (t === 'income') mappedType = 'revenue';
        else if (t === 'expense') mappedType = 'expense';

        // Retrieve actual balance from TB
        const balanceVal = tbBalances.get(acc.id) ?? 0;

        return {
          id: acc.id,
          code: acc.code,
          name: acc.name,
          type: mappedType,
          description: acc.description,
          balance: balanceVal,
        };
      });
      setAccounts(mapped);
    } catch (err) {
      console.error('Failed to load accounts:', err);
      toast.error('Failed to load accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      toast.error('Account Code and Name are required.');
      return;
    }

    if (accounts.some((a) => a.code === code)) {
      toast.error('An account with this code already exists.');
      return;
    }

    try {
      setIsSubmitting(true);

      const typeUpper = type === 'revenue' ? 'INCOME' : type.toUpperCase();
      const normalBalance = type === 'asset' || type === 'expense' ? 'DEBIT' : 'CREDIT';
      
      let subType = 'CURRENT_ASSET';
      if (type === 'liability') subType = 'CURRENT_LIABILITY';
      else if (type === 'equity') subType = 'OWNERS_EQUITY';
      else if (type === 'revenue') subType = 'SALES_REVENUE';
      else if (type === 'expense') subType = 'OPERATING_EXPENSE';

      await api.post('/v1/accounting/accounts', {
        code,
        name,
        type: typeUpper,
        subType,
        normalBalance,
        description: desc,
      });

      toast.success(`Account ${code} - ${name} added.`);
      
      // Reset Form
      setCode('');
      setName('');
      setType('asset');
      setDesc('');
      setIsModalOpen(false);
      
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.name.toLowerCase().includes(search.toLowerCase()) ||
      acc.code.includes(search) ||
      (acc.description && acc.description.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter = filterType === 'all' || acc.type === filterType;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Chart of Accounts</h1>
          <p className="text-sm text-slate-500 mt-0.5">Define your ledger accounts for double-entry transactions.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-base bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-sm font-semibold shadow-soft"
        >
          <PlusIcon className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-soft">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, or description..."
            className="input-base pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'asset', 'liability', 'equity', 'revenue', 'expense'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
                filterType === t
                  ? 'bg-slate-950 text-white border-slate-950'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t === 'all' ? 'All Types' : TYPE_LABELS[t as Account['type']]}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-sm text-slate-500">Loading accounts...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="table-header w-24">Code</th>
                  <th className="table-header">Name</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Description</th>
                  <th className="table-header text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="table-cell font-mono font-bold text-slate-500">{acc.code}</td>
                    <td className="table-cell font-medium text-slate-900">{acc.name}</td>
                    <td className="table-cell">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold capitalize ${TYPE_COLORS[acc.type]}`}>
                        {TYPE_LABELS[acc.type]}
                      </span>
                    </td>
                    <td className="table-cell text-slate-500 max-w-xs truncate">{acc.description || '-'}</td>
                    <td className={`table-cell text-right font-mono font-semibold ${
                      acc.balance < 0 ? 'text-rose-600' : 'text-slate-800'
                    }`}>
                      ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && filteredAccounts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">No accounts match the filters.</p>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Account</h3>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Account Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1010"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="input-base font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Cash"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Account Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Account['type'])}
                  className="input-base appearance-none cursor-pointer"
                >
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
                  <option value="equity">Equity</option>
                  <option value="revenue">Revenue</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  placeholder="What is this account used for?"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="input-base h-20"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 btn-base bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 py-2 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-base bg-brand-600 hover:bg-brand-700 text-white py-2 font-semibold shadow-soft"
                >
                  {isSubmitting ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
