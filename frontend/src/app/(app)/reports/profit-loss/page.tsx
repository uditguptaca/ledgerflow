'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import api from '@/lib/api';

export default function ProfitLossPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-06-21');

  const fetchReport = () => {
    setLoading(true);
    api.get<any>(`/v1/reports/profit-loss?startDate=${startDate}T00:00:00Z&endDate=${endDate}T23:59:59Z`)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error('Failed to load P&L report:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const formatCurrency = (val: any) => {
    const num = Number(val || 0);
    return num.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/reports"
            className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Profit & Loss</h1>
            <p className="text-sm text-slate-500 mt-0.5">Income Statement: assess revenues and overhead margins.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); window.print(); }}
            className="btn-base bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2 text-sm font-semibold"
          >
            Print Report
          </button>
        </div>
      </div>

      {/* Toolbar filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-base py-1 px-2 text-xs w-36 font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-base py-1 px-2 text-xs w-36 font-mono"
            />
          </div>
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          Accrual Basis • USD ($)
        </div>
      </div>

      {/* Financial Statement Sheet Layout */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading Profit & Loss statement...</div>
      ) : !data ? (
        <div className="text-center py-12 text-rose-500">Failed to load report data.</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-soft p-8 max-w-3xl mx-auto space-y-8 font-sans text-sm">
          {/* Title Block */}
          <div className="text-center border-b border-slate-100 pb-6">
            <h2 className="text-lg font-bold text-slate-900">Profit & Loss Statement</h2>
            <p className="text-xs text-slate-500 mt-1">For the period {startDate} to {endDate}</p>
          </div>

          {/* Revenues */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Revenue</h3>
            <div className="space-y-1.5 pl-4">
              {['salesRevenue', 'serviceRevenue', 'otherIncome'].map((sectionKey) => {
                const sec = data.income[sectionKey];
                if (!sec || !sec.accounts || sec.accounts.length === 0) return null;
                return sec.accounts.map((acct: any) => (
                  <div key={acct.accountId} className="flex justify-between">
                    <span className="text-slate-700">{acct.accountCode} - {acct.accountName}</span>
                    <span className="font-mono font-medium">{formatCurrency(acct.balance)}</span>
                  </div>
                ));
              })}
            </div>
            <div className="flex justify-between font-bold border-t border-slate-200 pt-2 pl-4">
              <span>Total Revenue</span>
              <span className="font-mono">{formatCurrency(data.income.totalIncome)}</span>
            </div>
          </div>

          {/* Cost of Goods Sold */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Cost of Goods Sold</h3>
            <div className="space-y-1.5 pl-4">
              {(data.costOfGoodsSold.accounts || []).map((acct: any) => (
                <div key={acct.accountId} className="flex justify-between">
                  <span className="text-slate-700">{acct.accountCode} - {acct.accountName}</span>
                  <span className="font-mono font-medium">{formatCurrency(acct.balance)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold border-t border-slate-200 pt-2 pl-4">
              <span>Total Cost of Goods Sold</span>
              <span className="font-mono">({formatCurrency(data.costOfGoodsSold.total)})</span>
            </div>
          </div>

          {/* Gross Profit margin */}
          <div className="flex justify-between font-extrabold text-base bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span>Gross Profit</span>
            <span className="font-mono">{formatCurrency(data.grossProfit)}</span>
          </div>

          {/* Operating Expenses */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Operating Expenses</h3>
            <div className="space-y-1.5 pl-4">
              {['operatingExpenses', 'payrollExpenses', 'rentExpenses', 'utilityExpenses', 'officeExpenses', 'depreciationExpense', 'travelExpenses'].map((sectionKey) => {
                const sec = data.operatingExpenses[sectionKey];
                if (!sec || !sec.accounts || sec.accounts.length === 0) return null;
                return sec.accounts.map((acct: any) => (
                  <div key={acct.accountId} className="flex justify-between">
                    <span className="text-slate-700">{acct.accountCode} - {acct.accountName}</span>
                    <span className="font-mono font-medium">{formatCurrency(acct.balance)}</span>
                  </div>
                ));
              })}
            </div>
            <div className="flex justify-between font-bold border-t border-slate-200 pt-2 pl-4">
              <span>Total Operating Expenses</span>
              <span className="font-mono">{formatCurrency(data.operatingExpenses.totalOperatingExpenses)}</span>
            </div>
          </div>

          {/* Other Expenses */}
          {Number(data.otherExpenses?.totalOtherExpenses || 0) > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Other Expenses</h3>
              <div className="space-y-1.5 pl-4">
                {['otherExpenses', 'interestExpense', 'taxExpense'].map((sectionKey) => {
                  const sec = data.otherExpenses[sectionKey];
                  if (!sec || !sec.accounts || sec.accounts.length === 0) return null;
                  return sec.accounts.map((acct: any) => (
                    <div key={acct.accountId} className="flex justify-between">
                      <span className="text-slate-700">{acct.accountCode} - {acct.accountName}</span>
                      <span className="font-mono font-medium">{formatCurrency(acct.balance)}</span>
                    </div>
                  ));
                })}
              </div>
              <div className="flex justify-between font-bold border-t border-slate-200 pt-2 pl-4">
                <span>Total Other Expenses</span>
                <span className="font-mono">{formatCurrency(data.otherExpenses.totalOtherExpenses)}</span>
              </div>
            </div>
          )}

          {/* Net Income double line */}
          <div className="flex justify-between font-extrabold text-lg border-t-2 border-b-4 border-slate-900 py-3 bg-slate-950 text-white rounded-lg px-4 shadow-soft">
            <span>Net Income / (Loss)</span>
            <span className="font-mono">{formatCurrency(data.netProfit)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
