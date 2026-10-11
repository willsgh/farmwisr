import type { SeasonStage } from './types';

/** Common activity types per stage, shown as quick picks on the entry form. "Other" lets farmers type their own. */
export const ACTIVITY_TYPES: Record<SeasonStage, string[]> = {
  land_preparation: ['Clearing', 'Ploughing', 'Harrowing', 'Ridging or mounding', 'Liming', 'Soil test'],
  planting: ['Sowing seed', 'Transplanting seedlings', 'Planting suckers or cuttings', 'Replanting gaps'],
  crop_care: ['Fertiliser application', 'Irrigation', 'Weeding', 'Thinning', 'Pruning'],
  crop_protection: ['Scouting', 'Herbicide spray', 'Insecticide spray', 'Fungicide spray'],
  harvest: ['Harvesting'],
  post_harvest: ['Drying', 'Shelling or threshing', 'Storage', 'Transport', 'Sale'],
};

export const HARVEST_UNITS = ['bag', 'kg', 'tonne', 'crate', 'bunch', 'tuber'] as const;

/** Common crops in Ghana, offered as quick picks when starting a season. Farmers can type any other crop. */
export const COMMON_CROPS = [
  'Maize', 'Cassava', 'Yam', 'Plantain', 'Rice', 'Cocoa', 'Soybean', 'Groundnut', 'Tomato', 'Pepper',
] as const;
