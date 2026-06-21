'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CompanySwitcher } from './CompanySwitcher';
import { useAuth } from '@/contexts/AuthContext';
import {
  Squares2X2Icon,
  BookOpenIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  TableCellsIcon,
  ScaleIcon,
  UserGroupIcon,
  DocumentCheckIcon,
  BanknotesIcon,
  BuildingStorefrontIcon,
  CreditCardIcon,
  ReceiptPercentIcon,
  BuildingLibraryIcon,
  ArrowDownTrayIcon,
  InboxStackIcon,
  ArrowPathIcon,
  ChartPieIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CalculatorIcon,
  Cog6ToothIcon,
  XMarkIcon,
  ChevronDownIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface NavGroup {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  basePath: string;
  children: NavItem[];
}

type NavEntry = NavItem | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry;
}

const navEntries: NavEntry[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Squares2X2Icon },

  {
    label: 'Accounting',
    icon: BookOpenIcon,
    basePath: '/accounting',
    children: [
      { label: 'Chart of Accounts', href: '/accounting/chart-of-accounts', icon: TableCellsIcon },
      { label: 'Journal Entries', href: '/accounting/journal-entries', icon: DocumentTextIcon },
      { label: 'General Ledger', href: '/accounting/general-ledger', icon: ClipboardDocumentListIcon },
      { label: 'Trial Balance', href: '/accounting/trial-balance', icon: ScaleIcon },
    ],
  },

  {
    label: 'Sales',
    icon: CurrencyDollarIcon,
    basePath: '/sales',
    children: [
      { label: 'Customers', href: '/sales/customers', icon: UserGroupIcon },
      { label: 'Invoices', href: '/sales/invoices', icon: DocumentCheckIcon },
      { label: 'Payments', href: '/sales/payments', icon: BanknotesIcon },
    ],
  },

  {
    label: 'Purchases',
    icon: BuildingStorefrontIcon,
    basePath: '/purchases',
    children: [
      { label: 'Vendors', href: '/purchases/vendors', icon: BuildingStorefrontIcon },
      { label: 'Bills', href: '/purchases/bills', icon: CreditCardIcon },
      { label: 'Expenses', href: '/purchases/expenses', icon: ReceiptPercentIcon },
    ],
  },

  {
    label: 'Banking',
    icon: BuildingLibraryIcon,
    basePath: '/banking',
    children: [
      { label: 'Bank Accounts', href: '/banking/accounts', icon: BuildingLibraryIcon },
      { label: 'CSV Import', href: '/banking/import', icon: ArrowDownTrayIcon },
      { label: 'Transaction Inbox', href: '/banking/inbox', icon: InboxStackIcon },
      { label: 'Reconciliation', href: '/banking/reconciliation', icon: ArrowPathIcon },
    ],
  },

  {
    label: 'Reports',
    icon: ChartPieIcon,
    basePath: '/reports',
    children: [
      { label: 'Reports Hub', href: '/reports', icon: ChartPieIcon },
      { label: 'Profit & Loss', href: '/reports/profit-loss', icon: ChartBarIcon },
      { label: 'Balance Sheet', href: '/reports/balance-sheet', icon: ScaleIcon },
      { label: 'Cash Flow', href: '/reports/cash-flow', icon: CurrencyDollarIcon },
      { label: 'Aged Receivables', href: '/reports/aged-receivables', icon: ClockIcon },
      { label: 'Aged Payables', href: '/reports/aged-payables', icon: ClockIcon },
      { label: 'Tax Summary', href: '/reports/tax-summary', icon: CalculatorIcon },
    ],
  },

  { label: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const isSuperAdmin = user?.email === 'admin@ledgerflow.dev';
  const activeEntries = isSuperAdmin
    ? [...navEntries, { label: 'Super Admin', href: '/super-admin', icon: SparklesIcon }]
    : navEntries;

  // Expand groups whose basePath matches the current pathname
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    activeEntries.forEach((entry) => {
      if (isGroup(entry)) {
        initial[entry.basePath] = pathname.startsWith(entry.basePath);
      }
    });
    return initial;
  });

  const toggleGroup = (basePath: string) => {
    setExpanded((prev) => ({ ...prev, [basePath]: !prev[basePath] }));
  };

  const isActive = (href: string) => {
    if (href === '/reports') return pathname === '/reports';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isGroupActive = (basePath: string) => pathname.startsWith(basePath);

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex flex-col w-64 border-r border-slate-900 bg-slate-950 text-slate-400 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header/Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-900 bg-slate-950">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white font-extrabold text-lg shadow-sm shadow-brand-500/25 group-hover:scale-105 transition-transform duration-200">
              L
            </div>
            <span className="text-base font-extrabold text-white tracking-tight group-hover:text-brand-300 transition-colors duration-200">
              LedgerFlow
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-slate-200 lg:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Switcher Area */}
        <div className="px-4 py-4 border-b border-slate-900 bg-slate-950/30">
          <CompanySwitcher />
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 select-none">
          {activeEntries.map((entry) => {
            if (isGroup(entry)) {
              const groupExpanded = expanded[entry.basePath] ?? false;
              const groupActive = isGroupActive(entry.basePath);

              return (
                <div key={entry.basePath} className="mb-0.5">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(entry.basePath)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer',
                      groupActive
                        ? 'text-white bg-white/5'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    )}
                  >
                    <entry.icon className="w-5 h-5 shrink-0" />
                    <span className="flex-1 text-left">{entry.label}</span>
                    <ChevronDownIcon
                      className={clsx(
                        'w-4 h-4 shrink-0 transition-transform duration-200',
                        groupExpanded ? 'rotate-180' : ''
                      )}
                    />
                  </button>

                  {/* Group Children */}
                  <div
                    className={clsx(
                      'overflow-hidden transition-all duration-200 ease-in-out',
                      groupExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    )}
                  >
                    <div className="ml-3 pl-3 border-l border-slate-800 mt-0.5 space-y-0.5">
                      {entry.children.map((child) => {
                        const childActive = isActive(child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => onClose()}
                            className={clsx(
                              'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150',
                              childActive
                                ? 'bg-brand-500/15 text-brand-300'
                                : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                            )}
                          >
                            <child.icon className="w-4 h-4 shrink-0" />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            // Top-level link (Dashboard, Settings)
            const linkActive = isActive(entry.href);
            return (
              <Link
                key={entry.href}
                href={entry.href}
                onClick={() => onClose()}
                className={clsx(
                  linkActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
                )}
              >
                <entry.icon className="w-5 h-5 shrink-0" />
                <span>{entry.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div className="p-4 border-t border-slate-900 text-center text-2xs text-slate-600 font-semibold select-none">
          &copy; {new Date().getFullYear()} LedgerFlow Inc.
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
