'use client';

import React, { useState } from 'react';
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

const INITIAL_USERS: TenantUser[] = [
  { id: 'u1', name: 'Sarah Chen', email: 'sarah@northstar.demo', role: 'Workspace Owner', workspaceName: 'Northstar Advisory', isActive: true, createdAt: '2025-01-01' },
  { id: 'u2', name: 'Lisa Park', email: 'lisa@cedarlane.demo', role: 'Client Admin', workspaceName: 'Cedar Lane Group', isActive: true, createdAt: '2025-01-10' },
  { id: 'u3', name: 'Marcus Rivera', email: 'marcus@northstar.demo', role: 'Accountant', workspaceName: 'Northstar Advisory', isActive: true, createdAt: '2025-01-15' },
  { id: 'u4', name: 'James Wong', email: 'james@northstar.demo', role: 'Auditor', workspaceName: 'Northstar Advisory', isActive: false, createdAt: '2025-01-20' },
];

const INITIAL_COMPANIES: PlatformCompany[] = [
  { id: 'c1', name: 'BluePeak Construction', workspaceName: 'Northstar Advisory', currency: 'USD', country: 'US' },
  { id: 'c2', name: 'Cedar Lane Retail', workspaceName: 'Cedar Lane Group', currency: 'CAD', country: 'CA' },
  { id: 'c3', name: 'Nova Health Services', workspaceName: 'Northstar Advisory', currency: 'USD', country: 'US' },
  { id: 'c4', name: 'Harbor E-Commerce', workspaceName: 'Global Sales Inc', currency: 'EUR', country: 'DE' },
];

