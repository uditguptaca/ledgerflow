'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false);

  const handleResend = () => {
    setLoading(true);
    setTimeout(() => {
      toast.success('Verification link sent to your email.');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-12 h-12 bg-brand-50 border border-brand-200 text-brand-600 rounded-full flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-950">Verify your email</h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          We sent a verification link to your registered email address. Please click the link to confirm your account.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleResend}
          disabled={loading}
          className="w-full btn-base bg-brand-600 hover:bg-brand-700 text-white py-2.5 font-semibold shadow-soft"
        >
          {loading ? 'Sending link...' : 'Resend verification email'}
        </button>
        
        <Link
          href="/login"
          className="w-full btn-base bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 py-2.5 font-semibold"
        >
          Return to Sign In
        </Link>
      </div>
    </div>
  );
}
