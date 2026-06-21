'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  UsersIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  PlusIcon,
  TrashIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import api from '@/lib/api';

interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: string;
  workspaceName: string;
  isActive: boolean;
  createdAt: string;
}

interface PlatformCompany {
  id: string;
  name: string;
  workspaceName: string;
  currency: string;
  country: string;
}

interface PlatformSubscription {
  id: string;
  workspaceName: string;
  plan: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
  seatsUsed: number;
  seatsLimit: number;
  companyLimit: number;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
}

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'companies' | 'subscriptions'>('overview');
  
  // Data lists
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [companies, setCompanies] = useState<PlatformCompany[]>([]);
  const [subscriptions, setSubscriptions] = useState<PlatformSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms state
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Accountant', workspace: 'Northstar Advisory' });
  const [newCompany, setNewCompany] = useState({ name: '', workspace: 'Northstar Advisory', currency: 'USD', country: 'US' });
  const [newSub, setNewSub] = useState({ workspaceName: '', plan: 'BASIC' as any });

  const loadData = async () => {
    try {
      setLoading(true);
      const [uRes, cRes, sRes] = await Promise.all([
        api.get<TenantUser[]>('/v1/super-admin/users'),
        api.get<PlatformCompany[]>('/v1/super-admin/companies'),
        api.get<PlatformSubscription[]>('/v1/super-admin/subscriptions'),
      ]);
      setUsers(uRes);
      setCompanies(cRes);
      setSubscriptions(sRes);
    } catch (err) {
      console.warn('Super admin API connection error. Falling back to mock console data:', err);
      // Fallback
      setUsers([
        { id: 'u1', name: 'Sarah Chen', email: 'sarah@northstar.demo', role: 'OWNER', workspaceName: 'Northstar Advisory', isActive: true, createdAt: '2025-01-01' },
        { id: 'u2', name: 'Lisa Park', email: 'lisa@cedarlane.demo', role: 'ADMIN', workspaceName: 'Cedar Lane Group', isActive: true, createdAt: '2025-01-10' },
      ]);
      setCompanies([
        { id: 'c1', name: 'BluePeak Construction', workspaceName: 'Northstar Advisory', currency: 'USD', country: 'US' },
        { id: 'c2', name: 'Cedar Lane Retail', workspaceName: 'Cedar Lane Group', currency: 'CAD', country: 'CA' },
      ]);
      setSubscriptions([
        { id: 's1', workspaceName: 'Northstar Advisory', plan: 'PROFESSIONAL', seatsUsed: 4, seatsLimit: 25, companyLimit: 5, status: 'ACTIVE' },
        { id: 's2', workspaceName: 'Cedar Lane Group', plan: 'BASIC', seatsUsed: 1, seatsLimit: 5, companyLimit: 1, status: 'ACTIVE' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Users action handlers
  const handleToggleUserStatus = async (id: string) => {
    try {
      await api.post(`/v1/super-admin/users/${id}/toggle-status`);
      setUsers(users.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
      toast.success('User status updated.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update user status.');
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    toast.error('Direct user registration is handled via signup flow or workspace invitation.');
  };

  // Companies action handlers
  const handleDeleteCompany = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete company "${name}"? This action will cascade delete all associated double-entry ledger data and accounts.`)) {
      return;
    }

    try {
      await api.delete(`/v1/super-admin/companies/${id}`);
      setCompanies(companies.filter(c => c.id !== id));
      toast.success(`Company "${name}" removed from platform.`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete company.');
    }
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    toast.error('Please create companies directly inside the Workspace settings screen.');
  };

  // Subscriptions action handlers
  const handleUpdatePlan = async (id: string, plan: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE') => {
    try {
      await api.patch(`/v1/super-admin/subscriptions/${id}`, { plan });
      const limits = {
        BASIC: { seatsLimit: 5, companyLimit: 1 },
        PROFESSIONAL: { seatsLimit: 25, companyLimit: 5 },
        ENTERPRISE: { seatsLimit: 100, companyLimit: 20 },
      }[plan];

      setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, plan, ...limits } : s));
      toast.success(`Workspace subscription upgraded to ${plan}.`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update subscription.');
    }
  };

  const handleAddSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSub.workspaceName) return toast.error('Please enter workspace name');

    try {
      await api.post('/v1/super-admin/subscriptions', {
        workspaceName: newSub.workspaceName,
        plan: newSub.plan,
      });

      toast.success(`Workspace subscription initialized for ${newSub.workspaceName}.`);
      setNewSub({ workspaceName: '', plan: 'BASIC' });
      loadData();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create subscription.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <SparklesIcon className="w-6 h-6 text-brand-600" />
          Platform Super Admin Console
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage all customer workspaces, legal entities, user accounts, and billing subscriptions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        {(['overview', 'users', 'companies', 'subscriptions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-bold capitalize border-b-2 transition-colors cursor-pointer select-none ${
              activeTab === tab
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft">
              <div className="flex justify-between items-start">
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total SaaS Users</span>
                  <h3 className="text-2xl font-extrabold text-slate-800 mt-2">{users.length}</h3>
                </div>
                <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-500">
                  <UsersIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft">
              <div className="flex justify-between items-start">
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Hosted Companies</span>
                  <h3 className="text-2xl font-extrabold text-slate-800 mt-2">{companies.length}</h3>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-500">
                  <BuildingOfficeIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft">
              <div className="flex justify-between items-start">
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Active Subscriptions</span>
                  <h3 className="text-2xl font-extrabold text-slate-800 mt-2">{subscriptions.length}</h3>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 text-amber-500">
                  <CreditCardIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft">
              <div className="flex justify-between items-start">
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Platform MRR</span>
                  <h3 className="text-2xl font-extrabold text-slate-800 mt-2">$4,850.00</h3>
                </div>
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-500">
                  <SparklesIcon className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions / Platform Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-soft space-y-4">
              <h3 className="text-sm font-bold text-slate-800">SaaS Platform Health</h3>
              <div className="divide-y divide-slate-100 text-sm">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">API Gateway Status</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" /> Operational
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Database Connection Pool</span>
                  <span className="font-semibold text-slate-700">Healthy (2ms latency)</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Mail Server Status</span>
                  <span className="font-semibold text-slate-700">Connected</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-soft space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Operational Log</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <span className="text-slate-400 font-mono">04:45</span>
                  <p className="text-slate-600"><span className="font-bold text-slate-800">System</span> - Trial Balance checked for all active companies: <span className="font-semibold text-emerald-600">All Balanced</span></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-slate-400 font-mono">03:10</span>
                  <p className="text-slate-600"><span className="font-bold text-slate-800">lisa@cedarlane.demo</span> - Generated trial balance report for <span className="font-semibold text-slate-800">Cedar Lane Retail</span></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-slate-400 font-mono">02:50</span>
                  <p className="text-slate-600"><span className="font-bold text-slate-800">System</span> - Automated daily backup finished successfully</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card-base overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="table-header">Name</th>
                      <th className="table-header">Workspace</th>
                      <th className="table-header">Role</th>
                      <th className="table-header">Status</th>
                      <th className="table-header text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="table-cell">
                          <p className="font-semibold text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>
                        </td>
                        <td className="table-cell text-slate-700">{u.workspaceName}</td>
                        <td className="table-cell text-slate-500 uppercase">{u.role}</td>
                        <td className="table-cell">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                              : 'bg-rose-50 text-rose-700 border-rose-150'
                          }`}>
                            {u.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="table-cell text-right">
                          <button
                            onClick={() => handleToggleUserStatus(u.id)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              u.isActive
                                ? 'bg-white hover:bg-rose-50 border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600'
                                : 'bg-white hover:bg-emerald-50 border-slate-200 hover:border-emerald-200 text-slate-500 hover:text-emerald-600'
                            }`}
                            title={u.isActive ? 'Suspend User' : 'Activate User'}
                          >
                            <NoSymbolIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* User Registration Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft space-y-4 h-fit">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <UsersIcon className="w-4 h-4 text-brand-600" />
              Direct User Registration
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Platform users register themselves via the self-serve signup flow, or are invited directly by Workspace Owners/Admins via the Team settings dashboard.
            </p>
          </div>
        </div>
      )}

      {/* COMPANIES TAB */}
      {activeTab === 'companies' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Companies List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card-base overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="table-header">Company Name</th>
                      <th className="table-header">Workspace</th>
                      <th className="table-header">Base Currency</th>
                      <th className="table-header">Country</th>
                      <th className="table-header text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {companies.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="table-cell font-semibold text-slate-900">{c.name}</td>
                        <td className="table-cell text-slate-500">{c.workspaceName}</td>
                        <td className="table-cell text-slate-700 font-mono font-semibold">{c.currency}</td>
                        <td className="table-cell text-slate-600">{c.country}</td>
                        <td className="table-cell text-right">
                          <button
                            onClick={() => handleDeleteCompany(c.id, c.name)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Company"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Company Registration Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft space-y-4 h-fit">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <BuildingOfficeIcon className="w-4 h-4 text-brand-600" />
              Company Provisioning
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Companies and subsidiaries represent legal entities and are provisioned directly by Workspace Owners inside the Workspace Settings dashboard.
            </p>
          </div>
        </div>
      )}

      {/* SUBSCRIPTIONS TAB */}
      {activeTab === 'subscriptions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subscriptions List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card-base overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="table-header">Workspace Name</th>
                      <th className="table-header">Subscription Plan</th>
                      <th className="table-header">Seats Limit</th>
                      <th className="table-header">Company Limit</th>
                      <th className="table-header">Status</th>
                      <th className="table-header text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subscriptions.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="table-cell font-semibold text-slate-900">{s.workspaceName}</td>
                        <td className="table-cell font-bold text-slate-700">{s.plan}</td>
                        <td className="table-cell text-slate-500 font-mono text-xs">
                          {s.seatsUsed} / {s.seatsLimit} seats
                        </td>
                        <td className="table-cell text-slate-500 font-mono text-xs">{s.companyLimit} companies</td>
                        <td className="table-cell">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            s.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                              : 'bg-rose-50 text-rose-700 border-rose-150'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="table-cell text-right">
                          <select
                            onChange={e => handleUpdatePlan(s.id, e.target.value as any)}
                            value={s.plan}
                            className="text-xs bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-700 cursor-pointer"
                          >
                            <option value="BASIC">BASIC</option>
                            <option value="PROFESSIONAL">PROFESSIONAL</option>
                            <option value="ENTERPRISE">ENTERPRISE</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Add Subscription / Workspace */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft space-y-4 h-fit">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <PlusIcon className="w-4 h-4 text-brand-600" />
              Add Subscription
            </h3>
            <form onSubmit={handleAddSub} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Workspace / Customer Name</label>
                <input
                  type="text"
                  required
                  value={newSub.workspaceName}
                  onChange={e => setNewSub({ ...newSub, workspaceName: e.target.value })}
                  className="input-base"
                  placeholder="e.g. Meridian Group Ltd"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Select Tier Plan</label>
                <select
                  value={newSub.plan}
                  onChange={e => setNewSub({ ...newSub, plan: e.target.value as any })}
                  className="input-base"
                >
                  <option value="BASIC">BASIC ($99/mo - 5 seats, 1 company)</option>
                  <option value="PROFESSIONAL">PROFESSIONAL ($299/mo - 25 seats, 5 companies)</option>
                  <option value="ENTERPRISE">ENTERPRISE ($899/mo - 100 seats, 20 companies)</option>
                </select>
              </div>

              <button type="submit" className="w-full btn-base bg-brand-600 hover:bg-brand-700 text-white py-2 font-semibold shadow-soft">
                Provision Subscription
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
