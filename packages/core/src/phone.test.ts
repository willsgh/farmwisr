import { describe, expect, it } from 'vitest';
import { normaliseGhanaPhone } from './phone';

describe('normaliseGhanaPhone', () => {
  it.each([
    ['024 123 4567', '+233241234567'],
    ['0241234567', '+233241234567'],
    ['241234567', '+233241234567'],
    ['+233 24 123 4567', '+233241234567'],
    ['00233241234567', '+233241234567'],
    ['+233 (0)55-123-4567', '+233551234567'],
  ])('normalises %s', (input, expected) => {
    expect(normaliseGhanaPhone(input)).toBe(expected);
  });

  it.each(['', '12345', '0341234567', '+2332412345678', '+44 7700 900123', 'abc'])('rejects %s', (input) => {
    expect(normaliseGhanaPhone(input)).toBeNull();
  });
});
