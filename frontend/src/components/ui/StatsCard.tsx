import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';
import { Card } from './Card';

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: number; // percentage value, e.g., 0.085 for +8.5%
  changeLabel?: string;
  isLoading?: boolean;
  variant?: 'brand' | 'neutral';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  change,
  changeLabel,
  isLoading = false,
  variant = 'neutral',
}) => {
  if (isLoading) {
    return (
      <Card noPadding className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-3 flex-1">
            <div className="h-4 bg-slate-200/60 rounded-md w-24 animate-pulse" />
            <div className="h-8 bg-slate-200/60 rounded-md w-36 animate-pulse" />
            <div className="h-3 bg-slate-200/60 rounded-md w-40 animate-pulse" />
          </div>
          <div className="w-12 h-12 bg-slate-200/60 rounded-xl animate-pulse shrink-0" />
        </div>
      </Card>
    );
  }

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <Card
      hoverable
      noPadding
      className={clsx(
        'p-6 relative overflow-hidden group',
        variant === 'brand' && 'bg-gradient-brand text-white border-transparent'
      )}
    >
      {variant === 'brand' && (
        <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
      )}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <p
            className={clsx(
              'text-xs font-bold uppercase tracking-wider',
              variant === 'brand' ? 'text-brand-100' : 'text-slate-500'
            )}
          >
            {title}
          </p>
          <h4
            className={clsx(
              'text-2xl md:text-3xl font-extrabold tracking-tight mt-1.5 truncate',
              variant === 'brand' ? 'text-white' : 'text-slate-900'
            )}
          >
            {value}
          </h4>
          
          {(change !== undefined || changeLabel) && (
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
              {change !== undefined && (
                <span
                  className={clsx(
                    'inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-md',
                    variant === 'brand'
                      ? 'bg-white/10 text-white'
                      : isPositive
                      ? 'bg-emerald-50 text-emerald-700'
                      : isNegative
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-slate-100 text-slate-700'
                  )}
                >
                  {isPositive && <ArrowUpIcon className="w-3 h-3 shrink-0" />}
                  {isNegative && <ArrowDownIcon className="w-3 h-3 shrink-0" />}
                  {new Intl.NumberFormat('en-US', {
                    style: 'percent',
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                    signDisplay: 'exceptZero',
                  }).format(change)}
                </span>
              )}
              {changeLabel && (
                <span
                  className={clsx(
                    'text-xs font-medium',
                    variant === 'brand' ? 'text-brand-100' : 'text-slate-500'
                  )}
                >
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div
            className={clsx(
              'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-all duration-300 group-hover:scale-105',
              variant === 'brand'
                ? 'bg-white/10 text-white'
                : 'bg-slate-50 text-slate-600 border border-slate-200/50 group-hover:bg-brand-50 group-hover:text-brand-600 group-hover:border-brand-100'
            )}
          >
            <span className="w-6 h-6 flex items-center justify-center">{icon}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatsCard;
