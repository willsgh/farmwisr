import { describe, expect, it } from 'vitest';
import { parseMoneyToMinor } from './money';

describe('parseMoneyToMinor', () => {
  it.each([
    ['40', 4000],
    ['12.5', 1250],
    ['12.50', 1250],
    ['1,250.05', 125005],
    [' 0.07 ', 7],
    ['3.', 300],
  ])('parses %s', (input, expected) => {
    expect(parseMoneyToMinor(input)).toBe(expected);
  });

  it.each(['', 'abc', '-5', '1.234', '1.2.3'])('rejects %s', (input) => {
    expect(parseMoneyToMinor(input)).toBeNull();
  });
});
