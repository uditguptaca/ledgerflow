'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';
import { useCompany } from '@/contexts/CompanyContext';

interface UserMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'invited' | 'pending';
}

export default function UsersSettingsPage() {
  const { currentCompany } = useCompany();
  const [members, setMembers] = useState<UserMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER'); // OWNER, ADMIN, MEMBER, FIRM_MANAGER

  const workspaceId = currentCompany?.workspaceId;

  const loadMembers = async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      // Fetch active members
      const membersList = await api.get<any[]>(`/v1/workspaces/${workspaceId}/members`);
      
      // Fetch pending invitations to display as "invited" status
      let invitations: any[] = [];
      try {
        invitations = await api.get<any[]>(`/v1/workspaces/${workspaceId}/invitations`);
      } catch (invErr) {
        console.warn('Failed to load invitations:', invErr);
      }

      const activeMembersMapped = membersList.map((m: any) => ({
        id: m.id,
        name: m.user ? `${m.user.firstName || ''} ${m.user.lastName || ''}`.trim() : 'Unknown Member',
        email: m.user?.email || '',
        role: m.role,
        status: 'active' as const,
      }));

      const pendingInvitationsMapped = invitations
        .filter((inv: any) => inv.status === 'PENDING')
        .map((inv: any) => ({
          id: inv.id,
          name: 'Invited Member',
          email: inv.email,
          role: inv.workspaceRole,
          status: 'invited' as const,
        }));

      setMembers([...activeMembersMapped, ...pendingInvitationsMapped]);
    } catch (err) {
      console.error('Failed to load workspace members:', err);
      // Fallback mock database
      setMembers([
        { id: '1', name: 'Lisa Park', email: 'lisa@cedarlane.demo', role: 'ADMIN', status: 'active' },
        { id: '2', name: 'Sarah Connor', email: 'sarah@cedarlane.demo', role: 'MEMBER', status: 'active' },
        { id: '3', name: 'John Doe', email: 'john@cedarlane.demo', role: 'MEMBER', status: 'invited' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [workspaceId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Name and Email are required.');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/v1/workspaces/${workspaceId}/invitations`, {
        email,
        workspaceRole: role,
      });

      toast.success(`Invitation sent successfully to ${email}`);
      setName('');
      setEmail('');
      setIsModalOpen(false);
      loadMembers();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Team Members</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage permissions, invite accountants, and assign access roles.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-base bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-xs font-semibold shadow-soft"
        >
          <PlusIcon className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Role</th>
                <th className="table-header text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-cell text-center py-12 text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                      Loading team members...
                    </div>
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="table-cell font-semibold text-slate-900">{m.name}</td>
                    <td className="table-cell text-slate-600">{m.email}</td>
                    <td className="table-cell">
                      <span className="text-xs bg-slate-150 border border-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded uppercase">
                        {m.role}
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border capitalize ${
                        m.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-scale-in">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Invite Team Member</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="john@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Role Permission
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input-base appearance-none font-semibold text-slate-800"
                >
                  <option value="ADMIN">Admin (Full Access)</option>
                  <option value="MEMBER">Member (Accounting & Bookkeeping)</option>
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
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
