import React from 'react';
import clsx from 'clsx';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-slate-300 border-t-brand-600',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="loading"
    />
  );
};

export default LoadingSpinner;
