'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
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
      
      toast.success('Successfully logged in!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-950">Welcome back</h2>
        <p className="text-sm text-slate-500 mt-1">Sign in to manage your company ledger.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Email address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
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
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-base"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-base bg-brand-600 hover:bg-brand-700 text-white py-2.5 font-semibold shadow-soft"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="pt-4 border-t border-slate-100 text-left">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Demo Accounts (Click to Autofill)
        </p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              setEmail('lisa@cedarlane.demo');
              setPassword('Demo2024!');
            }}
            className="w-full text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 p-2.5 rounded transition-all flex justify-between items-center group"
          >
            <div>
              <div className="text-xs font-semibold text-slate-700">Lisa (Cedar Lane Admin)</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">lisa@cedarlane.demo</div>
            </div>
            <span className="text-xs font-semibold text-brand-600 group-hover:text-brand-700 opacity-80 group-hover:opacity-100 transition-opacity">Autofill</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setEmail('sarah@northstar.demo');
              setPassword('Demo2024!');
            }}
            className="w-full text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 p-2.5 rounded transition-all flex justify-between items-center group"
          >
            <div>
              <div className="text-xs font-semibold text-slate-700">Sarah (Workspace Owner)</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">sarah@northstar.demo</div>
            </div>
            <span className="text-xs font-semibold text-brand-600 group-hover:text-brand-700 opacity-80 group-hover:opacity-100 transition-opacity">Autofill</span>
          </button>
        </div>
      </div>

      <div className="text-center pt-2 border-t border-slate-100">
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
