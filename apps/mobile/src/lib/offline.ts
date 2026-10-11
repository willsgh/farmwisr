import AsyncStorage from '@react-native-async-storage/async-storage';
import { SYNC_TABLES, applyLocal, emptySnapshot, mergePulled } from '@farmwisr/core';
import type { OutboxItem, Snapshot, SyncRow, SyncTable } from '@farmwisr/core';
import { useSyncExternalStore } from 'react';
import { photoUploaded, readPhoto } from './photoStore';
import { PHOTO_BUCKET } from './photos';
import { supabase } from './supabase';

/**
 * Offline-first store. Screens read from a local snapshot kept on the device; writes are applied to it at
 * once and queued in an outbox, which is pushed to Supabase in order whenever the device is online.
 */

export interface OfflineState {
  userId: string | null;
  loaded: boolean;
  snapshot: Snapshot;
  outbox: OutboxItem[];
  /** Storage paths of photos kept on the device and not yet uploaded. */
  uploads: string[];
  syncing: boolean;
  /** Set when the server rejected a change (not when the device is simply offline). */
  error: string | null;
  lastSyncedAt: string | null;
}

const initialState: OfflineState = {
  userId: null,
  loaded: false,
  snapshot: emptySnapshot(),
  outbox: [],
  uploads: [],
  syncing: false,
  error: null,
  lastSyncedAt: null,
};

let state = initialState;
const listeners = new Set<() => void>();

function setState(patch: Partial<OfflineState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useOffline(): OfflineState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

const storageKey = (userId: string) => `farmwisr:offline:${userId}`;

async function persist() {
  if (!state.userId) return;
  const { snapshot, outbox, uploads, lastSyncedAt } = state;
  await AsyncStorage.setItem(storageKey(state.userId), JSON.stringify({ snapshot, outbox, uploads, lastSyncedAt }));
}

/** Loads this user's saved records from the device, then syncs. Queued changes survive app restarts. */
export async function openStore(userId: string) {
  if (state.userId === userId) return;
  const saved = await AsyncStorage.getItem(storageKey(userId));
  const parsed = saved ? (JSON.parse(saved) as Pick<OfflineState, 'snapshot' | 'outbox' | 'uploads' | 'lastSyncedAt'>) : null;
  setState({
    ...initialState,
    userId,
    loaded: true,
    snapshot: { ...emptySnapshot(), ...parsed?.snapshot },
    outbox: parsed?.outbox ?? [],
    uploads: parsed?.uploads ?? [],
    lastSyncedAt: parsed?.lastSyncedAt ?? null,
  });
  void sync();
}

/** Forgets the open user in memory. Their records and queued changes stay on the device for next sign-in. */
export function closeStore() {
  setState(initialState);
}

/** Applies a write locally right away and queues it for the server. */
export function write(table: SyncTable, row: SyncRow) {
  const item = { table, row };
  setState({ snapshot: applyLocal(state.snapshot, item), outbox: [...state.outbox, item] });
  void persist();
  void sync();
}

/** Queues a photo already kept on the device (see photoStore) for upload. */
export function queueUpload(path: string) {
  setState({ uploads: [...state.uploads, path] });
  void persist();
  void sync();
}

/** The device's current copy of a row, or null. */
export function getRow(table: SyncTable, id: string): SyncRow | null {
  return state.snapshot[table].find((r) => r.id === id) ?? null;
}

// supabase-js reports a failed request (no connection) as an error without a Postgres/PostgREST code.
const isOfflineError = (error: { code?: string }) => !error.code;

export async function sync() {
  if (!supabase || !state.userId || state.syncing) return;
  const userId = state.userId;
  setState({ syncing: true });

  try {
    // Push queued changes in the order they were made (an activity before its costs).
    while (state.outbox.length > 0 && state.userId === userId) {
      const [item] = state.outbox;
      const { error } = await supabase.from(item.table).upsert(item.row, { onConflict: 'id' });
      if (error) {
        if (!isOfflineError(error)) setState({ error: error.message });
        return;
      }
      setState({ outbox: state.outbox.slice(1), error: null });
      await persist();
    }

    // Then upload photos. Their records went first, so the server can check the farmer owns the activity.
    while (state.uploads.length > 0 && state.userId === userId) {
      const [path] = state.uploads;
      const bytes = await readPhoto(path);
      if (bytes) {
        const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
        if (error) {
          // Storage reports an HTTP status when the server answered; without one, the device is offline.
          if ('status' in error && error.status) setState({ error: error.message });
          return;
        }
        await photoUploaded(path);
      }
      setState({ uploads: state.uploads.slice(1), error: null });
      await persist();
    }

    // Refresh from the server; row-level security limits this to the user's own farm.
    const results = await Promise.all(SYNC_TABLES.map((table) => supabase!.from(table).select('*')));
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      if (!isOfflineError(failed.error)) setState({ error: failed.error.message });
      return;
    }
    if (state.userId !== userId) return;
    const pulled = emptySnapshot();
    SYNC_TABLES.forEach((table, i) => {
      pulled[table] = (results[i].data ?? []) as SyncRow[];
    });
    setState({ snapshot: mergePulled(pulled, state.outbox), lastSyncedAt: new Date().toISOString(), error: null });
    await persist();
  } finally {
    if (state.userId === userId) setState({ syncing: false });
  }
}
