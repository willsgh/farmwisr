/**
 * Normalises a Ghana mobile number to E.164 (+233XXXXXXXXX), as Supabase phone sign-in expects.
 * Accepts local (024 123 4567), national without the 0 (241234567) and international (+233 / 00233) forms.
 * Returns null when the input is not a valid Ghana mobile number.
 */
export function normaliseGhanaPhone(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  else if (digits.startsWith('00')) digits = digits.slice(2);

  let national: string;
  if (digits.startsWith('233')) national = digits.slice(3);
  else if (digits.startsWith('0')) national = digits.slice(1);
  else national = digits;

  if (national.startsWith('0')) national = national.slice(1);
  // Ghana mobile numbers are 9 digits after the country code and start with 2 or 5.
  return /^[25]\d{8}$/.test(national) ? `+233${national}` : null;
}
