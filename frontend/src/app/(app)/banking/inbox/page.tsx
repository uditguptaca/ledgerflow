'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { CheckIcon, SparklesIcon } from '@heroicons/react/24/solid';
import AccountPicker from '@/components/forms/AccountPicker';

interface StatementFeed {
  id: string;
  date: string;
  description: string;
  amount: number;
  suggestedMatch?: {
    type: 'invoice' | 'bill' | 'expense';
    number: string;
    description: string;
  };
}

const INITIAL_INBOX: StatementFeed[] = [
  { id: '1', date: '2026-06-18', description: 'Stripe Transfer payout 3880', amount: 8900.0, suggestedMatch: { type: 'invoice', number: 'INV-2026-004', description: 'Invoice payment matching Stripe payout' } },
  { id: '2', date: '2026-06-17', description: 'Amazon Web Services AWS Cloud billing', amount: -1280.5, suggestedMatch: { type: 'bill', number: 'BILL-AWS-9082', description: 'AWS invoice match' } },
  { id: '3', date: '2026-06-14', description: 'Starbucks Coffee - meeting', amount: -24.5 },
];

export default function BankInboxPage() {
  const [items, setItems] = useState<StatementFeed[]>(INITIAL_INBOX);

  const handleMatch = (id: string, name: string) => {
    setItems(items.filter((item) => item.id !== id));
    toast.success(`Matched transaction successfully to ${name}`);
  };

  const handleCategorize = (id: string, category: string) => {
    setItems(items.filter((item) => item.id !== id));
    toast.success(`Categorized direct expense to ${category}`);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions Inbox</h1>
          <p className="text-sm text-slate-500 mt-0.5">Categorize or match live statement rows to invoices and bills.</p>
        </div>
        <div className="text-xs bg-brand-50 border border-brand-200 text-brand-700 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1">
          <SparklesIcon className="w-3.5 h-3.5 text-brand-500" />
          AI Matching Active
        </div>
      </div>

      {/* Inbox items list */}
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft hover:shadow-card transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-4">
              <div className="font-mono text-xs bg-slate-50 border border-slate-100 rounded px-2.5 py-1 text-slate-500 font-semibold mt-1">
                {item.date}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">{item.description}</h4>
                <p className={`text-base font-extrabold font-mono mt-1 ${
                  item.amount > 0 ? 'text-emerald-600' : 'text-slate-800'
                }`}>
                  {item.amount > 0 ? '+' : ''}${item.amount.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Match controls */}
            <div className="w-full md:w-auto">
              {item.suggestedMatch ? (
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                  <div className="bg-brand-50/50 border border-brand-200 rounded-lg p-2.5 text-xs text-brand-800 md:max-w-xs">
                    <span className="font-bold flex items-center gap-1 text-brand-700 mb-0.5">
                      <SparklesIcon className="w-3 h-3 text-brand-500" />
                      Suggested Match ({item.suggestedMatch.type})
                    </span>
                    <span>{item.suggestedMatch.number} - {item.suggestedMatch.description}</span>
                  </div>
                  <button
                    onClick={() => handleMatch(item.id, item.suggestedMatch!.number)}
                    className="btn-base bg-brand-600 hover:bg-brand-700 text-white text-xs px-3.5 py-2 font-semibold shadow-soft"
                  >
                    <CheckIcon className="w-3.5 h-3.5" />
                    Approve Match
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-56">
                    <AccountPicker
                      onChange={(account) => handleCategorize(item.id, account.name)}
                    />
                  </div>
                  <button
                    onClick={() => handleCategorize(item.id, 'Uncategorized')}
                    className="btn-base bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs px-3 py-1.5 font-semibold"
                  >
                    Ignore
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-soft">
            <CheckIcon className="w-10 h-10 text-emerald-500 bg-emerald-50 border border-emerald-100 rounded-full p-2 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800">Inbox is empty</h4>
            <p className="text-xs text-slate-400 mt-1">All bank statement transactions have been cleared.</p>
          </div>
        )}
      </div>
    </div>
  );
}
