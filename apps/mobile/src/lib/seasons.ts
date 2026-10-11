import type { Activity, ActivityCost, CostCategory, SeasonStage } from '@farmwisr/core';
import type { Field } from './farms';
import { supabase } from './supabase';

export interface Season {
  id: string;
  field_id: string;
  crop: string;
  variety: string | null;
  start_date: string;
  end_date: string | null;
}

interface ActivityRow {
  id: string;
  season_id: string;
  stage: SeasonStage;
  type: string;
  activity_date: string;
  notes: string | null;
  harvest_quantity: number | null;
  harvest_unit: string | null;
  activity_costs: { category: CostCategory; amount_minor: number }[];
}

export interface NewActivity {
  seasonId: string;
  stage: SeasonStage;
  type: string;
  date: string;
  notes: string | null;
  costs: ActivityCost[];
  harvestQuantity: number | null;
  harvestUnit: string | null;
}

const SEASON_COLUMNS = 'id, field_id, crop, variety, start_date, end_date';
const ACTIVITY_COLUMNS =
  'id, season_id, stage, type, activity_date, notes, harvest_quantity, harvest_unit, activity_costs(category, amount_minor)';

function client() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    seasonId: row.season_id,
    stage: row.stage,
    type: row.type,
    date: row.activity_date,
    notes: row.notes ?? undefined,
    harvestQuantity: row.harvest_quantity === null ? undefined : Number(row.harvest_quantity),
    harvestUnit: row.harvest_unit ?? undefined,
    // bigint columns can arrive as strings, so convert explicitly.
    costs: row.activity_costs.map((c) => ({ category: c.category, amountMinor: Number(c.amount_minor) })),
  };
}

export async function getField(fieldId: string): Promise<Field> {
  const { data, error } = await client().from('fields').select('id, site_id, name, area_hectares').eq('id', fieldId).single();
  if (error) throw error;
  return data;
}

export async function listSeasons(fieldId: string): Promise<Season[]> {
  const { data, error } = await client()
    .from('crop_seasons')
    .select(SEASON_COLUMNS)
    .eq('field_id', fieldId)
    .order('start_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getSeason(seasonId: string): Promise<Season> {
  const { data, error } = await client().from('crop_seasons').select(SEASON_COLUMNS).eq('id', seasonId).single();
  if (error) throw error;
  return data;
}

export async function createSeason(season: {
  fieldId: string;
  crop: string;
  variety: string | null;
  startDate: string;
}): Promise<Season> {
  const { data, error } = await client()
    .from('crop_seasons')
    .insert({ field_id: season.fieldId, crop: season.crop, variety: season.variety, start_date: season.startDate })
    .select(SEASON_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function listActivities(seasonId: string): Promise<Activity[]> {
  const { data, error } = await client()
    .from('activities')
    .select(ACTIVITY_COLUMNS)
    .eq('season_id', seasonId)
    .order('activity_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ActivityRow[]).map(toActivity);
}

export async function createActivity(activity: NewActivity): Promise<void> {
  const db = client();
  const { data, error } = await db
    .from('activities')
    .insert({
      season_id: activity.seasonId,
      stage: activity.stage,
      type: activity.type,
      activity_date: activity.date,
      notes: activity.notes,
      harvest_quantity: activity.harvestQuantity,
      harvest_unit: activity.harvestUnit,
    })
    .select('id')
    .single();
  if (error) throw error;

  if (activity.costs.length === 0) return;
  const { error: costError } = await db
    .from('activity_costs')
    .insert(activity.costs.map((c) => ({ activity_id: data.id, category: c.category, amount_minor: c.amountMinor })));
  if (costError) {
    // Don't leave an activity without the costs the farmer entered.
    await db.from('activities').delete().eq('id', data.id);
    throw costError;
  }
}
