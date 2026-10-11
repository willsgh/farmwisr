import type { CurrencyCode } from './types';

/** Formats minor units as a display amount, e.g. formatMoney(1250, 'GHS') -> "GHS 12.50". */
export function formatMoney(amountMinor: number, currency: CurrencyCode): string {
  const sign = amountMinor < 0 ? '-' : '';
  const abs = Math.abs(amountMinor);
  const major = Math.floor(abs / 100).toLocaleString('en-GB');
  const minor = String(abs % 100).padStart(2, '0');
  return `${sign}${currency} ${major}.${minor}`;
}

/** Parses a typed amount such as "12.5", "1,250.00" or "40" into minor units. Returns null if invalid or negative. */
export function parseMoneyToMinor(input: string): number | null {
  const cleaned = input.replace(/[\s,]/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const [major, minor = ''] = cleaned.split('.');
  return Number(major) * 100 + Number(minor.padEnd(2, '0'));
}
