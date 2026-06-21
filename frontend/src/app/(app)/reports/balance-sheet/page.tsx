'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import api from '@/lib/api';

export default function BalanceSheetPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [asOfDate, setAsOfDate] = useState('2025-01-31');

  const fetchReport = () => {
    setLoading(true);
    api.get<any>(`/v1/reports/balance-sheet?asOfDate=${asOfDate}T23:59:59Z`)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error('Failed to load Balance Sheet:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReport();
  }, [asOfDate]);

  const formatCurrency = (val: any) => {
    const num = Number(val || 0);
    return num.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  // Helper to get total of multiple asset/liability sections
  const getSectionsTotal = (sections: any[]) => {
    return sections.reduce((sum, sec) => sum + Number(sec?.total || 0), 0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
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
            <h1 className="text-2xl font-bold text-slate-900">Balance Sheet</h1>
            <p className="text-sm text-slate-500 mt-0.5">Asset, Liability, and Equity balances checklist.</p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="btn-base bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2 text-sm font-semibold"
        >
          Print Balance Sheet
        </button>
      </div>

      {/* Date filter */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-soft">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase">As of Date:</label>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="input-base py-1.5 w-40 font-mono"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          Accrual Basis • USD ($)
        </div>
      </div>

      {/* Sheet Frame */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading Balance Sheet...</div>
      ) : !data ? (
        <div className="text-center py-12 text-rose-500">Failed to load report data.</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-soft p-8 max-w-3xl mx-auto space-y-8 font-sans text-sm">
          {/* Company Title */}
          <div className="text-center border-b border-slate-100 pb-6">
            <h2 className="text-lg font-bold text-slate-900">Balance Sheet Statement</h2>
            <p className="text-xs text-slate-500 mt-1">As of <span className="font-mono">{asOfDate}</span></p>
          </div>

          {/* ASSETS */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Assets</h3>
            
            {/* Current Assets */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 italic pl-2">Current Assets</h4>
              <div className="space-y-1.5 pl-6">
                {['cashAndBank', 'accountsReceivable', 'inventory', 'currentAssets', 'taxReceivable'].map((key) => {
                  const sec = data.assets[key];
                  if (!sec || !sec.accounts || sec.accounts.length === 0) return null;
                  return sec.accounts.map((acct: any) => (
                    <div key={acct.accountId} className="flex justify-between">
                      <span className="text-slate-700">{acct.accountCode} - {acct.accountName}</span>
                      <span className="font-mono font-medium">{formatCurrency(acct.balance)}</span>
                    </div>
                  ));
                })}
              </div>
              <div className="flex justify-between font-semibold border-t border-slate-100 pt-1.5 pl-6 text-slate-700">
                <span>Total Current Assets</span>
                <span className="font-mono">
                  {formatCurrency(
                    getSectionsTotal([
                      data.assets.cashAndBank,
                      data.assets.accountsReceivable,
                      data.assets.inventory,
                      data.assets.currentAssets,
                      data.assets.taxReceivable
                    ])
                  )}
                </span>
              </div>
            </div>

            {/* Long-term Assets */}
            {(data.assets.fixedAssets?.accounts?.length > 0 || data.assets.otherAssets?.accounts?.length > 0) && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 italic pl-2">Long-Term Assets</h4>
                <div className="space-y-1.5 pl-6">
                  {['fixedAssets', 'otherAssets'].map((key) => {
                    const sec = data.assets[key];
                    if (!sec || !sec.accounts || sec.accounts.length === 0) return null;
                    return sec.accounts.map((acct: any) => (
                      <div key={acct.accountId} className="flex justify-between">
                        <span className="text-slate-700">{acct.accountCode} - {acct.accountName}</span>
                        <span className="font-mono font-medium">{formatCurrency(acct.balance)}</span>
                      </div>
                    ));
                  })}
                </div>
                <div className="flex justify-between font-semibold border-t border-slate-100 pt-1.5 pl-6 text-slate-700">
                  <span>Total Long-Term Assets</span>
                  <span className="font-mono">
                    {formatCurrency(getSectionsTotal([data.assets.fixedAssets, data.assets.otherAssets]))}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-between font-extrabold text-base bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span>Total Assets</span>
              <span className="font-mono">{formatCurrency(data.assets.totalAssets)}</span>
            </div>
          </div>

          {/* LIABILITIES */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Liabilities</h3>

            {/* Current Liabilities */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 italic pl-2">Current Liabilities</h4>
              <div className="space-y-1.5 pl-6">
                {['accountsPayable', 'currentLiabilities', 'taxPayable', 'otherLiabilities'].map((key) => {
                  const sec = data.liabilities[key];
                  if (!sec || !sec.accounts || sec.accounts.length === 0) return null;
                  return sec.accounts.map((acct: any) => (
                    <div key={acct.accountId} className="flex justify-between">
                      <span className="text-slate-700">{acct.accountCode} - {acct.accountName}</span>
                      <span className="font-mono font-medium">{formatCurrency(acct.balance)}</span>
                    </div>
                  ));
                })}
              </div>
              <div className="flex justify-between font-semibold border-t border-slate-100 pt-1.5 pl-6 text-slate-700">
                <span>Total Current Liabilities</span>
                <span className="font-mono">
                  {formatCurrency(
                    getSectionsTotal([
                      data.liabilities.accountsPayable,
                      data.liabilities.currentLiabilities,
                      data.liabilities.taxPayable,
                      data.liabilities.otherLiabilities
                    ])
                  )}
                </span>
              </div>
            </div>

            {/* Long-term Liabilities */}
            {data.liabilities.longTermLiabilities?.accounts?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 italic pl-2">Long-Term Liabilities</h4>
                <div className="space-y-1.5 pl-6">
                  {(data.liabilities.longTermLiabilities.accounts || []).map((acct: any) => (
                    <div key={acct.accountId} className="flex justify-between">
                      <span className="text-slate-700">{acct.accountCode} - {acct.accountName}</span>
                      <span className="font-mono font-medium">{formatCurrency(acct.balance)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-semibold border-t border-slate-100 pt-1.5 pl-6 text-slate-700">
                  <span>Total Long-Term Liabilities</span>
                  <span className="font-mono">{formatCurrency(data.liabilities.longTermLiabilities.total)}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between font-bold border-t border-slate-200 pt-2 pl-4 text-slate-800">
              <span>Total Liabilities</span>
              <span className="font-mono">{formatCurrency(data.liabilities.totalLiabilities)}</span>
            </div>
          </div>

          {/* EQUITY */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Equity</h3>
            <div className="space-y-1.5 pl-6">
              {['ownersEquity', 'retainedEarnings', 'otherEquity'].map((key) => {
                const sec = data.equity[key];
                if (!sec || !sec.accounts || sec.accounts.length === 0) return null;
                return sec.accounts.map((acct: any) => (
                  <div key={acct.accountId} className="flex justify-between">
                    <span className="text-slate-700">{acct.accountCode} - {acct.accountName}</span>
                    <span className="font-mono font-medium">{formatCurrency(acct.balance)}</span>
                  </div>
                ));
              })}
              {Number(data.equity.currentYearEarnings || 0) !== 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-700 italic">Net Income / (Loss) for Current Year</span>
                  <span className="font-mono font-medium">{formatCurrency(data.equity.currentYearEarnings)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between font-bold border-t border-slate-200 pt-2 pl-4 text-slate-850">
              <span>Total Equity</span>
              <span className="font-mono">{formatCurrency(data.equity.totalEquity)}</span>
            </div>
          </div>

          {/* Total Liabilities & Equity double line */}
          <div className="flex justify-between font-extrabold text-base border-t-2 border-b-4 border-slate-900 py-3 bg-slate-950 text-white rounded-lg px-4 shadow-soft">
            <span>Total Liabilities & Equity</span>
            <span className="font-mono">{formatCurrency(data.totalLiabilitiesAndEquity)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
