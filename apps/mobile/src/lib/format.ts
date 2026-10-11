import { fromHectares } from '@farmwisr/core';
import type { AreaUnit } from '@farmwisr/core';

export function formatArea(hectares: number | null, unit: AreaUnit): string {
  if (hectares === null) return 'Area not set';
  return `${fromHectares(hectares, unit).toFixed(2)} ${unit === 'acre' ? 'acres' : 'ha'}`;
}
