import React from 'react';
import clsx from 'clsx';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

// 1. Container
export const TableContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-xs',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// 2. Table
export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <table className={clsx('w-full border-collapse text-left align-middle', className)} {...props}>
      {children}
    </table>
  );
};

// 3. Table Header Wrapper
export const TableHead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <thead className={clsx('bg-slate-50 border-b border-slate-200/60', className)} {...props}>
      {children}
    </thead>
  );
};

// 4. Table Header Cell
export const TableHeader: React.FC<React.ThHTMLAttributes<HTMLTableHeaderCellElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <th className={clsx('table-header', className)} {...props}>
      {children}
    </th>
  );
};

// 5. Table Body
export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <tbody className={clsx('divide-y divide-slate-100', className)} {...props}>
      {children}
    </tbody>
  );
};

// 6. Table Row
export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <tr
      className={clsx(
        'hover:bg-slate-50/50 transition-colors duration-150',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
};

// 7. Table Cell
export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <td className={clsx('table-cell font-normal', className)} {...props}>
      {children}
    </td>
  );
};

// 8. Pagination Component
export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * (pageSize || 0) + 1;
  const endItem = Math.min(currentPage * (pageSize || 0), totalItems || 0);

  // Generate pagination pages array with ellipses
  const getPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const pages = getPages();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-100 sm:px-6">
      {/* Mobile view */}
      <div className="flex justify-between flex-1 sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>

      {/* Desktop view */}
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          {totalItems !== undefined && pageSize !== undefined && (
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-800">{startItem}</span> to{' '}
              <span className="font-semibold text-slate-800">{endItem}</span> of{' '}
              <span className="font-semibold text-slate-800">{totalItems}</span> entries
            </p>
          )}
        </div>
        <div>
          <nav className="inline-flex -space-x-px rounded-lg shadow-2xs" aria-label="Pagination">
            {/* Left arrow */}
            <button
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 text-slate-400 bg-white border border-slate-300 rounded-l-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
            </button>

            {pages.map((p, idx) => {
              if (p === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="relative inline-flex items-center px-3 py-2 text-sm text-slate-400 bg-white border border-slate-300"
                  >
                    ...
                  </span>
                );
              }

              const pageNum = p as number;
              const isSelected = pageNum === currentPage;

              return (
                <button
                  key={`page-${pageNum}`}
                  onClick={() => onPageChange(pageNum)}
                  className={clsx(
                    'relative inline-flex items-center px-3.5 py-2 text-sm font-medium border transition-colors',
                    isSelected
                      ? 'z-10 bg-brand-50 border-brand-500 text-brand-600 hover:bg-brand-100/70'
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  )}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Right arrow */}
            <button
              onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 text-slate-400 bg-white border border-slate-300 rounded-r-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
