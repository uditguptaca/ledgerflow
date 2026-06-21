'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import AccountPicker from '@/components/forms/AccountPicker';
import api from '@/lib/api';

interface Expense {
  id: string;
  date: string;
  category: string;
  payee: string;
  method: string;
  status: string;
  amount: number;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [payeeName, setPayeeName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const [expRes, bankRes] = await Promise.all([
        api.get<{ data: any[] }>('/v1/expenses'),
        api.get<any[]>('/v1/banking/accounts')
      ]);

      const mapped = (expRes.data || []).map((e: any) => ({
        id: e.id,
        date: new Date(e.date).toISOString().split('T')[0],
        category: e.account?.name || 'Expense Category',
        payee: e.vendor?.name || e.description || 'Direct Expense',
        method: e.bankAccount?.name || 'Credit Card / Accounts Payable',
        status: e.isVoided ? 'voided' : 'posted',
        amount: Number(e.amount || 0),
      }));

      setExpenses(mapped);
      setBankAccounts(bankRes || []);
      if (bankRes && bankRes.length > 0) {
        setBankAccountId(bankRes[0].id);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
      toast.error('Failed to load expenses data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId) {
      toast.error('Please select an account and enter an amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/v1/expenses', {
        accountId,
        bankAccountId: bankAccountId || undefined,
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
        description: payeeName || undefined,
        reference: reference || undefined,
        notes: notes || undefined,
      });

      toast.success('Expense successfully recorded!');
      setIsModalOpen(false);
      
      // Reset
      setPayeeName('');
      setAmount('');
      setAccountId('');
      setAccountName('');
      setNotes('');
      setReference('');

      fetchExpenses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoid = async (id: string) => {
    if (!confirm('Are you sure you want to void this expense? This will reverse the journal entries.')) {
      return;
    }
    try {
      await api.post(`/v1/expenses/${id}/void`);
      toast.success('Expense voided successfully!');
      fetchExpenses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to void expense.');
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    return (
      e.payee.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-500 mt-0.5">Record direct card payments, cash outflows, and contractor fees.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-base bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-sm font-semibold shadow-soft"
        >
          <PlusIcon className="w-4 h-4" />
          Record Expense
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
            placeholder="Search by payee or account..."
            className="input-base pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-sm text-slate-500">Loading expenses...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="table-header">Date</th>
                  <th className="table-header">Payee / Description</th>
                  <th className="table-header">Account / Category</th>
                  <th className="table-header">Payment Source</th>
                  <th className="table-header text-center">Status</th>
                  <th className="table-header text-right">Amount</th>
                  <th className="table-header w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="table-cell font-mono text-xs">{exp.date}</td>
                    <td className="table-cell font-semibold text-slate-900">{exp.payee}</td>
                    <td className="table-cell">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border">
                        {exp.category}
                      </span>
                    </td>
                    <td className="table-cell text-slate-500 text-xs font-semibold">{exp.method}</td>
                    <td className="table-cell text-center">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border capitalize ${
                        exp.status === 'voided'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {exp.status}
                      </span>
                    </td>
                    <td className="table-cell text-right font-mono font-bold text-slate-800">
                      ${exp.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="table-cell text-center">
                      {exp.status !== 'voided' && (
                        <button
                          onClick={() => handleVoid(exp.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded"
                          title="Void Expense"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Record Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Record Expense</h3>
            <form onSubmit={handleRecordExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Payee Name / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Staples Inc"
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  className="input-base"
                />
              </div>

              <div>
                <AccountPicker
                  label="Expense Account"
                  selectedId={accountId}
                  onChange={(account) => {
                    setAccountId(account.id);
                    setAccountName(account.name);
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Amount Paid
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input-base font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Date Paid
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input-base font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Paid From Bank Account
                </label>
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="input-base appearance-none cursor-pointer"
                >
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.bankName || 'Demo Bank'})
                    </option>
                  ))}
                  <option value="">Accounts Payable fallback</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Reference
                  </label>
                  <input
                    type="text"
                    placeholder="Receipt / Check #"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Internal notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
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
                  disabled={isSubmitting}
                  className="flex-1 btn-base bg-brand-600 hover:bg-brand-700 text-white py-2 font-semibold shadow-soft"
                >
                  {isSubmitting ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
