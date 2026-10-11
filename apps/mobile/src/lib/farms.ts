import type { AreaUnit } from '@farmwisr/core';
import { supabase } from './supabase';

export interface Farm {
  id: string;
  name: string;
  country_code: string;
  currency: string;
  area_unit: AreaUnit;
}

export interface Field {
  id: string;
  farm_id: string;
  name: string;
  area_hectares: number | null;
}

function client() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

/** v1 has one farm per account; returns it, or null before the farmer has created it. */
export async function getMyFarm(): Promise<Farm | null> {
  const { data, error } = await client()
    .from('farms')
    .select('id, name, country_code, currency, area_unit')
    .order('created_at')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createFarm(name: string, areaUnit: AreaUnit): Promise<Farm> {
  const { data, error } = await client()
    .from('farms')
    .insert({ name, area_unit: areaUnit })
    .select('id, name, country_code, currency, area_unit')
    .single();
  if (error) throw error;
  return data;
}

export async function listFields(farmId: string): Promise<Field[]> {
  const { data, error } = await client()
    .from('fields')
    .select('id, farm_id, name, area_hectares')
    .eq('farm_id', farmId)
    .order('name');
  if (error) throw error;
  return data;
}

export async function createField(farmId: string, name: string, areaHectares: number | null): Promise<Field> {
  const { data, error } = await client()
    .from('fields')
    .insert({ farm_id: farmId, name, area_hectares: areaHectares })
    .select('id, farm_id, name, area_hectares')
    .single();
  if (error) throw error;
  return data;
}
