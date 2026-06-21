'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function GeneralSettingsPage() {
  const [currency, setCurrency] = useState('USD');
  const [fiscalYearEnd, setFiscalYearEnd] = useState('12-31');
  const [lockPeriod, setLockPeriod] = useState('2025-12-31');
  const [loading, setLoading] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('General ledger settings updated.');
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">General Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configure company-wide defaults, fiscal closing dates, and ledger controls.</p>
      </div>

      <div className="max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-soft">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
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
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Fiscal Year End
              </label>
              <select
                value={fiscalYearEnd}
                onChange={(e) => setFiscalYearEnd(e.target.value)}
                className="input-base appearance-none font-semibold text-slate-800"
              >
                <option value="12-31">December 31</option>
                <option value="03-31">March 31</option>
                <option value="06-30">June 30</option>
                <option value="09-30">September 30</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Accounting Period Locking</h3>
            <p className="text-xs text-slate-500 mb-3">
              Locking a period prevents manual journal entries, invoices, or bills from being created or updated before this date. Keep this set to your last closed month/year.
            </p>
            <div className="max-w-xs">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Lock Date</label>
              <input
                type="date"
                value={lockPeriod}
                onChange={(e) => setLockPeriod(e.target.value)}
                className="input-base font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-base bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 text-sm font-semibold shadow-soft"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
