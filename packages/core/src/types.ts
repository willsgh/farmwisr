/** Stages of a crop season, from land preparation to post-harvest. */
export const SEASON_STAGES = [
  'land_preparation',
  'planting',
  'crop_care',
  'crop_protection',
  'harvest',
  'post_harvest',
] as const;

export type SeasonStage = (typeof SEASON_STAGES)[number];

export const STAGE_LABELS: Record<SeasonStage, string> = {
  land_preparation: 'Land preparation',
  planting: 'Planting',
  crop_care: 'Crop care',
  crop_protection: 'Crop protection',
  harvest: 'Harvest',
  post_harvest: 'Post-harvest',
};

export type AreaUnit = 'acre' | 'hectare';

/** ISO 4217 code, e.g. GHS. Amounts are stored in minor units (pesewas for GHS). */
export type CurrencyCode = string;

export type CostCategory = 'inputs' | 'labour' | 'equipment' | 'other';

export interface Money {
  /** Integer amount in minor units, e.g. 1250 = GHS 12.50. */
  amountMinor: number;
  currency: CurrencyCode;
}

export interface ActivityCost {
  category: CostCategory;
  amountMinor: number;
}

export interface Activity {
  id: string;
  seasonId: string;
  stage: SeasonStage;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  type: string;
  notes?: string;
  costs: ActivityCost[];
  /** Quantity harvested, only on harvest activities. */
  harvestQuantity?: number;
  harvestUnit?: string;
  /** Where the activity was logged, if the farmer added their location. */
  location?: { lat: number; lng: number; accuracyM?: number };
  /** Storage paths of photos taken for this activity. */
  photos?: string[];
}

export interface CropSeason {
  id: string;
  fieldId: string;
  crop: string;
  variety?: string;
  startDate: string;
  endDate?: string;
  /** Set when the season is one yearly cycle of a tree-crop plantation. */
  plantationId?: string;
}
