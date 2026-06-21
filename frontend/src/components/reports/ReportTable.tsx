'use client';

import React from 'react';
import { format } from 'date-fns';

export interface ColumnConfig<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  type?: 'text' | 'number' | 'currency' | 'date';
  align?: 'left' | 'right' | 'center';
  className?: string;
}

interface ReportTableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  groupBy?: keyof T;
  groupHeaderLabel?: (groupValue: any) => string;
  subtotalColumns?: Array<keyof T>; // numeric columns to subtotal per group
  showGrandTotal?: boolean;
}

export default function ReportTable<T extends Record<string, any>>({
  data,
  columns,
  groupBy,
  groupHeaderLabel = (val) => String(val),
  subtotalColumns = [],
  showGrandTotal = false,
}: ReportTableProps<T>) {

  const formatCellValue = (value: any, type?: 'text' | 'number' | 'currency' | 'date') => {
    if (value === undefined || value === null) return '-';
    if (type === 'currency') {
      const num = Number(value);
      if (isNaN(num)) return value;
      const formatted = Math.abs(num).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return num < 0 ? `($${formatted})` : `$${formatted}`;
    }
    if (type === 'date') {
      try {
        return format(new Date(value), 'yyyy-MM-dd');
      } catch {
        return String(value);
      }
    }
    if (type === 'number') {
      const num = Number(value);
      return isNaN(num) ? value : num.toLocaleString();
    }
    return String(value);
  };

  const getAlignClass = (align?: 'left' | 'right' | 'center', type?: string) => {
    if (align) return `text-${align}`;
    if (type === 'currency' || type === 'number') return 'text-right';
    if (type === 'date') return 'text-center';
    return 'text-left';
  };

  // Group data if groupBy is specified
  const groups: { [key: string]: T[] } = {};
  if (groupBy) {
    data.forEach((item) => {
      const key = String(item[groupBy] || 'Other');
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
  } else {
    groups['All'] = data;
  }

  // Calculate subtotals for a list of items
  const calculateTotals = (items: T[]) => {
    const totals: Record<string, number> = {};
    subtotalColumns.forEach((col) => {
      totals[String(col)] = items.reduce((sum, item) => sum + (Number(item[col]) || 0), 0);
    });
    return totals;
  };

  const grandTotals = calculateTotals(data);

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-soft overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`table-header ${getAlignClass(col.align, col.type)} ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Object.entries(groups).map(([groupName, groupItems], groupIdx) => {
              const groupTotals = calculateTotals(groupItems);

              return (
                <React.Fragment key={groupName}>
                  {groupBy && (
                    <tr className="bg-slate-50/50">
                      <td
                        colSpan={columns.length}
                        className="px-4 py-2 text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-100/70 border-y border-slate-200/60"
                      >
                        {groupHeaderLabel(groupName)} ({groupItems.length} items)
                      </td>
                    </tr>
                  )}

                  {groupItems.map((item, itemIdx) => (
                    <tr key={itemIdx} className="hover:bg-slate-50/40 transition-colors">
                      {columns.map((col, colIdx) => {
                        const alignClass = getAlignClass(col.align, col.type);
                        const cellValue = typeof col.accessor === 'function'
                          ? col.accessor(item)
                          : item[col.accessor];

                        return (
                          <td
                            key={colIdx}
                            className={`table-cell py-3 ${alignClass} ${col.className || ''}`}
                          >
                            {typeof col.accessor === 'function'
                              ? cellValue
                              : formatCellValue(cellValue, col.type)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Subtotal row if grouped and subtotal columns are specified */}
                  {groupBy && subtotalColumns.length > 0 && (
                    <tr className="bg-slate-50/30 font-semibold border-t border-slate-200">
                      {columns.map((col, colIdx) => {
                        const isSubtotalCol = typeof col.accessor === 'string' && subtotalColumns.includes(col.accessor as keyof T);
                        const alignClass = getAlignClass(col.align, col.type);

                        return (
                          <td
                            key={colIdx}
                            className={`px-4 py-2.5 text-xs text-slate-800 font-bold ${alignClass}`}
                          >
                            {colIdx === 0 ? (
                              <span>Total {groupHeaderLabel(groupName)}</span>
                            ) : isSubtotalCol ? (
                              formatCellValue(groupTotals[col.accessor as string], col.type)
                            ) : (
                              ''
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {/* Grand Total row */}
            {showGrandTotal && subtotalColumns.length > 0 && (
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                {columns.map((col, colIdx) => {
                  const isSubtotalCol = typeof col.accessor === 'string' && subtotalColumns.includes(col.accessor as keyof T);
                  const alignClass = getAlignClass(col.align, col.type);

                  return (
                    <td
                      key={colIdx}
                      className={`px-4 py-3 text-sm text-slate-900 ${alignClass}`}
                    >
                      {colIdx === 0 ? (
                        <span>Grand Total</span>
                      ) : isSubtotalCol ? (
                        formatCellValue(grandTotals[col.accessor as string], col.type)
                      ) : (
                        ''
                      )}
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data.length === 0 && (
        <div className="text-center py-12 bg-white">
          <p className="text-sm text-slate-400">No report data matches the current filters.</p>
        </div>
      )}
    </div>
  );
}
