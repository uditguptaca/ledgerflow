'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function BankStatementImportPage() {
  const [bankAccountId, setBankAccountId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankAccountId || !file) {
      toast.error('Please select both a bank account and a statement file.');
      return;
    }

    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      toast.success('Statement uploaded successfully! 43 transactions imported into Inbox.');
      setFile(null);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Import Statements</h1>
        <p className="text-sm text-slate-500 mt-0.5">Upload CSV, OFX, or QBO statements to sync your ledger manually.</p>
      </div>

      <div className="max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-soft">
        <form onSubmit={handleUpload} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Target Bank Account
            </label>
            <select
              required
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="input-base appearance-none font-semibold text-slate-800"
            >
              <option value="">Select bank account...</option>
              <option value="1">Silicon Valley Operating (Checking •••• 1202)</option>
              <option value="2">SVB Savings Reserve (Savings •••• 8900)</option>
            </select>
          </div>

          {/* Upload Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Statement File (.csv, .ofx, .qbo)
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-55/30 transition-all relative">
              <input
                type="file"
                accept=".csv,.ofx,.qbo,.qfx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                </svg>
                <div className="text-sm font-semibold text-slate-700">
                  {file ? file.name : 'Select or drop your statement file'}
                </div>
                <p className="text-xs text-slate-400">CSV, QBO, or OFX up to 10MB</p>
              </div>
            </div>
          </div>

          {/* Column mappings */}
          {file && (
            <div className="border-t border-slate-100 pt-4 space-y-3 animate-slide-up">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">CSV Column Mappings</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Date</label>
                  <select className="input-base text-xs py-1" defaultValue="0">
                    <option value="0">Column A (Date)</option>
                    <option value="1">Column B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Description</label>
                  <select className="input-base text-xs py-1" defaultValue="1">
                    <option value="0">Column A</option>
                    <option value="1">Column B (Description)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Amount</label>
                  <select className="input-base text-xs py-1" defaultValue="2">
                    <option value="2">Column C (Amount)</option>
                    <option value="3">Column D</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={uploading || !file || !bankAccountId}
              className="btn-base bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 text-sm font-semibold shadow-soft"
            >
              {uploading ? 'Processing import...' : 'Upload Statement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
