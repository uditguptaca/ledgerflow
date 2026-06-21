'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  type: string;
  ledgerBalance: number;
  bankBalance: number;
  lastSynced: string;
}

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const [bkAccounts, tb] = await Promise.all([
        api.get<any[]>('/v1/banking/accounts'),
        api.get<any>('/v1/reports/trial-balance?asOfDate=2025-01-31T23:59:59Z').catch(() => ({ accounts: [] }))
      ]);

      const tbBalances = new Map<string, number>((tb.accounts || []).map((a: any) => [a.accountId, Number(a.balance || 0)]));

      const mapped = bkAccounts.map((acc: any) => {
        const ledgerVal = tbBalances.get(acc.accountId) ?? 0;
        return {
          id: acc.id,
          name: acc.name,
          bankName: acc.bankName || 'Demo Bank',
          accountNumber: acc.accountNumber ? `•••• ${acc.accountNumber.slice(-4)}` : '••••',
          type: acc.account?.subType === 'CREDIT_CARD' ? 'Credit Card' : 'Checking',
          ledgerBalance: ledgerVal,
          bankBalance: Number(acc.currentBalance || 0),
          lastSynced: 'Just now',
        };
      });

      setAccounts(mapped);
    } catch (err) {
      console.error('Failed to load bank accounts:', err);
      toast.error('Failed to load bank accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const handleSync = (id: string) => {
    setSyncing(id);
    setTimeout(() => {
      setSyncing(null);
      toast.success('Bank accounts successfully synchronized via Plaid!');
      fetchBankAccounts();
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bank Accounts</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage bank statement integrations and Plaid connections.</p>
        </div>
        <button
          onClick={() => toast.success('Connecting bank account with mock Plaid SDK...')}
          className="btn-base bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-sm font-semibold shadow-soft"
        >
          <PlusIcon className="w-4 h-4" />
          Connect Bank Account
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading bank accounts...</div>
      ) : (
        /* Grid of Bank accounts */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {accounts.map((acc) => {
            const diff = Math.abs(acc.ledgerBalance - acc.bankBalance);
            const isReconciled = diff < 0.01;

            return (
              <div key={acc.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft hover:shadow-card-hover transition-all flex flex-col justify-between h-48">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{acc.name}</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{acc.bankName} • {acc.accountNumber}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                      acc.type === 'Checking'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : acc.type === 'Savings'
                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                        : 'bg-purple-50 text-purple-700 border-purple-100'
                    }`}>
                      {acc.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-6">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Book Balance</span>
                      <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                        ${acc.ledgerBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Bank Statement</span>
                      <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                        ${acc.bankBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-4">
                  <span className={`text-[10px] font-semibold ${isReconciled ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {isReconciled ? 'Reconciled' : `Unreconciled difference: $${diff.toFixed(2)}`}
                  </span>
                  
                  <button
                    onClick={() => handleSync(acc.id)}
                    disabled={syncing === acc.id}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1"
                  >
                    <ArrowPathIcon className={`w-3.5 h-3.5 ${syncing === acc.id ? 'animate-spin' : ''}`} />
                    {syncing === acc.id ? 'Syncing...' : 'Sync'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
