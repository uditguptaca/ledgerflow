'use client';

import React, { useState, useEffect } from 'react';
import ReportTable, { ColumnConfig } from '@/components/reports/ReportTable';
import api from '@/lib/api';

interface GeneralLedgerRow {
  accountName: string;
  accountCode: string;
  date: string;
  entryNumber: string;
  reference: string;
  memo: string;
  debit: number;
  credit: number;
  balance: number;
}

export default function GeneralLedgerPage() {
  const [data, setData] = useState<GeneralLedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-01-31');

  useEffect(() => {
    const fetchGeneralLedger = async () => {
      try {
        setLoading(true);
        const res = await api.get<any>(`/v1/reports/general-ledger?startDate=${startDate}T00:00:00Z&endDate=${endDate}T23:59:59Z`);
        
        const flattened: GeneralLedgerRow[] = [];
        (res.accounts || []).forEach((acc: any) => {
          (acc.lines || []).forEach((line: any) => {
            flattened.push({
              accountCode: acc.account.code,
              accountName: acc.account.name,
              date: line.date,
              entryNumber: line.journalNumber,
              reference: line.sourceType || 'JE',
              memo: line.memo || line.description || '',
              debit: Number(line.debit || 0),
              credit: Number(line.credit || 0),
              balance: Number(line.balance || 0),
            });
          });
        });

        setData(flattened);
      } catch (err) {
        console.error('Failed to load general ledger:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGeneralLedger();
  }, [startDate, endDate]);

  const columns: ColumnConfig<GeneralLedgerRow>[] = [
    {
      header: 'Date',
      accessor: 'date',
      className: 'font-mono text-xs w-28',
    },
    {
      header: 'Entry Number',
      accessor: 'entryNumber',
      className: 'font-semibold text-brand-600 w-32',
    },
    {
      header: 'Reference',
      accessor: 'reference',
      className: 'font-mono text-xs w-28',
    },
    {
      header: 'Description / Memo',
      accessor: 'memo',
      className: 'text-slate-600',
    },
    {
      header: 'Debit',
      accessor: 'debit',
      type: 'currency',
      align: 'right',
      className: 'font-mono w-28',
    },
    {
      header: 'Credit',
      accessor: 'credit',
      type: 'currency',
      align: 'right',
      className: 'font-mono w-28',
    },
    {
      header: 'Balance',
      accessor: 'balance',
      type: 'currency',
      align: 'right',
      className: 'font-mono font-semibold w-32',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">General Ledger</h1>
          <p className="text-sm text-slate-500 mt-0.5">Detailed chronological journal lines grouped by ledger account.</p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-soft">
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
      </div>

      {/* Report Table Grouped by Account Code */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading General Ledger...</div>
      ) : (
        <ReportTable
          data={data}
          columns={columns}
          groupBy="accountCode"
          groupHeaderLabel={(val) => {
            const matched = data.find((row) => row.accountCode === val);
            return matched ? `${val} - ${matched.accountName}` : val;
          }}
          subtotalColumns={['debit', 'credit']}
          showGrandTotal={false}
        />
      )}
    </div>
  );
}
