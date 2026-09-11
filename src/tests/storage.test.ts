import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LearnerStore } from '../services/storage/store';
import { SCHEMA_VERSION, ValidationError, emptyData, storageKey, validatePersisted } from '../services/storage/schema';
import type { NotebookEntry, PersistedData } from '../domain/types';

const CONTENT_VERSION = '1.0.0';
const BASE = '/music/';
const KEY = storageKey(BASE);

function entry(overrides: Partial<NotebookEntry> = {}): NotebookEntry {
  const now = new Date().toISOString();
  return {
    id: 'nb-1',
    title: 'A draft melody',
    kind: 'melody',
    text: 'Bar 2 is one beat short.',
    tags: ['draft'],
    draft: true,
    arrangements: [{ id: 'arr-1', title: 'F–C–G–C', chords: [], patternId: 'bass-chord', comment: 'Warmer.' }],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('storage keys and validation', () => {
  it('namespaces by app and deployment path', () => {
    expect(storageKey('/music/')).toBe('inner-melody:music:v1');
    expect(storageKey('/')).toBe('inner-melody:root:v1');
    expect(storageKey('/a/b/')).toBe('inner-melody:a/b:v1');
  });

  it('rejects a newer schema with a clear message', () => {
    expect(() => validatePersisted({ ...emptyData(CONTENT_VERSION), schemaVersion: 99 }, CONTENT_VERSION))
      .toThrow(/newer version/);
  });

  it('skips invalid records instead of discarding the whole file', () => {
    const result = validatePersisted({
      ...emptyData(CONTENT_VERSION),
      reviews: [
        { id: 'r1', lessonId: 'm01-l01', exerciseId: 'q-m01-l01', stage: 0, dueDate: '2026-03-01' },
        { id: 'r2', lessonId: 'm01-l02', exerciseId: 'q', stage: 0, dueDate: 'not-a-date' },
      ],
    }, CONTENT_VERSION);
    expect(result.data.reviews).toHaveLength(1);
    expect(result.warnings.length).toBe(1);
  });

  it('treats imported text as text, never as markup', () => {
    const result = validatePersisted({
      ...emptyData(CONTENT_VERSION),
      notebook: [entry({ text: '<script>alert(1)</script>' })],
    }, CONTENT_VERSION);
    expect(result.data.notebook[0].text).toBe('<script>alert(1)</script>');
    expect(typeof result.data.notebook[0].text).toBe('string');
  });
});

describe('LearnerStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useRealTimers();
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  it('round-trips drafts, arrangements and readiness', () => {
    const store = new LearnerStore(BASE, CONTENT_VERSION);
    store.update((draft) => {
      draft.notebook.push(entry());
      draft.lessons['m01-l01'] = {
        lessonId: 'm01-l01',
        status: 'completed',
        blockIndex: 3,
        readiness: 'with-help',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }, { immediate: true });

    const reloaded = new LearnerStore(BASE, CONTENT_VERSION);
    expect(reloaded.data.notebook[0].draft).toBe(true);
    expect(reloaded.data.notebook[0].arrangements[0].patternId).toBe('bass-chord');
    expect(reloaded.data.lessons['m01-l01'].readiness).toBe('with-help');
    expect(reloaded.status.kind).toBe('saved');
  });

  it('leaves corrupt JSON untouched and offers the raw value', () => {
    window.localStorage.setItem(KEY, '{ this is not json');
    const store = new LearnerStore(BASE, CONTENT_VERSION);
    expect(store.status.kind).toBe('invalid');
    expect(window.localStorage.getItem(KEY)).toBe('{ this is not json');
    if (store.status.kind === 'invalid') {
      expect(store.status.raw).toBe('{ this is not json');
    }
    // A fresh temporary session is still usable.
    expect(store.data.notebook).toEqual([]);
  });

  it('never reports Saved when the write failed', () => {
    const store = new LearnerStore(BASE, CONTENT_VERSION);
    const spy = vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    store.update((draft) => { draft.notebook.push(entry()); }, { immediate: true });
    expect(store.status.kind).toBe('unavailable');
    expect(store.data.notebook).toHaveLength(1); // kept in memory
    expect(store.exportJson()).toContain('A draft melody');
    spy.mockRestore();
  });

  it('previews an import without mutating anything, and cancel keeps current data', () => {
    const store = new LearnerStore(BASE, CONTENT_VERSION);
    store.update((draft) => { draft.notebook.push(entry({ id: 'local', title: 'Local entry' })); }, { immediate: true });

    const incoming: PersistedData = {
      ...emptyData(CONTENT_VERSION),
      notebook: [entry({ id: 'imported', title: 'Imported entry' })],
    };
    const preview = store.previewImport(JSON.stringify(incoming));
    expect(preview.data.notebook[0].title).toBe('Imported entry');
    // Nothing changed: cancelling is simply not calling applyImport.
    expect(store.data.notebook[0].title).toBe('Local entry');

    store.applyImport(preview.data);
    expect(store.data.notebook).toHaveLength(1);
    expect(store.data.notebook[0].title).toBe('Imported entry');
  });

  it('rejects oversized and non-JSON imports', () => {
    const store = new LearnerStore(BASE, CONTENT_VERSION);
    expect(() => store.previewImport('not json')).toThrow(ValidationError);
    expect(() => store.previewImport('x'.repeat(6 * 1024 * 1024))).toThrow(/larger than/);
  });

  it('resets progress while preserving the notebook and settings', () => {
    const store = new LearnerStore(BASE, CONTENT_VERSION);
    store.update((draft) => {
      draft.notebook.push(entry());
      draft.settings.labelMode = 'degrees';
      draft.lessons['m01-l01'] = {
        lessonId: 'm01-l01', status: 'completed', blockIndex: 0, updatedAt: new Date().toISOString(),
      };
      draft.reviews.push({ id: 'r', lessonId: 'm01-l01', exerciseId: 'q', stage: 1, dueDate: '2026-03-01' });
    }, { immediate: true });

    store.resetProgress();
    expect(store.data.lessons).toEqual({});
    expect(store.data.reviews).toEqual([]);
    expect(store.data.notebook).toHaveLength(1);
    expect(store.data.settings.labelMode).toBe('degrees');
  });

  it('deletes only its own namespaced key', () => {
    window.localStorage.setItem('unrelated-app', 'keep me');
    const store = new LearnerStore(BASE, CONTENT_VERSION);
    store.update((draft) => { draft.notebook.push(entry()); }, { immediate: true });
    expect(window.localStorage.getItem(KEY)).not.toBeNull();

    store.deleteAll();
    expect(window.localStorage.getItem(KEY)).toBeNull();
    expect(window.localStorage.getItem('unrelated-app')).toBe('keep me');
  });

  it('exports an identified JSON payload with the current schema', () => {
    const store = new LearnerStore(BASE, CONTENT_VERSION);
    const parsed = JSON.parse(store.exportJson()) as Record<string, unknown>;
    expect(parsed.app).toBe('inner-melody');
    expect(parsed.schemaVersion).toBe(SCHEMA_VERSION);
    expect(typeof parsed.exportedAt).toBe('string');
  });

  it('pauses autosaving when another tab saves newer data over unsaved edits', () => {
    const store = new LearnerStore(BASE, CONTENT_VERSION);
    store.update((draft) => { draft.notebook.push(entry({ id: 'mine', title: 'My unsaved edit' })); });

    const newer: PersistedData = {
      ...emptyData(CONTENT_VERSION),
      revision: 9999,
      notebook: [entry({ id: 'theirs', title: 'Other tab' })],
    };
    window.dispatchEvent(new StorageEvent('storage', {
      key: KEY,
      newValue: JSON.stringify(newer),
    }));

    expect(store.status.kind).toBe('conflict');
    expect(store.data.notebook[0].title).toBe('My unsaved edit');
    expect(store.exportJson()).toContain('My unsaved edit');

    store.reloadSavedVersion();
    expect(store.status.kind).not.toBe('conflict');
  });

  it('adopts a newer revision from another tab when there are no local edits', () => {
    const store = new LearnerStore(BASE, CONTENT_VERSION);
    store.flush();
    const newer: PersistedData = {
      ...emptyData(CONTENT_VERSION),
      revision: 500,
      notebook: [entry({ id: 'theirs', title: 'Other tab' })],
    };
    window.localStorage.setItem(KEY, JSON.stringify(newer));
    window.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: JSON.stringify(newer) }));
    expect(store.data.notebook[0].title).toBe('Other tab');
  });
});
