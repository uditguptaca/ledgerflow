'use client';

import React, { useState, useEffect } from 'react';
import ReportTable, { ColumnConfig } from '@/components/reports/ReportTable';
import BalanceCheck from '@/components/reports/BalanceCheck';
import api from '@/lib/api';

interface TrialBalanceRow {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
}

export default function TrialBalancePage() {
  const [data, setData] = useState<TrialBalanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [asOfDate, setAsOfDate] = useState('2026-06-21');

  useEffect(() => {
    const fetchTrialBalance = async () => {
      try {
        setLoading(true);
        const res = await api.get<any>(`/v1/reports/trial-balance?asOfDate=${asOfDate}T23:59:59Z`);
        
        const mapped = (res.accounts || []).map((acct: any) => {
          const balance = Number(acct.balance || 0);
          const type = acct.accountType.toLowerCase();
          const isDebitNormal = type === 'asset' || type === 'expense';
          
          let debit = 0;
          let credit = 0;

          if (isDebitNormal) {
            if (balance >= 0) debit = balance;
            else credit = Math.abs(balance);
          } else {
            if (balance >= 0) credit = balance;
            else debit = Math.abs(balance);
          }

          return {
            code: acct.accountCode,
            name: acct.accountName,
            type,
            debit,
            credit,
          };
        });

        setData(mapped);
      } catch (err) {
        console.error('Failed to load trial balance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrialBalance();
  }, [asOfDate]);

  const totalDebits = data.reduce((sum, item) => sum + item.debit, 0);
  const totalCredits = data.reduce((sum, item) => sum + item.credit, 0);

  const columns: ColumnConfig<TrialBalanceRow>[] = [
    {
      header: 'Account Code',
      accessor: 'code',
      className: 'font-mono text-slate-500 font-semibold',
    },
    {
      header: 'Account Name',
      accessor: 'name',
      className: 'font-semibold text-slate-800',
    },
    {
      header: 'Type',
      accessor: (row) => (
        <span className="capitalize text-xs font-semibold text-slate-500">{row.type}</span>
      ),
    },
    {
      header: 'Debit Balance',
      accessor: 'debit',
      type: 'currency',
      align: 'right',
      className: 'font-mono font-semibold',
    },
    {
      header: 'Credit Balance',
      accessor: 'credit',
      type: 'currency',
      align: 'right',
      className: 'font-mono font-semibold',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trial Balance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Sum of all debit balances must equal all credit balances.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase">As of Date:</label>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="input-base py-1.5 w-40 font-mono"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading Trial Balance...</div>
      ) : (
        <>
          {/* Balance checker widget */}
          <div className="max-w-2xl">
            <BalanceCheck
              leftValue={totalDebits}
              rightValue={totalCredits}
              leftLabel="Total Debit Balances"
              rightLabel="Total Credit Balances"
              title="General Ledger Reconciliation Summary"
            />
          </div>

          {/* Report Table */}
          <ReportTable
            data={data}
            columns={columns}
            showGrandTotal={true}
            subtotalColumns={['debit', 'credit']}
          />
        </>
      )}
    </div>
  );
}
