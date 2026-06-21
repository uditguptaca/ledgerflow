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
    let d: Date;
    if (typeof date === 'string') {
      if (date.includes('T')) {
        d = new Date(date);
      } else {
        d = new Date(`${date}T00:00:00.000Z`);
      }
    } else {
      d = date;
    }

    if (isNaN(d.getTime())) return '-';

    if (formatStr === 'MMM dd, yyyy') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = months[d.getUTCMonth()];
      const year = d.getUTCFullYear();
      return `${month} ${day}, ${year}`;
    }

    if (formatStr === 'yyyy-MM-dd') {
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return d.toLocaleDateString('en-US');
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
