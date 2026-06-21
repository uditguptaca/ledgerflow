'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      toast.success('Password reset instructions sent!');
      setSubmitted(true);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reset password</h2>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
          {!submitted 
            ? "Enter your email address and we'll send you a link to reset your password." 
            : "We've sent an email to your address with further instructions."}
        </p>
      </div>

      {!submitted ? (
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
                Sending link...
              </span>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>
      ) : (
        <div className="text-center bg-emerald-50 text-emerald-800 p-4 rounded-xl text-xs border border-emerald-100/80 leading-relaxed">
          Check your email folder for recovery instructions. If you don't receive it in 5 minutes, try again.
        </div>
      )}

      <div className="text-center pt-2 border-t border-slate-100">
        <Link href="/login" className="font-semibold text-xs text-brand-600 hover:text-brand-700 transition-colors">
          Return to Sign In
        </Link>
      </div>
    </div>
  );
}

