'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Cog6ToothIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  UsersIcon,
  UserIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface SettingsTab {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const SETTINGS_TABS: SettingsTab[] = [
  { label: 'General Settings', href: '/settings', icon: Cog6ToothIcon },
  { label: 'Company Details', href: '/settings/company', icon: BuildingOfficeIcon },
  { label: 'Workspaces & Companies', href: '/settings/workspace', icon: BriefcaseIcon },
  { label: 'Team Members', href: '/settings/users', icon: UsersIcon },
  { label: 'Your Profile', href: '/settings/profile', icon: UserIcon },
  { label: 'Audit Logs', href: '/settings/audit-log', icon: ClipboardDocumentListIcon },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-6rem)] animate-in">
      {/* Settings Navigation Sidebar */}
      <aside className="w-full lg:w-64 shrink-0 bg-white border border-slate-200 rounded-xl p-4 shadow-soft h-fit">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-3 mb-3">
          Workspace Settings
        </h2>
        <nav className="flex flex-col gap-1">
          {SETTINGS_TABS.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer select-none',
                  isActive
                    ? 'bg-brand-50 text-brand-650 shadow-2xs border border-brand-100/50'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent'
                )}
              >
                <tab.icon className={clsx('w-5 h-5 shrink-0', isActive ? 'text-brand-650' : 'text-slate-400')} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Settings Content Area */}
      <main className="flex-1 bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-soft">
        {children}
      </main>
    </div>
  );
}
