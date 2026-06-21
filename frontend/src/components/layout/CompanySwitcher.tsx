'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';

export const CompanySwitcher = () => {
  const { companies, currentCompany, selectCompany } = useCompany();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentCompany) return null;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 text-slate-200 hover:text-white transition-all duration-200 text-left w-full border border-slate-700/30 shadow-2xs cursor-pointer select-none"
      >
        <div className="w-8 h-8 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center border border-brand-500/20 shrink-0 font-extrabold text-sm">
          {currentCompany.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">
            Active Workspace
          </p>
          <p className="text-sm font-bold truncate mt-1 text-slate-200 group-hover:text-white">
            {currentCompany.name}
          </p>
        </div>
        <ChevronUpDownIcon className="w-4 h-4 text-slate-500 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-full min-w-[240px] rounded-xl bg-slate-900 border border-slate-800 shadow-soft z-50 p-1.5 animate-in">
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Switch Company
          </p>
          <div className="max-h-60 overflow-y-auto mt-1 flex flex-col gap-0.5">
            {companies.map((company) => {
              const isSelected = company.id === currentCompany.id;
              return (
                <button
                  key={company.id}
                  onClick={() => {
                    selectCompany(company.id);
                    setIsOpen(false);
                  }}
                  className={clsx(
                    'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer select-none',
                    isSelected
                      ? 'bg-brand-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={clsx(
                        'w-6 h-6 rounded-md flex items-center justify-center font-extrabold text-xs shrink-0',
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                      )}
                    >
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">{company.name}</span>
                  </div>
                  {isSelected && <CheckIcon className="w-4 h-4 text-white shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySwitcher;
