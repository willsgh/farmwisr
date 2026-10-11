import { describe, expect, it } from 'vitest';
import { formatMoney, fromHectares, summariseSeason, toHectares } from './index';
import type { Activity } from './index';

const activity = (overrides: Partial<Activity>): Activity => ({
  id: 'a',
  seasonId: 's1',
  stage: 'land_preparation',
  date: '2026-04-01',
  type: 'ploughing',
  costs: [],
  ...overrides,
});

describe('area', () => {
  it('converts acres to hectares and back', () => {
    expect(toHectares(1, 'acre')).toBeCloseTo(0.4047, 4);
    expect(fromHectares(toHectares(2.5, 'acre'), 'acre')).toBeCloseTo(2.5, 10);
    expect(toHectares(3, 'hectare')).toBe(3);
  });
});

describe('formatMoney', () => {
  it('formats minor units', () => {
    expect(formatMoney(125050, 'GHS')).toBe('GHS 1,250.50');
    expect(formatMoney(-5, 'GHS')).toBe('-GHS 0.05');
  });
});

describe('summariseSeason', () => {
  it('totals costs by stage and category and works out cost per hectare', () => {
    const summary = summariseSeason(
      [
        activity({ costs: [{ category: 'equipment', amountMinor: 30000 }, { category: 'labour', amountMinor: 10000 }] }),
        activity({ stage: 'planting', costs: [{ category: 'inputs', amountMinor: 20000 }] }),
        activity({ stage: 'harvest', harvestQuantity: 12, harvestUnit: 'bag', costs: [{ category: 'labour', amountMinor: 5000 }] }),
        activity({ stage: 'harvest', harvestQuantity: 8, harvestUnit: 'bag', costs: [] }),
      ],
      { value: 2, unit: 'hectare' },
    );
    expect(summary.activityCount).toBe(4);
    expect(summary.totalCostMinor).toBe(65000);
    expect(summary.costByStage.land_preparation).toBe(40000);
    expect(summary.costByStage.harvest).toBe(5000);
    expect(summary.costByCategory.labour).toBe(15000);
    expect(summary.harvestByUnit).toEqual({ bag: 20 });
    expect(summary.costPerHectareMinor).toBe(32500);
  });

  it('returns null cost per hectare without a field area', () => {
    expect(summariseSeason([]).costPerHectareMinor).toBeNull();
  });
});
