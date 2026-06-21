'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import ReportTable, { ColumnConfig } from '@/components/reports/ReportTable';
import api from '@/lib/api';

interface AgedReceivablesRow {
  customer: string;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
  total: number;
}

export default function AgedReceivablesPage() {
  const [data, setData] = useState<AgedReceivablesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [asOfDate, setAsOfDate] = useState('2025-01-31');

  useEffect(() => {
    const fetchAgedReceivables = async () => {
      try {
        setLoading(true);
        const res = await api.get<any>(`/v1/reports/aged-receivables?asOfDate=${asOfDate}T23:59:59Z`);
        const mapped = (res.customers || []).map((c: any) => ({
          customer: c.customerName,
          current: Number(c.current || 0),
          days1to30: Number(c.days1to30 || 0),
          days31to60: Number(c.days31to60 || 0),
          days61to90: Number(c.days61to90 || 0),
          days90plus: Number(c.days90plus || 0),
          total: Number(c.total || 0),
        }));
        setData(mapped);
      } catch (err) {
        console.error('Failed to load aged receivables:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgedReceivables();
  }, [asOfDate]);

  const columns: ColumnConfig<AgedReceivablesRow>[] = [
    {
      header: 'Customer',
      accessor: 'customer',
      className: 'font-semibold text-slate-800',
    },
    {
      header: 'Current',
      accessor: 'current',
      type: 'currency',
      align: 'right',
      className: 'font-mono',
    },
    {
      header: '1 - 30 Days',
      accessor: 'days1to30',
      type: 'currency',
      align: 'right',
      className: 'font-mono',
    },
    {
      header: '31 - 60 Days',
      accessor: 'days31to60',
      type: 'currency',
      align: 'right',
      className: 'font-mono',
    },
    {
      header: '61 - 90 Days',
      accessor: 'days61to90',
      type: 'currency',
      align: 'right',
      className: 'font-mono',
    },
    {
      header: '90+ Days',
      accessor: 'days90plus',
      type: 'currency',
      align: 'right',
      className: 'font-mono text-rose-500 font-bold',
    },
    {
      header: 'Total Outstanding',
      accessor: 'total',
      type: 'currency',
      align: 'right',
      className: 'font-mono font-bold text-brand-600',
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
            <h1 className="text-2xl font-bold text-slate-900">Aged Receivables</h1>
            <p className="text-sm text-slate-500 mt-0.5">Aging Schedule: track customer payment delays.</p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="btn-base bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2 text-sm font-semibold"
        >
          Print Report
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

      {/* Report Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading Aged Receivables...</div>
      ) : (
        <ReportTable
          data={data}
          columns={columns}
          showGrandTotal={true}
          subtotalColumns={['current', 'days1to30', 'days31to60', 'days61to90', 'days90plus', 'total']}
        />
      )}
    </div>
  );
}
