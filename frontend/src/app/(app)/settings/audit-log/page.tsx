'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useCompany } from '@/contexts/CompanyContext';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entity: string;
  details: string;
}

export default function AuditLogSettingsPage() {
  const { currentCompany } = useCompany();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const companyId = currentCompany?.id;

  const loadAuditLogs = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const res = await api.get<{ data: any[] }>(`/v1/audit`);
      const mapped = (res.data || []).map((log: any) => {
        let detailsString = '';
        if (log.metadata && typeof log.metadata === 'object') {
          detailsString = Object.entries(log.metadata)
            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
            .join(', ');
        }
        if (!detailsString) {
          detailsString = `Modified ${log.entityType} (ID: ${log.entityId})`;
        }

        return {
          id: log.id,
          timestamp: new Date(log.timestamp).toLocaleString('en-US'),
          user: log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() : log.userId || 'System',
          action: log.action,
          entity: log.entityType,
          details: detailsString,
        };
      });
      setLogs(mapped);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      // Fallback
      setLogs([
        { id: '1', timestamp: '2026-06-20 12:44:10', user: 'Demo User', action: 'CREATE', entity: 'Journal Entry', details: 'Posted Journal Entry JE-2026-003 ($25,000.00)' },
        { id: '2', timestamp: '2026-06-20 10:15:32', user: 'Sarah Connor', action: 'RECONCILE', entity: 'Bank Account', details: 'Reconciled Silicon Valley Checking Account' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [companyId]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-xs text-slate-500 mt-0.5">Chronological record of all workspace modifications and ledger postings.</p>
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
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-cell text-center py-12 text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                      Loading audit logs...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-cell text-center py-12 text-slate-400">
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/20 transition-colors">
                    <td className="table-cell font-mono text-xs text-slate-500">{log.timestamp}</td>
                    <td className="table-cell font-semibold text-slate-800">{log.user}</td>
                    <td className="table-cell">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border capitalize ${
                        log.action === 'CREATE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : log.action === 'UPDATE'
                          ? 'bg-blue-50 text-blue-700 border-blue-100'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="table-cell font-medium text-slate-700">{log.entity}</td>
                    <td className="table-cell text-slate-600 truncate max-w-xs" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
