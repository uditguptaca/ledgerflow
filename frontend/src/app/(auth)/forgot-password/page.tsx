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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-950">Reset password</h2>
        <p className="text-sm text-slate-500 mt-1">
          {!submitted 
            ? 'Enter your email address and we\'ll send you a link to reset your password.' 
            : 'We\'ve sent an email to your address with further instructions.'}
        </p>
      </div>

      {!submitted ? (
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

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-base bg-brand-600 hover:bg-brand-700 text-white py-2.5 font-semibold shadow-soft"
          >
            {loading ? 'Sending link...' : 'Send reset link'}
          </button>
        </form>
      ) : (
        <div className="text-center bg-emerald-50 text-emerald-800 p-4 rounded-lg text-sm border border-emerald-100">
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
