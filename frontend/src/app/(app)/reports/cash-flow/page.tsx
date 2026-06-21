'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import api from '@/lib/api';

export default function CashFlowPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-01-31');

  const fetchReport = () => {
    setLoading(true);
    api.get<any>(`/v1/reports/cash-flow?startDate=${startDate}T00:00:00Z&endDate=${endDate}T23:59:59Z`)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error('Failed to load Cash Flow statement:', err);
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
            <h1 className="text-2xl font-bold text-slate-900">Cash Flow</h1>
            <p className="text-sm text-slate-500 mt-0.5">Statement of cash inflows and outflows by business activity.</p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="btn-base bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2 text-sm font-semibold"
        >
          Print Statement
        </button>
      </div>

      {/* Date Filter */}
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
          Indirect Method • USD ($)
        </div>
      </div>

      {/* Sheet Frame */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading Cash Flow statement...</div>
      ) : !data ? (
        <div className="text-center py-12 text-rose-500">Failed to load report data.</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-soft p-8 max-w-3xl mx-auto space-y-8 font-sans text-sm">
          {/* Title Block */}
          <div className="text-center border-b border-slate-100 pb-6">
            <h2 className="text-lg font-bold text-slate-900">Statement of Cash Flows</h2>
            <p className="text-xs text-slate-500 mt-1">For the period {startDate} to {endDate}</p>
          </div>

          {/* OPERATING */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Operating Activities</h3>
            <div className="space-y-1.5 pl-4">
              <div className="flex justify-between">
                <span className="text-slate-700">Net Income / (Loss)</span>
                <span className="font-mono font-medium">{formatCurrency(data.operatingActivities.netIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700 italic">Adjustments to reconcile Net Income to Cash:</span>
              </div>
              <div className="flex justify-between pl-4">
                <span className="text-slate-600">Depreciation & Amortization</span>
                <span className="font-mono font-medium">{formatCurrency(data.operatingActivities.adjustments.depreciation)}</span>
              </div>
              <div className="flex justify-between pl-4">
                <span className="text-slate-600">Change in Accounts Receivable</span>
                <span className="font-mono font-medium">{formatCurrency(data.operatingActivities.adjustments.accountsReceivable)}</span>
              </div>
              <div className="flex justify-between pl-4">
                <span className="text-slate-600">Change in Accounts Payable</span>
                <span className="font-mono font-medium">{formatCurrency(data.operatingActivities.adjustments.accountsPayable)}</span>
              </div>
              <div className="flex justify-between pl-4">
                <span className="text-slate-600">Change in Inventory</span>
                <span className="font-mono font-medium">{formatCurrency(data.operatingActivities.adjustments.inventory)}</span>
              </div>
              {Number(data.operatingActivities.adjustments.otherCurrentAssets || 0) !== 0 && (
                <div className="flex justify-between pl-4">
                  <span className="text-slate-600">Change in Other Current Assets (Taxes, etc.)</span>
                  <span className="font-mono font-medium">{formatCurrency(data.operatingActivities.adjustments.otherCurrentAssets)}</span>
                </div>
              )}
              {Number(data.operatingActivities.adjustments.otherCurrentLiabilities || 0) !== 0 && (
                <div className="flex justify-between pl-4">
                  <span className="text-slate-600">Change in Other Current Liabilities (Sales Tax, etc.)</span>
                  <span className="font-mono font-medium">{formatCurrency(data.operatingActivities.adjustments.otherCurrentLiabilities)}</span>
                </div>
              )}
              {Number(data.operatingActivities.adjustments.creditCard || 0) !== 0 && (
                <div className="flex justify-between pl-4">
                  <span className="text-slate-600">Change in Credit Card Liabilities</span>
                  <span className="font-mono font-medium">{formatCurrency(data.operatingActivities.adjustments.creditCard)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between font-bold border-t border-slate-200 pt-2 pl-4 text-slate-800">
              <span>Net Cash from Operating Activities</span>
              <span className="font-mono">{formatCurrency(data.operatingActivities.totalOperatingCashFlow)}</span>
            </div>
          </div>

          {/* INVESTING */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Investing Activities</h3>
            <div className="space-y-1.5 pl-4">
              <div className="flex justify-between">
                <span className="text-slate-700">Capital Purchases (Fixed Assets)</span>
                <span className="font-mono font-medium">{formatCurrency(data.investingActivities.fixedAssetPurchases)}</span>
              </div>
            </div>
            <div className="flex justify-between font-bold border-t border-slate-200 pt-2 pl-4 text-slate-800">
              <span>Net Cash from Investing Activities</span>
              <span className="font-mono">{formatCurrency(data.investingActivities.totalInvestingCashFlow)}</span>
            </div>
          </div>

          {/* FINANCING */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Financing Activities</h3>
            <div className="space-y-1.5 pl-4">
              {Number(data.financingActivities.equityChanges || 0) !== 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-700">Owner Capital Investment / Contribution</span>
                  <span className="font-mono font-medium">{formatCurrency(data.financingActivities.equityChanges)}</span>
                </div>
              )}
              {Number(data.financingActivities.retainedEarningsChanges || 0) !== 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-700">Retained Earnings Changes</span>
                  <span className="font-mono font-medium">{formatCurrency(data.financingActivities.retainedEarningsChanges)}</span>
                </div>
              )}
              {Number(data.financingActivities.longTermDebtChanges || 0) !== 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-700">Bank Loan Inflow / Payments</span>
                  <span className="font-mono font-medium">{formatCurrency(data.financingActivities.longTermDebtChanges)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between font-bold border-t border-slate-200 pt-2 pl-4 text-slate-800">
              <span>Net Cash from Financing Activities</span>
              <span className="font-mono">{formatCurrency(data.financingActivities.totalFinancingCashFlow)}</span>
            </div>
          </div>

          {/* Reconciliation Block */}
          <div className="border-t-2 border-slate-200 pt-4 space-y-3">
            <div className="flex justify-between text-slate-600 font-semibold pl-4">
              <span>Net Increase / (Decrease) in Cash</span>
              <span className="font-mono font-bold text-slate-800">{formatCurrency(data.netChangeInCash)}</span>
            </div>
            <div className="flex justify-between text-slate-600 font-semibold pl-4">
              <span>Beginning Cash Balance</span>
              <span className="font-mono font-medium">{formatCurrency(data.beginningCashBalance)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-base border-t-2 border-b-4 border-slate-900 py-3 bg-slate-950 text-white rounded-lg px-4 shadow-soft">
              <span>Ending Cash Balance</span>
              <span className="font-mono">{formatCurrency(data.endingCashBalance)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
