import { describe, expect, it } from 'vitest';
import { applyLocal, emptySnapshot, mergePulled } from './sync';

describe('sync', () => {
  it('applies local writes without mutating the snapshot', () => {
    const before = emptySnapshot();
    const after = applyLocal(before, { table: 'sites', row: { id: 's1', name: 'Ejura' } });
    expect(before.sites).toEqual([]);
    expect(after.sites).toEqual([{ id: 's1', name: 'Ejura' }]);
  });

  it('replaces a row with the same id', () => {
    const one = applyLocal(emptySnapshot(), { table: 'fields', row: { id: 'f1', name: 'North' } });
    const two = applyLocal(one, { table: 'fields', row: { id: 'f1', name: 'North plot' } });
    expect(two.fields).toEqual([{ id: 'f1', name: 'North plot' }]);
  });

  it('keeps queued rows the server does not have yet when merging a pull', () => {
    const pulled = { ...emptySnapshot(), sites: [{ id: 's1', name: 'Ejura' }] };
    const merged = mergePulled(pulled, [
      { table: 'sites', row: { id: 's1', name: 'Ejura' } },
      { table: 'fields', row: { id: 'f1', site_id: 's1', name: 'North plot' } },
    ]);
    expect(merged.sites).toHaveLength(1);
    expect(merged.fields).toEqual([{ id: 'f1', site_id: 's1', name: 'North plot' }]);
  });

  it('drops local rows that were synced and then removed on the server', () => {
    const merged = mergePulled(emptySnapshot(), []);
    expect(merged.sites).toEqual([]);
  });
});
