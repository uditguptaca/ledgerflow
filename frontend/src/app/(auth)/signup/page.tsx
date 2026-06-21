'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { CheckIcon } from '@heroicons/react/24/solid';
import api from '@/lib/api';

const STEPS = [
  { number: 1, name: 'Account' },
  { number: 2, name: 'Company' },
  { number: 3, name: 'Template' },
];

export default function SignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [country, setCountry] = useState('US');
  const [template, setTemplate] = useState('saas');

  const handleNext = () => {
    if (currentStep === 1) {
      if (!name || !email || !password) {
        toast.error('Please fill in all account fields.');
        return;
      }
    } else if (currentStep === 2) {
      if (!companyName) {
        toast.error('Please enter your company name.');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const payload = {
        email,
        password,
        firstName,
        lastName,
        workspaceName: `${companyName} Workspace`,
        companyName,
        baseCurrency: currency,
        country,
      };

      const response = await api.post<{
        accessToken: string;
        company: { id: string };
      }>('/v1/auth/signup', payload);

      if (!response || !response.accessToken) {
        throw new Error('Invalid response from registration server.');
      }

      localStorage.setItem('ledgerflow_token', response.accessToken);
      if (response.company && response.company.id) {
        localStorage.setItem('ledgerflow_company_id', response.company.id);
      }

      toast.success('Account created! Welcome to LedgerFlow.');
      window.location.href = '/dashboard';
    } catch (err: any) {
      toast.error(err.message || 'Onboarding failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in">
      {/* Progress bar */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-brand-500 -translate-y-1/2 transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        <div className="relative flex justify-between">
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.number;
            const isActive = currentStep === step.number;
            return (
              <div key={step.number} className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border transition-all z-10 ${
                  isCompleted 
                    ? 'bg-brand-500 border-brand-500 text-white shadow-soft' 
                    : isActive 
                    ? 'bg-white border-brand-500 text-brand-600 ring-4 ring-brand-500/10 shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : step.number}
                </div>
                <span className={`text-[9px] font-bold mt-1.5 uppercase tracking-wider ${
                  isActive ? 'text-brand-600' : 'text-slate-400'
                }`}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {currentStep === 1 && 'Create your account'}
          {currentStep === 2 && 'Tell us about your business'}
          {currentStep === 3 && 'Choose your ledger structure'}
        </h2>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
          {currentStep === 1 && "Let's get started with your personal details."}
          {currentStep === 2 && 'This helps us configure your tax rates and currencies.'}
          {currentStep === 3 && 'Select a pre-configured template to match your industry.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-base pl-10"
                  placeholder="John Doe"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Email Address
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
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base pl-10"
                  placeholder="Minimum 8 characters"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Legal Company Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="input-base pl-10"
                  placeholder="Acme Corp"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Base Currency
                </label>
                <div className="relative">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="input-base appearance-none pr-8"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Country
                </label>
                <div className="relative">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="input-base appearance-none pr-8"
                  >
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Select Chart of Accounts template
            </label>
            {[
              { id: 'saas', name: 'Software / SaaS', desc: 'Preloaded with subscription revenues, AWS hosting, and software amortizations.' },
              { id: 'retail', name: 'Retail / E-commerce', desc: 'Includes Inventory subledgers, Cost of Goods Sold (COGS), and sales tax liabilities.' },
              { id: 'service', name: 'Professional Services', desc: 'Configured for billable hours, project milestones, and consulting accounts.' },
              { id: 'custom', name: 'Blank / Custom ledger', desc: 'A clean slate to create your own account codes and types from scratch.' },
            ].map((t) => (
              <label
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`block border p-3.5 rounded-xl cursor-pointer transition-all hover:bg-slate-50 ${
                  template === t.id 
                    ? 'border-brand-500 bg-brand-50/20 ring-1 ring-brand-500 shadow-sm' 
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="template"
                    value={t.id}
                    checked={template === t.id}
                    onChange={() => {}}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300"
                  />
                  <span className="font-semibold text-sm text-slate-800">{t.name}</span>
                </div>
                <p className="text-xs text-slate-500 ml-6.5 mt-0.5 leading-relaxed">{t.desc}</p>
              </label>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-5 border-t border-slate-100">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="flex-1 btn-base bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 py-3 font-semibold active:scale-[0.98] transition-transform duration-75"
            >
              Back
            </button>
          )}
          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 btn-base bg-brand-600 hover:bg-brand-700 text-white py-3 font-semibold shadow-soft active:scale-[0.98] transition-transform duration-75"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-base bg-brand-600 hover:bg-brand-700 text-white py-3 font-semibold shadow-soft active:scale-[0.98] transition-transform duration-75 relative"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                'Finish Setup'
              )}
            </button>
          )}
        </div>
      </form>

      <div className="text-center pt-2">
        <p className="text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
