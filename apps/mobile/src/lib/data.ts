import { boundaryAreaHectares, boundaryFromGeoJson, boundaryToGeoJson } from '@farmwisr/core';
import type { Activity, ActivityCost, AreaUnit, CostCategory, LngLat, SeasonStage } from '@farmwisr/core';
import { randomUUID } from 'expo-crypto';
import { useMemo } from 'react';
import { getRow, queueUpload, useOffline, write } from './offline';
import { keepPhoto } from './photoStore';

export interface Farm {
  id: string;
  name: string;
  currency: string;
  area_unit: AreaUnit;
  created_at: string;
}

export interface Site {
  id: string;
  farm_id: string;
  name: string;
  community: string | null;
  region: string | null;
}

export interface Field {
  id: string;
  site_id: string;
  name: string;
  area_hectares: number | null;
  /** Corners of the mapped boundary; empty if the field hasn't been mapped. */
  boundary: LngLat[];
}

interface FieldRow extends Omit<Field, 'boundary'> {
  boundary_geojson: unknown;
}

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
  harvest_quantity: number | string | null;
  harvest_unit: string | null;
  latitude: number | null;
  longitude: number | null;
  location_accuracy_m: number | null;
  created_at: string;
}

interface PhotoRow {
  id: string;
  activity_id: string;
  storage_path: string;
  created_at: string;
}

interface CostRow {
  id: string;
  activity_id: string;
  category: CostCategory;
  amount_minor: number | string;
}

const now = () => new Date().toISOString();
const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);
// Postgres numeric and bigint values can arrive from the server as strings.
const num = (value: number | string | null) => (value === null ? null : Number(value));

/** Reads the device's copy of the user's farm. Re-renders when it changes locally or after a sync. */
export function useFarmData() {
  const { snapshot, loaded, lastSyncedAt } = useOffline();
  return useMemo(() => {
    const farms = (snapshot.farms as unknown as Farm[]).slice().sort((a, b) => a.created_at.localeCompare(b.created_at));
    const sites = snapshot.sites as unknown as Site[];
    const fields: Field[] = (snapshot.fields as unknown as FieldRow[]).map((f) => ({
      id: f.id,
      site_id: f.site_id,
      name: f.name,
      area_hectares: num(f.area_hectares),
      boundary: boundaryFromGeoJson(f.boundary_geojson),
    }));
    const seasons = snapshot.crop_seasons as unknown as Season[];
    const activityRows = snapshot.activities as unknown as ActivityRow[];
    const costRows = snapshot.activity_costs as unknown as CostRow[];
    const photoRows = snapshot.activity_photos as unknown as PhotoRow[];

    // v1 has one farm per account.
    const farm = farms[0] ?? null;

    return {
      loaded,
      /** False until this device has synced at least once, i.e. it may not have the farm yet. */
      hasSynced: lastSyncedAt !== null,
      farm,
      sitesOf: (farmId: string) => sites.filter((s) => s.farm_id === farmId).sort(byName),
      site: (id: string) => sites.find((s) => s.id === id) ?? null,
      fieldsOf: (siteId: string) => fields.filter((f) => f.site_id === siteId).sort(byName),
      field: (id: string) => fields.find((f) => f.id === id) ?? null,
      seasonsOf: (fieldId: string) =>
        seasons.filter((s) => s.field_id === fieldId).sort((a, b) => b.start_date.localeCompare(a.start_date)),
      season: (id: string) => seasons.find((s) => s.id === id) ?? null,
      activitiesOf: (seasonId: string): Activity[] =>
        activityRows
          .filter((a) => a.season_id === seasonId)
          .sort((a, b) => b.activity_date.localeCompare(a.activity_date) || b.created_at.localeCompare(a.created_at))
          .map((a) => ({
            id: a.id,
            seasonId: a.season_id,
            stage: a.stage,
            type: a.type,
            date: a.activity_date,
            notes: a.notes ?? undefined,
            harvestQuantity: num(a.harvest_quantity) ?? undefined,
            harvestUnit: a.harvest_unit ?? undefined,
            costs: costRows
              .filter((c) => c.activity_id === a.id)
              .map((c) => ({ category: c.category, amountMinor: Number(c.amount_minor) })),
            location:
              a.latitude === null || a.latitude === undefined || a.longitude === null || a.longitude === undefined
                ? undefined
                : { lat: Number(a.latitude), lng: Number(a.longitude), accuracyM: num(a.location_accuracy_m) ?? undefined },
            photos: photoRows
              .filter((p) => p.activity_id === a.id)
              .sort((x, y) => x.created_at.localeCompare(y.created_at))
              .map((p) => p.storage_path),
          })),
    };
  }, [snapshot, loaded, lastSyncedAt]);
}

