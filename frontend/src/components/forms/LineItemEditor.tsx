'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import AccountPicker, { Account } from './AccountPicker';
import { api } from '@/lib/api';

export interface LineItem {
  id: string;
  accountId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // e.g. 10 for 10%
  taxCodeId?: string;
  debit: number;
  credit: number;
}

interface LineItemEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  mode: 'transaction' | 'journal'; // transaction for invoice/bill, journal for general ledger
}

export default function LineItemEditor({ items, onChange, mode }: LineItemEditorProps) {
  const [taxCodes, setTaxCodes] = useState<{ id: string; name: string; rate: number }[]>([]);

  // Ensure we have at least one row on startup and fetch tax codes
  useEffect(() => {
    if (items.length === 0) {
      handleAddRow();
    }

    if (mode === 'transaction') {
      api.get<any[]>('/v1/tax/codes')
        .then((data) => {
          if (data && Array.isArray(data)) {
            setTaxCodes(
              data.map((tc) => ({
                id: tc.id,
                name: tc.name,
                rate: parseFloat(tc.rate) * 100,
              }))
            );
          }
        })
        .catch((err) => console.warn('Could not load tax codes:', err));
    }
  }, []);

  const handleAddRow = () => {
    const newItem: LineItem = {
      id: Math.random().toString(36).substring(2, 11),
      accountId: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
      taxCodeId: undefined,
      debit: 0,
      credit: 0,
    };
    onChange([...items, newItem]);
  };

  const handleRemoveRow = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    // Maintain at least one row
    if (updated.length === 0) {
      onChange([
        {
          id: Math.random().toString(36).substring(2, 11),
          accountId: '',
          description: '',
          quantity: 1,
          unitPrice: 0,
          taxRate: 0,
          taxCodeId: undefined,
          debit: 0,
          credit: 0,
        },
      ]);
    } else {
      onChange(updated);
    }
  };

  const handleUpdateField = (index: number, field: keyof LineItem, value: any) => {
    const updated = items.map((item, i) => {
      if (i === index) {
        const newItem = { ...item, [field]: value };
        // Clean up or auto-adjust other values if necessary
        if (mode === 'journal') {
          // In journal mode, a line cannot have both a debit and credit value
          if (field === 'debit' && Number(value) > 0) {
            newItem.credit = 0;
          } else if (field === 'credit' && Number(value) > 0) {
            newItem.debit = 0;
          }
        }
        return newItem;
      }
      return item;
    });
    onChange(updated);
  };

  // Calculations for transactions
  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice || 0), 0);
  };

  const getTaxTotal = () => {
    return items.reduce((sum, item) => {
      const lineSubtotal = item.quantity * item.unitPrice || 0;
      const lineTax = lineSubtotal * ((item.taxRate || 0) / 100);
      return sum + lineTax;
    }, 0);
  };

  const getTotal = () => {
    return getSubtotal() + getTaxTotal();
  };

  // Calculations for journals
  const getTotalDebits = () => {
    return items.reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
  };

  const getTotalCredits = () => {
    return items.reduce((sum, item) => sum + (Number(item.credit) || 0), 0);
  };

  const getDifference = () => {
    return Math.abs(getTotalDebits() - getTotalCredits());
  };

  const isBalanced = () => {
    return Math.abs(getTotalDebits() - getTotalCredits()) < 0.005;
  };

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-soft p-6 overflow-hidden">
      <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center justify-between">
        <span>Line Items</span>
        {mode === 'journal' && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
            isBalanced() 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {isBalanced() ? 'Balanced' : `Out of Balance: $${getDifference().toFixed(2)}`}
          </span>
        )}
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="table-header w-1/3">Account</th>
              <th className="table-header">Description</th>
              {mode === 'transaction' ? (
                <>
                  <th className="table-header w-20 text-right">Qty</th>
                  <th className="table-header w-32 text-right">Unit Price</th>
                  <th className="table-header w-24 text-right">Tax (%)</th>
                  <th className="table-header w-32 text-right">Amount</th>
                </>
              ) : (
                <>
                  <th className="table-header w-32 text-right">Debit</th>
                  <th className="table-header w-32 text-right">Credit</th>
                </>
              )}
              <th className="table-header w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => {
              const lineAmount = (item.quantity * item.unitPrice) * (1 + (item.taxRate / 100)) || 0;

              return (
                <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="p-2 align-top">
                    <AccountPicker
                      selectedId={item.accountId}
                      onChange={(account) => handleUpdateField(index, 'accountId', account.id)}
                    />
                  </td>
                  <td className="p-2 align-top">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleUpdateField(index, 'description', e.target.value)}
                      placeholder="Line item description"
                      className="input-base"
                    />
                  </td>
                  {mode === 'transaction' ? (
                    <>
                      <td className="p-2 align-top">
                        <input
                          type="number"
                          value={item.quantity}
                          min="0.01"
                          step="any"
                          onChange={(e) => handleUpdateField(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="input-base text-right font-mono"
                        />
                      </td>
                      <td className="p-2 align-top">
                        <input
                          type="number"
                          value={item.unitPrice}
                          min="0"
                          step="0.01"
                          onChange={(e) => handleUpdateField(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="input-base text-right font-mono"
                        />
                      </td>
                      <td className="p-2 align-top">
                        <select
                          value={item.taxCodeId || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const matched = taxCodes.find((tc) => tc.id === val);
                            handleUpdateField(index, 'taxCodeId', val || undefined);
                            handleUpdateField(index, 'taxRate', matched ? matched.rate : 0);
                          }}
                          className="input-base text-right font-mono appearance-none"
                        >
                          <option value="">No Tax (0%)</option>
                          {taxCodes.map((tc) => (
                            <option key={tc.id} value={tc.id}>
                              {tc.name} ({tc.rate}%)
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 align-top text-right font-mono text-sm font-semibold text-slate-800 pt-4">
                        ${lineAmount.toFixed(2)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-2 align-top">
                        <input
                          type="number"
                          value={item.debit || ''}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          onChange={(e) => handleUpdateField(index, 'debit', parseFloat(e.target.value) || 0)}
                          className="input-base text-right font-mono"
                        />
                      </td>
                      <td className="p-2 align-top">
                        <input
                          type="number"
                          value={item.credit || ''}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          onChange={(e) => handleUpdateField(index, 'credit', parseFloat(e.target.value) || 0)}
                          className="input-base text-right font-mono"
                        />
                      </td>
                    </>
                  )}
                  <td className="p-2 align-top text-center pt-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={handleAddRow}
          className="btn-base bg-brand-50 hover:bg-brand-100 text-brand-700 px-4 py-2 border border-brand-200 text-sm font-semibold"
        >
          <PlusIcon className="w-4 h-4" />
          Add Line
        </button>

        {mode === 'transaction' ? (
          <div className="w-full md:w-80 bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-200 font-mono text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span>${getSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax Total:</span>
              <span>${getTaxTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-800 pt-2 border-t border-slate-200">
              <span>Total:</span>
              <span>${getTotal().toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <div className="w-full md:w-80 bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-200 font-mono text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Total Debits:</span>
              <span className="font-semibold text-slate-800">${getTotalDebits().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Total Credits:</span>
              <span className="font-semibold text-slate-800">${getTotalCredits().toFixed(2)}</span>
            </div>
            <div className={`flex justify-between text-sm pt-2 border-t border-slate-200 font-bold ${
              isBalanced() ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              <span>Difference:</span>
              <span>${getDifference().toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
