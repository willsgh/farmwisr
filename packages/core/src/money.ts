import type { CurrencyCode } from './types';

/** Formats minor units as a display amount, e.g. formatMoney(1250, 'GHS') -> "GHS 12.50". */
export function formatMoney(amountMinor: number, currency: CurrencyCode): string {
  const sign = amountMinor < 0 ? '-' : '';
  const abs = Math.abs(amountMinor);
  const major = Math.floor(abs / 100).toLocaleString('en-GB');
  const minor = String(abs % 100).padStart(2, '0');
  return `${sign}${currency} ${major}.${minor}`;
}
