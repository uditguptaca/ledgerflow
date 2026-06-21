'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileSettingsPage() {
  const { user, updateUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize fields once the user state is loaded
  useEffect(() => {
    if (user) {
      const parts = user.name.split(' ');
      setFirstName(user.firstName || parts[0] || '');
      setLastName(user.lastName || parts.slice(1).join(' ') || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      toast.error('All profile fields are required.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      updateUser({
        name: `${firstName} ${lastName}`.trim(),
        email,
      });
      toast.success('Profile details updated successfully.');
    }, 600);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Please enter both current and new passwords.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Security password changed.');
      setCurrentPassword('');
      setNewPassword('');
    }, 600);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400">
        <div className="w-5 h-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mr-2" />
        Loading profile...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Your Profile</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage your personal credentials, contact info, and passwords.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* Basic Info */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft h-fit">
          <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Basic Information</h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-base bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-xs font-semibold shadow-soft"
              >
                {loading ? 'Saving...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft h-fit">
          <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Current Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-base"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-base bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-semibold"
              >
                {loading ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
