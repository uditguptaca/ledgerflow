'use client';

import React from 'react';
import clsx from 'clsx';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pills' | 'solid';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className,
}) => {
  const baseListStyles = 'flex items-center gap-1 overflow-x-auto scrollbar-none';
  
  const listVariants = {
    underline: 'border-b border-slate-200/80 w-full',
    pills: 'p-1 flex-wrap',
    solid: 'p-1 bg-slate-100/60 rounded-xl border border-slate-200/40 w-full md:w-auto',
  };

  const itemVariants = {
    underline: (isActive: boolean) =>
      clsx(
        'rounded-none border-b-2 px-1 pb-3 pt-2 -mb-[2px] font-semibold text-sm transition-all duration-150 whitespace-nowrap cursor-pointer select-none inline-flex items-center gap-2',
        isActive
          ? 'border-brand-600 text-brand-600'
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
      ),
    pills: (isActive: boolean) =>
      clsx(
        'px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer select-none inline-flex items-center gap-2',
        isActive
          ? 'bg-brand-50 text-brand-700 border border-brand-100/50 shadow-3xs'
          : 'border border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
      ),
    solid: (isActive: boolean) =>
      clsx(
        'px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer select-none inline-flex items-center justify-center gap-2 flex-1 md:flex-initial',
        isActive
          ? 'bg-white text-slate-800 shadow-sm border border-slate-200/30'
          : 'border border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/40'
      ),
  };

  return (
    <div className={clsx(baseListStyles, listVariants[variant], className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={itemVariants[variant](isActive)}
          >
            {tab.icon && <span className="w-4.5 h-4.5 shrink-0 flex items-center justify-center">{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
