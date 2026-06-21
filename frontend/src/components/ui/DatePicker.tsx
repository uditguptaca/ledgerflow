import React from 'react';
import clsx from 'clsx';
import { CalendarIcon } from '@heroicons/react/24/outline';

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const internalId = React.useId();
    const dateId = id || internalId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={dateId}
            className="text-xs font-semibold text-slate-700 tracking-wide select-none"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <input
            ref={ref}
            id={dateId}
            type="date"
            className={clsx(
              'input-base pl-10 block w-full',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500/20 hover:border-red-400',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-600 font-medium animate-fade-in">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
export default DatePicker;
