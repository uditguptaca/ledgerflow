'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchEntries = () => {
    setLoading(true);
    api.get<any>('/v1/accounting/journals')
      .then((res) => {
        setEntries(res.data || []);
      })
      .catch((err) => {
        console.error('Failed to load journals:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const filteredEntries = entries.filter((e) => {
    return (
      (e.number || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.memo || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.sourceType || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Journal Entries</h1>
          <p className="text-sm text-slate-500 mt-0.5">View and manage double-entry general ledger adjustments.</p>
        </div>
        <Link
          href="/accounting/journal-entries/new"
          className="btn-base bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-sm font-semibold shadow-soft"
        >
          <PlusIcon className="w-4 h-4" />
          New Journal Entry
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-soft">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by entry #, source, or memo..."
            className="input-base pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-sm text-slate-500">Loading journal entries...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="table-header">Date</th>
                  <th className="table-header">Entry Number</th>
                  <th className="table-header">Source Type</th>
                  <th className="table-header">Memo / Description</th>
                  <th className="table-header text-right">Value (Debits)</th>
                  <th className="table-header text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((e) => {
                  const totalDebits = (e.lines || []).reduce((sum: number, l: any) => sum + Number(l.debit || 0), 0);
                  const isPosted = e.isPosted && !e.isVoided;
                  const statusLabel = e.isVoided ? 'Voided' : isPosted ? 'Posted' : 'Draft';
                  
                  return (
                    <tr key={e.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="table-cell font-mono text-xs">{e.date ? new Date(e.date).toISOString().split('T')[0] : '-'}</td>
                      <td className="table-cell font-semibold text-brand-600">
                        <Link href={`/accounting/journal-entries/${e.id}`} className="hover:underline">
                          {e.number}
                        </Link>
                      </td>
                      <td className="table-cell font-mono text-xs capitalize">{e.sourceType?.toLowerCase()}</td>
                      <td className="table-cell text-slate-700 font-medium">{e.memo}</td>
                      <td className="table-cell text-right font-mono font-semibold text-slate-800">
                        {formatCurrency(totalDebits)}
                      </td>
                      <td className="table-cell text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          e.isVoided
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isPosted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {!loading && filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">No journal entries found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
