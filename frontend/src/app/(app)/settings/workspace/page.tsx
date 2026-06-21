'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';

interface Workspace {
  id: string;
  name: string;
  currency: string;
  status: 'active' | 'archived';
}

const INITIAL_WORKSPACES: Workspace[] = [
  { id: '1', name: 'Acme Software Corp', currency: 'USD', status: 'active' },
  { id: '2', name: 'Acme Holding Europe', currency: 'EUR', status: 'active' },
];

export default function WorkspaceSettingsPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('Workspace Name is required.');
      return;
    }

    const newW: Workspace = {
      id: Math.random().toString(),
      name,
      currency,
      status: 'active',
    };

    setWorkspaces([...workspaces, newW]);
    toast.success(`Workspace ${name} created successfully.`);
    setName('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workspaces</h1>
          <p className="text-sm text-slate-500 mt-0.5">Segregate entities, subsidiaries, or legal departments.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-base bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-sm font-semibold shadow-soft"
        >
          <PlusIcon className="w-4 h-4" />
          Create Workspace
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workspaces.map((w) => (
          <div key={w.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft hover:shadow-card transition-all flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{w.name}</h3>
              <span className="text-xs text-slate-400 font-mono mt-0.5">Reporting Currency: {w.currency}</span>
            </div>
            <span className="text-[10px] bg-emerald-50 border border-emerald-150 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full capitalize">
              {w.status}
            </span>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Create Workspace</h3>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Workspace / Subsidiary Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Holding Europe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Base Reporting Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="input-base appearance-none font-semibold text-slate-800"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 btn-base bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 py-2 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-base bg-brand-600 hover:bg-brand-700 text-white py-2 font-semibold shadow-soft"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
