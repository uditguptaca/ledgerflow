'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.post<{ accessToken: string; refreshToken: string }>('/v1/auth/login', {
        email,
        password,
      });

      if (!response || !response.accessToken) {
        throw new Error('Invalid response from authentication server.');
      }

      localStorage.setItem('ledgerflow_token', response.accessToken);
      // Let CompanyProvider automatically load and store the correct company_id from /v1/companies
      localStorage.removeItem('ledgerflow_company_id');
      
      await refreshUser();
      
      toast.success('Successfully logged in!');
      const nextPath = email.toLowerCase() === 'admin@ledgerflow.dev' ? '/super-admin' : '/dashboard';
      window.location.href = nextPath;
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
        <p className="text-sm text-slate-500 mt-1.5">Sign in to manage your company ledger.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Email address
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base pl-10"
              placeholder="you@example.com"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base pl-10"
              placeholder="••••••••"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-base bg-brand-600 hover:bg-brand-700 text-white py-3 font-semibold shadow-soft active:scale-[0.98] transition-transform duration-75 relative"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Redesigned Quick Demo Login */}
      <div className="pt-6 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          One-Click Demo Accounts
        </p>
        <div className="grid grid-cols-1 gap-2.5">
          {/* Lisa Card */}
          <button
            type="button"
            onClick={() => {
              setEmail('lisa@cedarlane.demo');
              setPassword('Demo2024!');
              toast.success('Autofilled Lisa (Cedar Lane Admin)');
            }}
            className="w-full text-left bg-slate-50 hover:bg-brand-50/30 border border-slate-200 hover:border-brand-200 p-3 rounded-xl transition-all flex items-center gap-3 group"
          >
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              LA
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-semibold text-slate-700 group-hover:text-brand-900 transition-colors">Lisa (Admin)</span>
                <span className="text-[9px] font-semibold bg-indigo-500/10 text-indigo-700 px-1.5 py-0.5 rounded">Cedar Lane</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">lisa@cedarlane.demo</div>
            </div>
          </button>
          
          {/* Sarah Card */}
          <button
            type="button"
            onClick={() => {
              setEmail('sarah@northstar.demo');
              setPassword('Demo2024!');
              toast.success('Autofilled Sarah (Workspace Owner)');
            }}
            className="w-full text-left bg-slate-50 hover:bg-brand-50/30 border border-slate-200 hover:border-brand-200 p-3 rounded-xl transition-all flex items-center gap-3 group"
          >
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              SO
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-semibold text-slate-700 group-hover:text-brand-900 transition-colors">Sarah (Owner)</span>
                <span className="text-[9px] font-semibold bg-blue-500/10 text-blue-700 px-1.5 py-0.5 rounded">North Star</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">sarah@northstar.demo</div>
            </div>
          </button>

          {/* Super Admin Card */}
          <button
            type="button"
            onClick={() => {
              setEmail('admin@ledgerflow.dev');
              setPassword('SuperAdmin2024!');
              toast.success('Autofilled Platform Super Admin');
            }}
            className="w-full text-left bg-slate-50 hover:bg-brand-50/30 border border-slate-200 hover:border-brand-200 p-3 rounded-xl transition-all flex items-center gap-3 group"
          >
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              SA
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-semibold text-slate-700 group-hover:text-brand-900 transition-colors">Super Admin</span>
                <span className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-700 px-1.5 py-0.5 rounded">Platform</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">admin@ledgerflow.dev</div>
            </div>
          </button>
        </div>
      </div>

      <div className="text-center pt-2">
        <p className="text-xs text-slate-500">
          Don't have an account?{' '}
          <Link href="/signup" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
            Create a free account
          </Link>
        </p>
      </div>
    </div>
  );
}
