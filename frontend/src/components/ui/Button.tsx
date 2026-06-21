import React from 'react';
import clsx from 'clsx';
import { LoadingSpinner } from './LoadingSpinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'btn-base shadow-sm active:scale-[0.98]';

    const variants = {
      primary: 'bg-brand-600 hover:bg-brand-700 text-white focus:ring-brand-500 focus:ring-offset-2',
      secondary: 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-brand-500',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 focus:ring-offset-2',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-500 shadow-none active:scale-100',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
    };

    const isBtnDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isBtnDisabled}
        className={clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          isLoading && 'cursor-wait opacity-80',
          className
        )}
        {...props}
      >
        {isLoading && (
          <LoadingSpinner
            size="sm"
            className={clsx(
              variant === 'primary' || variant === 'danger'
                ? 'border-white/30 border-t-white'
                : 'border-slate-300 border-t-brand-600'
            )}
          />
        )}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
