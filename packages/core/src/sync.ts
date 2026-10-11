/**
 * Offline-first sync model: every write is applied to a local snapshot at once and queued in an outbox.
 * The outbox is pushed to the server in order when online; then the snapshot is refreshed from the server,
 * keeping any local rows the server doesn't have yet.
 */

export const SYNC_TABLES = ['farms', 'sites', 'fields', 'crop_seasons', 'activities', 'activity_costs', 'activity_photos'] as const;
export type SyncTable = (typeof SYNC_TABLES)[number];

export type SyncRow = { id: string } & Record<string, unknown>;
export type Snapshot = Record<SyncTable, SyncRow[]>;

export interface OutboxItem {
  table: SyncTable;
  row: SyncRow;
}

export function emptySnapshot(): Snapshot {
  return { farms: [], sites: [], fields: [], crop_seasons: [], activities: [], activity_costs: [], activity_photos: [] };
}

/** Inserts or replaces a row (matched by id) in the snapshot, without mutating the input. */
export function applyLocal(snapshot: Snapshot, item: OutboxItem): Snapshot {
  const rows = snapshot[item.table];
  const index = rows.findIndex((r) => r.id === item.row.id);
  const next = index === -1 ? [...rows, item.row] : rows.map((r, i) => (i === index ? { ...r, ...item.row } : r));
  return { ...snapshot, [item.table]: next };
}

/** The server's rows, plus any queued local rows the server hasn't received yet. */
export function mergePulled(pulled: Snapshot, outbox: OutboxItem[]): Snapshot {
  return outbox.reduce((snapshot, item) => applyLocal(snapshot, item), pulled);
}
