import { describe, expect, it } from 'vitest';
import { isIsoDate, todayIso } from './dates';

describe('dates', () => {
  it('formats today as YYYY-MM-DD', () => {
    expect(todayIso(new Date(2026, 9, 5))).toBe('2026-10-05');
  });

  it('accepts real dates only', () => {
    expect(isIsoDate('2026-04-01')).toBe(true);
    expect(isIsoDate('2028-02-29')).toBe(true);
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('1/4/2026')).toBe(false);
  });
});