export function createFarm(name: string, areaUnit: AreaUnit): string {
  const id = randomUUID();
  // currency and country default to Ghana on the server; set here too so the device shows them before syncing.
  write('farms', { id, name, area_unit: areaUnit, currency: 'GHS', country_code: 'GH', created_at: now() });
  return id;
}

export function createSite(farmId: string, site: { name: string; community: string | null; region: string | null }) {
  const id = randomUUID();
  write('sites', { id, farm_id: farmId, ...site, created_at: now() });
  return id;
}

export function createField(siteId: string, name: string, areaHectares: number | null) {
  const id = randomUUID();
  write('fields', { id, site_id: siteId, name, area_hectares: areaHectares, created_at: now() });
  return id;
}

/** Saves a walked or drawn boundary, and sets the field's area to the mapped area. */
export function saveFieldBoundary(fieldId: string, points: LngLat[]) {
  const current = getRow('fields', fieldId);
  if (!current) return;
  // The whole row is sent, since the server upserts it; `boundary` is derived there from the GeoJSON.
  const row = { ...current };
  delete row.boundary;
  write('fields', { ...row, boundary_geojson: boundaryToGeoJson(points), area_hectares: boundaryAreaHectares(points) });
}

export function createSeason(season: { fieldId: string; crop: string; variety: string | null; startDate: string }) {
  const id = randomUUID();
  write('crop_seasons', {
    id,
    field_id: season.fieldId,
    crop: season.crop,
    variety: season.variety,
    start_date: season.startDate,
    end_date: null,
    created_at: now(),
  });
  return id;
}

/** Saves an activity on the device, with its costs and photos, and queues it all for the server. */
export async function createActivity(activity: {
  seasonId: string;
  stage: SeasonStage;
  type: string;
  date: string;
  notes: string | null;
  costs: ActivityCost[];
  harvestQuantity: number | null;
  harvestUnit: string | null;
  location: { lat: number; lng: number; accuracyM: number | null } | null;
  /** Local URIs of prepared photos (see pickPhoto). */
  photoUris: string[];
}) {
  const id = randomUUID();
  const stamp = now();
  // Keep the photos on the device first, so nothing is queued for a photo that failed to save.
  const photoPaths: string[] = [];
  for (const uri of activity.photoUris) {
    const path = `${id}/${randomUUID()}.jpg`;
    await keepPhoto(path, uri);
    photoPaths.push(path);
  }

  write('activities', {
    id,
    season_id: activity.seasonId,
    stage: activity.stage,
    type: activity.type,
    activity_date: activity.date,
    notes: activity.notes,
    harvest_quantity: activity.harvestQuantity,
    harvest_unit: activity.harvestUnit,
    latitude: activity.location?.lat ?? null,
    longitude: activity.location?.lng ?? null,
    location_accuracy_m: activity.location?.accuracyM ?? null,
    created_at: stamp,
    updated_at: stamp,
  });
  // Queued after the activity, so they always reach the server after it.
  for (const cost of activity.costs) {
    write('activity_costs', { id: randomUUID(), activity_id: id, category: cost.category, amount_minor: cost.amountMinor });
  }
  for (const path of photoPaths) {
    write('activity_photos', { id: randomUUID(), activity_id: id, storage_path: path, created_at: now() });
    queueUpload(path);
  }
  return id;
}
