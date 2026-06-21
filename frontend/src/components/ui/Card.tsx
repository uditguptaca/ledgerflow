import React from 'react';
import clsx from 'clsx';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  title,
  description,
  headerActions,
  footer,
  noPadding = false,
  hoverable = false,
  children,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'bg-white border border-slate-200/80 rounded-xl transition-all duration-200',
        hoverable ? 'shadow-card hover:shadow-soft hover:-translate-y-0.5' : 'shadow-card',
        className
      )}
      {...props}
    >
      {(title || description || headerActions) && (
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-100/80">
          <div className="flex flex-col gap-0.5">
            {title && (
              typeof title === 'string' ? (
                <h3 className="text-base font-bold text-slate-800 tracking-tight">{title}</h3>
              ) : (
                title
              )
            )}
            {description && (
              typeof description === 'string' ? (
                <p className="text-xs text-slate-500 font-medium">{description}</p>
              ) : (
                description
              )
            )}
          </div>
          {headerActions && <div className="shrink-0">{headerActions}</div>}
        </div>
      )}
      
      <div className={clsx(!noPadding && 'px-6 py-5', 'w-full')}>{children}</div>
      
      {footer && (
        <div className="px-6 py-3.5 border-t border-slate-100/80 bg-slate-50/50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
