'use client';

import React, { useState } from 'react';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entity: string;
  details: string;
}

const INITIAL_LOGS: AuditLog[] = [
  { id: '1', timestamp: '22026-06-20 12:44:10', user: 'Demo User', action: 'Create', entity: 'Journal Entry', details: 'Posted Journal Entry JE-2026-003 ($25,000.00)' },
  { id: '2', timestamp: '2026-06-20 10:15:32', user: 'Sarah Connor', action: 'Reconcile', entity: 'Bank Account', details: 'Reconciled Silicon Valley Checking Account' },
  { id: '3', timestamp: '2026-06-19 14:02:11', user: 'Demo User', action: 'Update', entity: 'Settings', details: 'Locked accounting period before 2025-12-31' },
  { id: '4', timestamp: '2026-06-18 09:30:00', user: 'Demo User', action: 'Create', entity: 'Invoice', details: 'Issued Invoice INV-2026-004 ($3,400.00)' },
];

export default function AuditLogSettingsPage() {
  const [logs] = useState<AuditLog[]>(INITIAL_LOGS);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-0.5">Chronological record of all workspace modifications and ledger postings.</p>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="table-header">Timestamp</th>
                <th className="table-header">User</th>
                <th className="table-header">Action</th>
                <th className="table-header">Target Entity</th>
                <th className="table-header">Activity Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-sm">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/20 transition-colors">
                  <td className="table-cell font-mono text-xs text-slate-500">{log.timestamp}</td>
                  <td className="table-cell font-semibold text-slate-800">{log.user}</td>
                  <td className="table-cell">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border capitalize ${
                      log.action === 'Create'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : log.action === 'Update'
                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="table-cell font-medium text-slate-700">{log.entity}</td>
                  <td className="table-cell text-slate-600">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
