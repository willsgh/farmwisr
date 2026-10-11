import { toHectares } from './area';
import { SEASON_STAGES } from './types';
import type { Activity, AreaUnit, CostCategory, SeasonStage } from './types';

export interface SeasonSummary {
  activityCount: number;
  totalCostMinor: number;
  costByStage: Record<SeasonStage, number>;
  costByCategory: Record<CostCategory, number>;
  /** Total harvested per unit, e.g. { bag: 40, kg: 120 }. */
  harvestByUnit: Record<string, number>;
  /** Null when the field area is unknown or zero. */
  costPerHectareMinor: number | null;
}

export function activityTotalMinor(activity: Activity): number {
  return activity.costs.reduce((sum, c) => sum + c.amountMinor, 0);
}

export function summariseSeason(
  activities: Activity[],
  fieldArea?: { value: number; unit: AreaUnit },
): SeasonSummary {
  const costByStage = Object.fromEntries(SEASON_STAGES.map((s) => [s, 0])) as Record<SeasonStage, number>;
  const costByCategory: Record<CostCategory, number> = { inputs: 0, labour: 0, equipment: 0, other: 0 };
  const harvestByUnit: Record<string, number> = {};
  let totalCostMinor = 0;

  for (const activity of activities) {
    for (const cost of activity.costs) {
      costByStage[activity.stage] += cost.amountMinor;
      costByCategory[cost.category] += cost.amountMinor;
      totalCostMinor += cost.amountMinor;
    }
    if (activity.stage === 'harvest' && activity.harvestQuantity && activity.harvestUnit) {
      harvestByUnit[activity.harvestUnit] = (harvestByUnit[activity.harvestUnit] ?? 0) + activity.harvestQuantity;
    }
  }

  const hectares = fieldArea ? toHectares(fieldArea.value, fieldArea.unit) : 0;
  return {
    activityCount: activities.length,
    totalCostMinor,
    costByStage,
    costByCategory,
    harvestByUnit,
    costPerHectareMinor: hectares > 0 ? Math.round(totalCostMinor / hectares) : null,
  };
}
