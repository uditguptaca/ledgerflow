'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowTrendingDownIcon,
  BanknotesIcon,
  CreditCardIcon,
  ScaleIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/solid';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import api from '@/lib/api';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePeriodText, setActivePeriodText] = useState('2025 Active');
  const [activeMonthYearLabel, setActiveMonthYearLabel] = useState('Jan 2025');
  const [activeMonthEndLabel, setActiveMonthEndLabel] = useState('Jan 31');
  const [chartDataState, setChartDataState] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // 1. Load recent journals first to determine active period
        const journals = await api.get<any>('/v1/accounting/journals?limit=5');
        const txs = journals.data || [];
        setTransactions(txs);

        // Default to current date if no transactions exist
        let activeYear = new Date().getFullYear();
        let activeMonth = new Date().getMonth(); // 0-indexed

        if (txs.length > 0) {
          const latestTxDate = new Date(txs[0].date);
          activeYear = latestTxDate.getFullYear();
          activeMonth = latestTxDate.getMonth();
        }

        const monthLabel = new Date(activeYear, activeMonth, 1).toLocaleString('en-US', { month: 'short' });
        const monthName = new Date(activeYear, activeMonth, 1).toLocaleString('en-US', { month: 'long' });
        const lastDay = new Date(activeYear, activeMonth + 1, 0).getDate();

        setActivePeriodText(`${monthLabel} ${activeYear} Active`);
        setActiveMonthYearLabel(`${monthLabel} ${activeYear}`);
        setActiveMonthEndLabel(`${monthName.slice(0, 3)} ${lastDay}`);

        // 2. Query active month P&L and Balance Sheet
        const startDateStr = new Date(Date.UTC(activeYear, activeMonth, 1)).toISOString();
        const endDateStr = new Date(Date.UTC(activeYear, activeMonth + 1, 0, 23, 59, 59, 999)).toISOString();
        const asOfDateStr = new Date(Date.UTC(activeYear, activeMonth + 1, 0, 23, 59, 59, 999)).toISOString();

        const pl = await api.get<any>(`/v1/reports/profit-loss?startDate=${startDateStr}&endDate=${endDateStr}`);
        const bs = await api.get<any>(`/v1/reports/balance-sheet?asOfDate=${asOfDateStr}`);

        setMetrics({
          revenue: Number(pl.income?.totalIncome || 0),
          expenses: Number(pl.operatingExpenses?.totalOperatingExpenses || 0),
          netProfit: Number(pl.netProfit || 0),
          cashOnHand: Number(bs.assets?.cashAndBank?.total || 0),
        });

        // 3. Fetch last 6 months P&L for charts
        const monthsToFetch = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(activeYear, activeMonth - i, 1);
          monthsToFetch.push({
            year: d.getFullYear(),
            month: d.getMonth(),
            label: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
          });
        }

        const monthlyReports = await Promise.all(
          monthsToFetch.map(async (m) => {
            const mStart = new Date(Date.UTC(m.year, m.month, 1)).toISOString();
            const mEnd = new Date(Date.UTC(m.year, m.month + 1, 0, 23, 59, 59, 999)).toISOString();
            try {
              const r = await api.get<any>(`/v1/reports/profit-loss?startDate=${mStart}&endDate=${mEnd}`);
              return {
                month: m.label,
                revenue: Number(r.income?.totalIncome || 0),
                expenses: Number(r.operatingExpenses?.totalOperatingExpenses || 0),
              };
            } catch (err) {
              console.error(`Failed to fetch P&L for ${m.label}:`, err);
              return { month: m.label, revenue: 0, expenses: 0 };
            }
          })
        );
        setChartDataState(monthlyReports);

      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const chartData = chartDataState;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time overview of your company financial health.</p>
        </div>
        <div className="text-xs bg-indigo-50 border border-indigo-200/50 text-indigo-700 px-3 py-1.5 rounded-lg font-semibold font-mono">
          Fiscal Period: {activePeriodText}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading dashboard...</div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Revenue */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft hover:shadow-card-hover transition-all">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revenue ({activeMonthYearLabel})</span>
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <BanknotesIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-900 font-mono">{formatCurrency(metrics?.revenue || 0)}</h3>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 mt-2 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
                  Real-time
                </span>
              </div>
            </div>

            {/* Expenses */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft hover:shadow-card-hover transition-all">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expenses ({activeMonthYearLabel})</span>
                <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                  <CreditCardIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-900 font-mono">{formatCurrency(metrics?.expenses || 0)}</h3>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 mt-2 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                  <ArrowTrendingDownIcon className="w-3.5 h-3.5" />
                  Real-time
                </span>
              </div>
            </div>

            {/* Net Income */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft hover:shadow-card-hover transition-all">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Profit / (Loss)</span>
                <div className="p-2 bg-indigo-50 rounded-lg text-brand-600">
                  <ArrowTrendingUpIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className={`text-2xl font-bold font-mono ${metrics?.netProfit < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {formatCurrency(metrics?.netProfit || 0)}
                </h3>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 mt-2 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200/50">
                  Period ending {activeMonthEndLabel}
                </span>
              </div>
            </div>

            {/* Cash Balance */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft hover:shadow-card-hover transition-all">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cash on Hand</span>
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <ScaleIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-900 font-mono">{formatCurrency(metrics?.cashOnHand || 0)}</h3>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 mt-2 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200/50">
                  Reconciled
                </span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft lg:col-span-2">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Revenue vs Expenses ({activeMonthYearLabel})</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'semibold' }} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#F43F5E" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Profit Margin Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">Operating Cashflow</h3>
                <p className="text-xs text-slate-400">Monthly inflow vs outflow analysis</p>
              </div>
              <div className="h-56 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="revenue" name="Inflow" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Outflow" fill="#E0E7FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="border-t border-slate-100 pt-3 mt-3 text-xs flex justify-between text-slate-500 font-semibold">
                <span>Net Growth Rate:</span>
                <span className={`font-bold font-mono ${metrics?.netProfit < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {metrics?.revenue > 0 ? ((metrics.netProfit / metrics.revenue) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>
          </div>

          {/* Transactions list */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Recent Transactions</h3>
                <p className="text-xs text-slate-400 mt-0.5">Most recent general ledger entries.</p>
              </div>
              <Link href="/accounting/general-ledger" className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors bg-brand-50 hover:bg-brand-100/70 border border-brand-200 px-3 py-1.5 rounded-lg">
                View All Ledger
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="table-header">Date</th>
                    <th className="table-header">Journal #</th>
                    <th className="table-header">Memo</th>
                    <th className="table-header">Source Type</th>
                    <th className="table-header text-right">Debit / Credit Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((t) => {
                    const totalAmount = (t.lines || []).reduce((sum: number, l: any) => sum + Number(l.debit || 0), 0);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="table-cell font-mono text-xs">{new Date(t.date).toISOString().split('T')[0]}</td>
                        <td className="table-cell font-semibold text-brand-600">
                          <Link href={`/accounting/journal-entries/${t.id}`} className="hover:underline">
                            {t.number}
                          </Link>
                        </td>
                        <td className="table-cell font-medium text-slate-800">{t.memo}</td>
                        <td className="table-cell">
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border capitalize">
                            {t.sourceType.toLowerCase()}
                          </span>
                        </td>
                        <td className="table-cell text-right font-mono font-semibold text-slate-800">
                          {formatCurrency(totalAmount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
