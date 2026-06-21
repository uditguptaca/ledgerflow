'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import ReportTable, { ColumnConfig } from '@/components/reports/ReportTable';
import api from '@/lib/api';

interface TaxRow {
  rateName: string;
  taxRate: number;
  taxableSales: number;
  salesTaxCollected: number;
  taxablePurchases: number;
  purchaseTaxPaid: number;
  netTaxDue: number;
}

export default function TaxSummaryPage() {
  const [data, setData] = useState<TaxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-01-31');

  useEffect(() => {
    const fetchTaxSummary = async () => {
      try {
        setLoading(true);
        const res = await api.get<any>(`/v1/reports/tax-summary?startDate=${startDate}T00:00:00Z&endDate=${endDate}T23:59:59Z`);
        
        // Estimate taxable amounts by grossing up by 13% HST rate
        const hstRate = 0.13;
        const outputTax = Number(res.outputTax || 0);
        const inputTax = Number(res.inputTax || 0);
        const netTax = Number(res.netTaxPayable || 0);

        const row: TaxRow = {
          rateName: 'HST (Ontario - 13.00%)',
          taxRate: 13.00,
          taxableSales: outputTax > 0 ? outputTax / hstRate : 0,
          salesTaxCollected: outputTax,
          taxablePurchases: inputTax > 0 ? inputTax / hstRate : 0,
          purchaseTaxPaid: inputTax,
          netTaxDue: netTax,
        };

        setData([row]);
      } catch (err) {
        console.error('Failed to load tax summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTaxSummary();
  }, [startDate, endDate]);

  const columns: ColumnConfig<TaxRow>[] = [
    {
      header: 'Tax Jurisdiction / Rate',
      accessor: 'rateName',
      className: 'font-semibold text-slate-800',
    },
    {
      header: 'Tax Rate (%)',
      accessor: (row) => `${row.taxRate.toFixed(2)}%`,
      align: 'right',
      className: 'font-mono text-slate-500',
    },
    {
      header: 'Taxable Sales',
      accessor: 'taxableSales',
      type: 'currency',
      align: 'right',
      className: 'font-mono',
    },
    {
      header: 'Sales Tax Collected',
      accessor: 'salesTaxCollected',
      type: 'currency',
      align: 'right',
      className: 'font-mono text-emerald-600',
    },
    {
      header: 'Taxable Purchases',
      accessor: 'taxablePurchases',
      type: 'currency',
      align: 'right',
      className: 'font-mono',
    },
    {
      header: 'Purchase Tax Paid',
      accessor: 'purchaseTaxPaid',
      type: 'currency',
      align: 'right',
      className: 'font-mono text-indigo-650',
    },
    {
      header: 'Net Tax Liability',
      accessor: 'netTaxDue',
      type: 'currency',
      align: 'right',
      className: 'font-mono font-bold text-slate-800',
    },
  ];

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
            <h1 className="text-2xl font-bold text-slate-900">Tax Summary</h1>
            <p className="text-sm text-slate-500 mt-0.5">Accrued sales and purchase tax liabilities for filing.</p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="btn-base bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2 text-sm font-semibold"
        >
          Print Report
        </button>
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

      {/* Report Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading Tax Summary...</div>
      ) : (
        <ReportTable
          data={data}
          columns={columns}
          showGrandTotal={true}
          subtotalColumns={['taxableSales', 'salesTaxCollected', 'taxablePurchases', 'purchaseTaxPaid', 'netTaxDue']}
        />
      )}
    </div>
  );
}