const INITIAL_SUBSCRIPTIONS: PlatformSubscription[] = [
  { id: 's1', workspaceName: 'Northstar Advisory', plan: 'PROFESSIONAL', seatsUsed: 4, seatsLimit: 25, companyLimit: 5, status: 'ACTIVE' },
  { id: 's2', workspaceName: 'Cedar Lane Group', plan: 'BASIC', seatsUsed: 1, seatsLimit: 5, companyLimit: 1, status: 'ACTIVE' },
  { id: 's3', workspaceName: 'Global Sales Inc', plan: 'ENTERPRISE', seatsUsed: 12, seatsLimit: 100, companyLimit: 20, status: 'ACTIVE' },
];

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'companies' | 'subscriptions'>('overview');
  
  // Data lists
  const [users, setUsers] = useState<TenantUser[]>(INITIAL_USERS);
  const [companies, setCompanies] = useState<PlatformCompany[]>(INITIAL_COMPANIES);
  const [subscriptions, setSubscriptions] = useState<PlatformSubscription[]>(INITIAL_SUBSCRIPTIONS);

  // Forms state
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Accountant', workspace: 'Northstar Advisory' });
  const [newCompany, setNewCompany] = useState({ name: '', workspace: 'Northstar Advisory', currency: 'USD', country: 'US' });
  const [newSub, setNewSub] = useState({ workspaceName: '', plan: 'BASIC' as any });

  // Users action handlers
  const handleToggleUserStatus = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
    toast.success('User status updated.');
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return toast.error('Please fill all required fields');
    
    const user: TenantUser = {
      id: `u${Math.random()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      workspaceName: newUser.workspace,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    setUsers([...users, user]);
    toast.success('New platform user registered successfully.');
    setNewUser({ name: '', email: '', role: 'Accountant', workspace: 'Northstar Advisory' });
  };

  // Companies action handlers
  const handleDeleteCompany = (id: string, name: string) => {
    setCompanies(companies.filter(c => c.id !== id));
    toast.success(`Company ${name} removed from platform.`);
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.name) return toast.error('Please enter company name');
    
    const company: PlatformCompany = {
      id: `c${Math.random()}`,
      name: newCompany.name,
      workspaceName: newCompany.workspace,
      currency: newCompany.currency,
      country: newCompany.country,
    };
    
    setCompanies([...companies, company]);
    toast.success(`Company ${newCompany.name} created.`);
    setNewCompany({ name: '', workspace: 'Northstar Advisory', currency: 'USD', country: 'US' });
  };

  // Subscriptions action handlers
  const handleUpdatePlan = (id: string, plan: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE') => {
    const limits = {
      BASIC: { seatsLimit: 5, companyLimit: 1 },
      PROFESSIONAL: { seatsLimit: 25, companyLimit: 5 },
      ENTERPRISE: { seatsLimit: 100, companyLimit: 20 },
    }[plan];

    setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, plan, ...limits } : s));
    toast.success(`Workspace subscription upgraded to ${plan}.`);
  };

  const handleAddSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSub.workspaceName) return toast.error('Please enter workspace name');

    const limits = {
      BASIC: { seatsLimit: 5, companyLimit: 1 },
      PROFESSIONAL: { seatsLimit: 25, companyLimit: 5 },
      ENTERPRISE: { seatsLimit: 100, companyLimit: 20 },
    }[newSub.plan as 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'];

    const sub: PlatformSubscription = {
      id: `s${Math.random()}`,
      workspaceName: newSub.workspaceName,
      plan: newSub.plan,
      seatsUsed: 1,
      ...limits,
      status: 'ACTIVE',
    };

    setSubscriptions([...subscriptions, sub]);
    toast.success(`Workspace subscription initialized for ${newSub.workspaceName}.`);
    setNewSub({ workspaceName: '', plan: 'BASIC' });
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
                        <td className="table-cell text-slate-500">{u.role}</td>
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

          {/* Add User Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft space-y-4 h-fit">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <PlusIcon className="w-4 h-4 text-brand-600" />
              Add Platform User
            </h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  className="input-base"
                  placeholder="e.g. Robert Smith"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="input-base"
                  placeholder="e.g. robert@company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Assigned Workspace</label>
                <input
                  type="text"
                  required
                  value={newUser.workspace}
                  onChange={e => setNewUser({ ...newUser, workspace: e.target.value })}
                  className="input-base"
                  placeholder="e.g. Northstar Advisory"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Default Workspace Role</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  className="input-base"
                >
                  <option value="Owner">Owner</option>
                  <option value="Admin">Admin</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Bookkeeper">Bookkeeper</option>
                  <option value="Auditor">Auditor</option>
                </select>
              </div>

              <button type="submit" className="w-full btn-base bg-brand-600 hover:bg-brand-700 text-white py-2 font-semibold">
                Create User
              </button>
            </form>
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

          {/* Add Company Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft space-y-4 h-fit">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <PlusIcon className="w-4 h-4 text-brand-600" />
              Add Company
            </h3>
            <form onSubmit={handleAddCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Company Legal Name</label>
                <input
                  type="text"
                  required
                  value={newCompany.name}
                  onChange={e => setNewCompany({ ...newCompany, name: e.target.value })}
                  className="input-base"
                  placeholder="e.g. Acme Services Canada"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Belongs to Workspace</label>
                <input
                  type="text"
                  required
                  value={newCompany.workspace}
                  onChange={e => setNewCompany({ ...newCompany, workspace: e.target.value })}
                  className="input-base"
                  placeholder="e.g. Northstar Advisory"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Base Currency</label>
                  <select
                    value={newCompany.currency}
                    onChange={e => setNewCompany({ ...newCompany, currency: e.target.value })}
                    className="input-base"
                  >
                    <option value="USD">USD</option>
                    <option value="CAD">CAD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={newCompany.country}
                    onChange={e => setNewCompany({ ...newCompany, country: e.target.value })}
                    className="input-base"
                    placeholder="US / CA / GB"
                  />
                </div>
              </div>

              <button type="submit" className="w-full btn-base bg-brand-600 hover:bg-brand-700 text-white py-2 font-semibold">
                Create Company
              </button>
            </form>
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
                        <td className="table-cell text-slate-500">
                          {s.seatsUsed} / {s.seatsLimit} seats
                        </td>
                        <td className="table-cell text-slate-500">{s.companyLimit} companies</td>
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

              <button type="submit" className="w-full btn-base bg-brand-600 hover:bg-brand-700 text-white py-2 font-semibold">
                Provision Subscription
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
