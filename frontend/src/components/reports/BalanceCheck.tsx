'use client';

import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface BalanceCheckProps {
  leftValue: number;
  rightValue: number;
  leftLabel?: string;
  rightLabel?: string;
  title?: string;
  helpText?: string;
}

export default function BalanceCheck({
  leftValue,
  rightValue,
  leftLabel = 'Debits',
  rightLabel = 'Credits',
  title = 'Balance Verification',
  helpText,
}: BalanceCheckProps) {
  const difference = leftValue - rightValue;
  const isBalanced = Math.abs(difference) < 0.01;

  const total = leftValue + rightValue;
  const leftPct = total > 0 ? (leftValue / total) * 100 : 50;
  const rightPct = total > 0 ? (rightValue / total) * 100 : 50;

  // Format currency
  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-soft p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800">{title}</h4>
          {helpText && <p className="text-xs text-slate-400 mt-0.5">{helpText}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          {isBalanced ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
              In Balance
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 animate-pulse">
              <ExclamationTriangleIcon className="w-4 h-4 text-rose-500" />
              Out of Balance
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 items-center">
        {/* Left Side */}
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{leftLabel}</span>
          <div className="text-lg font-bold text-slate-800 font-mono">{formatCurrency(leftValue)}</div>
        </div>

        {/* Right Side */}
        <div className="space-y-1 text-right">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{rightLabel}</span>
          <div className="text-lg font-bold text-slate-800 font-mono">{formatCurrency(rightValue)}</div>
        </div>
      </div>

      {/* Visual Balance Bar */}
      <div className="mt-4 h-3 bg-slate-100 rounded-full overflow-hidden flex relative">
        <div
          style={{ width: `${leftPct}%` }}
          className={`h-full transition-all duration-500 ${
            isBalanced ? 'bg-indigo-500' : 'bg-amber-500'
          }`}
        />
        <div
          style={{ width: `${rightPct}%` }}
          className={`h-full transition-all duration-500 ${
            isBalanced ? 'bg-indigo-600' : 'bg-rose-500'
          }`}
        />
        {/* Balance Center Pin */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-300 transform -translate-x-1/2" />
      </div>

      {/* Details/Difference Box */}
      <div className={`mt-4 p-3 rounded-lg flex items-center justify-between text-xs transition-colors ${
        isBalanced 
          ? 'bg-slate-50 text-slate-600' 
          : 'bg-rose-50/70 border border-rose-100 text-rose-800'
      }`}>
        <span>Discrepancy:</span>
        <span className="font-mono font-bold">
          {isBalanced ? '$0.00' : formatCurrency(difference)}
        </span>
      </div>
    </div>
  );
}
