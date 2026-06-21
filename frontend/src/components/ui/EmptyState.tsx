import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';
import clsx from 'clsx';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onActionClick?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onActionClick,
  isLoading = false,
  className,
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-xl bg-white border border-dashed border-slate-300/80 shadow-xs',
        className
      )}
    >
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 mb-4 border border-brand-100/50 shadow-2xs">
        {icon || <DocumentTextIcon className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-bold text-slate-800 tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onActionClick && (
        <Button onClick={onActionClick} isLoading={isLoading} size="sm">
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
