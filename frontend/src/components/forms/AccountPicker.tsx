'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  description?: string;
}

const DEFAULT_ACCOUNTS: Account[] = [
  // Assets
  { id: '1', code: '1010', name: 'Cash on Hand', type: 'asset' },
  { id: '2', code: '1020', name: 'Checking Account', type: 'asset' },
  { id: '3', code: '1200', name: 'Accounts Receivable', type: 'asset' },
  { id: '4', code: '1400', name: 'Inventory', type: 'asset' },
  // Liabilities
  { id: '5', code: '2000', name: 'Accounts Payable', type: 'liability' },
  { id: '6', code: '2200', name: 'Sales Tax Payable', type: 'liability' },
  { id: '7', code: '2300', name: 'Credit Card', type: 'liability' },
  // Equity
  { id: '8', code: '3000', name: "Owner's Equity", type: 'equity' },
  { id: '9', code: '3100', name: 'Retained Earnings', type: 'equity' },
  // Revenue
  { id: '10', code: '4000', name: 'Sales Revenue', type: 'revenue' },
  { id: '11', code: '4100', name: 'Service Income', type: 'revenue' },
  // Expenses
  { id: '12', code: '5000', name: 'Cost of Goods Sold', type: 'expense' },
  { id: '13', code: '5100', name: 'Rent Expense', type: 'expense' },
  { id: '14', code: '5200', name: 'Utilities Expense', type: 'expense' },
  { id: '15', code: '5300', name: 'Office Supplies', type: 'expense' },
  { id: '16', code: '5400', name: 'Salaries & Wages', type: 'expense' },
];

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

interface AccountPickerProps {
  selectedId?: string;
  onChange: (account: Account) => void;
  error?: string;
  label?: string;
  disabled?: boolean;
}

export default function AccountPicker({
  selectedId,
  onChange,
  error,
  label,
  disabled = false,
}: AccountPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        setLoading(true);
        const data = await api.get<any[]>('/v1/accounting/accounts');
        if (data && Array.isArray(data)) {
          const normalized: Account[] = data.map((acc) => {
            let t = String(acc.type || '').toLowerCase();
            if (t === 'income') t = 'revenue';
            return {
              ...acc,
              type: t as Account['type'],
            };
          });
          setAccounts(normalized);
        }
      } catch (err) {
        console.warn('Could not fetch accounts from backend, using defaults:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAccounts();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLabel = (type: any) => {
    const t = String(type || '').toLowerCase() as Account['type'];
    return TYPE_LABELS[t] || String(type || '');
  };

  const getColorClass = (type: any) => {
    const t = String(type || '').toLowerCase() as Account['type'];
    return TYPE_COLORS[t] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const selectedAccount = accounts.find((a) => a.id === selectedId);

  const filteredAccounts = accounts.filter((account) => {
    if (!account) return false;
    const term = search.toLowerCase();
    const name = String(account.name || '').toLowerCase();
    const code = String(account.code || '').toLowerCase();
    const type = String(account.type || '').toLowerCase();
    return name.includes(term) || code.includes(term) || type.includes(term);
  });

  const groupedAccounts = filteredAccounts.reduce((acc, account) => {
    if (!account) return acc;
    const t = String(account.type || '').toLowerCase() as Account['type'];
    if (!acc[t]) {
      acc[t] = [];
    }
    acc[t].push(account);
    return acc;
  }, {} as Record<Account['type'], Account[]>);

  const handleSelect = (account: Account) => {
    onChange(account);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm bg-white border rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 ${
          error ? 'border-red-300 hover:border-red-400' : 'border-slate-300 hover:border-slate-400'
        } ${disabled ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' : 'text-slate-800'}`}
      >
        {selectedAccount ? (
          <span className="flex items-center gap-2">
            <span className="font-mono text-slate-500 font-semibold">{selectedAccount.code}</span>
            <span className="font-medium text-slate-800">{selectedAccount.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${getColorClass(selectedAccount.type)}`}>
              {getLabel(selectedAccount.type)}
            </span>
          </span>
        ) : (
          <span className="text-slate-400">Select an account...</span>
        )}
        <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 overflow-hidden flex flex-col animate-scale-in">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, name, or type..."
              className="w-full bg-transparent border-none text-sm text-slate-900 focus:outline-none focus:ring-0 p-0 placeholder:text-slate-400"
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto p-1 max-h-60">
            {Object.keys(groupedAccounts).length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-400">
                No accounts match your query
              </div>
            ) : (
              (Object.keys(TYPE_LABELS) as Array<Account['type']>).map((type) => {
                const group = groupedAccounts[type];
                if (!group || group.length === 0) return null;

                return (
                  <div key={type} className="mb-2 last:mb-0">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 rounded">
                      {TYPE_LABELS[type]}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {group.map((account) => {
                        const isSelected = account.id === selectedId;
                        return (
                          <button
                            key={account.id}
                            type="button"
                            onClick={() => handleSelect(account)}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left text-sm transition-colors ${
                              isSelected
                                ? 'bg-brand-50 text-brand-900 font-medium'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="font-mono text-slate-500 font-semibold">{account.code}</span>
                              <span>{account.name}</span>
                            </span>
                            {isSelected && <CheckIcon className="w-4 h-4 text-brand-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
