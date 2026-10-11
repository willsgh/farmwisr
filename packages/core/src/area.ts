import type { AreaUnit } from './types';

/** 1 acre = 0.40468564224 hectares (international acre). */
export const HECTARES_PER_ACRE = 0.40468564224;

export function toHectares(value: number, unit: AreaUnit): number {
  return unit === 'acre' ? value * HECTARES_PER_ACRE : value;
}

export function fromHectares(hectares: number, unit: AreaUnit): number {
  return unit === 'acre' ? hectares / HECTARES_PER_ACRE : hectares;
}
