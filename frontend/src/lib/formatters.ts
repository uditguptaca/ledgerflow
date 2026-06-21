import { format as fnsFormat, parseISO, isValid } from 'date-fns';

/**
 * Formats a numeric amount as currency.
 * @param amount - The numeric amount to format.
 * @param currency - The ISO currency code (default: 'USD').
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${currency || '$'} ${Number(amount).toFixed(2)}`;
  }
}

/**
 * Formats a date string or Date object.
 * @param date - The date to format.
 * @param formatStr - The format pattern (default: 'MMM dd, yyyy').
 */
export function formatDate(
  date: string | Date | null | undefined,
  formatStr: string = 'MMM dd, yyyy'
): string {
  if (!date) return '-';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) return '-';
    return fnsFormat(parsedDate, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

/**
 * Formats a decimal percentage value.
 * @param value - The value to format. E.g., 0.057 -> 5.70%
 * @param isDecimal - Whether the value is a decimal representation (e.g. 0.05 -> 5%) or absolute percentage (e.g. 5 -> 5%). Default true.
 */
export function formatPercent(value: number, isDecimal: boolean = true): string {
  try {
    const normalizedValue = isDecimal ? value : value / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(normalizedValue);
  } catch (error) {
    console.error('Error formatting percent:', error);
    return `${value}%`;
  }
}
