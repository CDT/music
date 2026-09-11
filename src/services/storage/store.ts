import type { PersistedData } from '../../domain/types';
import {
  APP_ID, MAX_ATTEMPTS, MAX_IMPORT_BYTES, MAX_SESSIONS, SCHEMA_VERSION,
  ValidationError, emptyData, migrate, storageKey, validatePersisted,
} from './schema';

export type StorageStatus =
  | { kind: 'saved'; at: string }
  | { kind: 'saving' }
  | { kind: 'unavailable'; message: string }
  | { kind: 'conflict'; message: string }
  | { kind: 'invalid'; message: string; raw: string };

export interface StoreSnapshot {
  data: PersistedData;
  status: StorageStatus;
  warnings: string[];
}

type Listener = (snapshot: StoreSnapshot) => void;

const SAVE_DEBOUNCE_MS = 500;

export class LearnerStore {
  private key: string;
  private contentVersion: string;
  private dataValue: PersistedData;
  private statusValue: StorageStatus;
  private warningsValue: string[] = [];
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private hasLocalEdits = false;
  private autosavePaused = false;

  constructor(basePath: string, contentVersion: string) {
    this.key = storageKey(basePath);
    this.contentVersion = contentVersion;
    this.dataValue = emptyData(contentVersion);
    this.statusValue = { kind: 'saved', at: this.dataValue.savedAt };
    const loaded = this.load();
    if (loaded) this.dataValue = loaded;
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.onStorageEvent);
    }
  }

  dispose() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.onStorageEvent);
    }
    this.flush();
  }

  get data(): PersistedData { return this.dataValue; }
  get status(): StorageStatus { return this.statusValue; }
  get warnings(): string[] { return this.warningsValue; }
  get storageKeyName(): string { return this.key; }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => { this.listeners.delete(listener); };
  }

  private snapshot(): StoreSnapshot {
    return { data: this.dataValue, status: this.statusValue, warnings: this.warningsValue };
  }

  private emit() {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) listener(snapshot);
  }

  private setStatus(status: StorageStatus) {
    this.statusValue = status;
    this.emit();
  }

  private load(): PersistedData | null {
    let raw: string | null;
    try {
      raw = window.localStorage.getItem(this.key);
    } catch (error) {
      this.statusValue = {
        kind: 'unavailable',
        message: `Changes are not being saved on this browser (${error instanceof Error ? error.message : 'storage blocked'}). Export remains available.`,
      };
      return null;
    }
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as unknown;
      const result = validatePersisted(parsed, this.contentVersion);
      this.warningsValue = result.warnings;
      this.statusValue = { kind: 'saved', at: result.data.savedAt };
      return migrate(result.data);
    } catch (error) {
      // Never overwrite unreadable data automatically.
      this.statusValue = {
        kind: 'invalid',
        message: `Saved data could not be read: ${error instanceof Error ? error.message : String(error)}. It has been left untouched; you can export the raw value below and continue in a temporary session.`,
        raw,
      };
      return null;
    }
  }

  /** Apply a change and schedule a debounced save. */
  update(mutate: (draft: PersistedData) => void, options: { immediate?: boolean } = {}) {
    const next: PersistedData = {
      ...this.dataValue,
      lessons: { ...this.dataValue.lessons },
      reviews: [...this.dataValue.reviews],
      attempts: [...this.dataValue.attempts],
      notebook: [...this.dataValue.notebook],
      sessions: [...this.dataValue.sessions],
      settings: { ...this.dataValue.settings },
    };
    mutate(next);
    next.attempts = next.attempts.slice(-MAX_ATTEMPTS);
    next.sessions = next.sessions.slice(-MAX_SESSIONS);
    next.revision = this.dataValue.revision + 1;
    next.schemaVersion = SCHEMA_VERSION;
    next.contentVersion = this.contentVersion;
    this.dataValue = next;
    this.hasLocalEdits = true;
    this.emit();
    if (options.immediate) this.flush();
    else this.scheduleSave();
  }

  private scheduleSave() {
    if (this.autosavePaused) return;
    if (this.timer !== null) clearTimeout(this.timer);
    this.setStatus({ kind: 'saving' });
    this.timer = setTimeout(() => this.flush(), SAVE_DEBOUNCE_MS);
  }

  /** Write immediately. Never reports Saved when the write failed. */
  flush() {
    if (this.timer !== null) { clearTimeout(this.timer); this.timer = null; }
    if (this.autosavePaused) return;
    const savedAt = new Date().toISOString();
    const payload: PersistedData = { ...this.dataValue, savedAt };
    try {
      window.localStorage.setItem(this.key, JSON.stringify(payload));
      this.dataValue = payload;
      this.hasLocalEdits = false;
      this.setStatus({ kind: 'saved', at: savedAt });
    } catch (error) {
      this.setStatus({
        kind: 'unavailable',
        message: `Changes are not being saved (${error instanceof Error ? error.message : 'storage full or blocked'}). Your work stays in memory for this session and export still works.`,
      });
    }
  }

  private onStorageEvent = (event: StorageEvent) => {
    if (event.key !== this.key || event.newValue === null) return;
    try {
      const parsed = JSON.parse(event.newValue) as unknown;
      const result = validatePersisted(parsed, this.contentVersion);
      if (result.data.revision <= this.dataValue.revision) return;
      if (this.hasLocalEdits) {
        this.autosavePaused = true;
        this.setStatus({
          kind: 'conflict',
          message: 'Another tab saved newer data while this tab has unsaved edits. Autosaving is paused. Reload the saved version, or export your unsaved copy first.',
        });
        return;
      }
      this.dataValue = migrate(result.data);
      this.setStatus({ kind: 'saved', at: this.dataValue.savedAt });
    } catch {
      // A malformed value from another tab is ignored rather than adopted.
    }
  };

  /** Resolve a cross-tab conflict by discarding local edits. */
  reloadSavedVersion() {
    this.autosavePaused = false;
    this.hasLocalEdits = false;
    const wasConflicted = this.statusValue.kind === 'conflict';
    const loaded = this.load();
    if (loaded) {
      this.dataValue = loaded;
    } else if (wasConflicted && this.statusValue.kind === 'conflict') {
      // Nothing readable was stored after all; clear the conflict rather than
      // leaving autosaving paused with a stale warning.
      this.statusValue = { kind: 'saved', at: this.dataValue.savedAt };
    }
    this.emit();
  }

  /** Resolve a cross-tab conflict by keeping this tab's edits. */
  keepLocalEdits() {
    this.autosavePaused = false;
    this.scheduleSave();
  }

  exportJson(): string {
    return JSON.stringify(
      {
        app: APP_ID,
        exportedAt: new Date().toISOString(),
        ...this.dataValue,
      },
      null,
      2,
    );
  }

  /** Non-mutating preview of an import file. */
  previewImport(text: string): { data: PersistedData; warnings: string[] } {
    if (text.length > MAX_IMPORT_BYTES) {
      throw new ValidationError(`That file is larger than ${Math.round(MAX_IMPORT_BYTES / (1024 * 1024))} MB.`);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      throw new ValidationError('That file is not valid JSON.');
    }
    const result = validatePersisted(parsed, this.contentVersion);
    return { data: result.data, warnings: result.warnings };
  }

  /** Replace local data. The only supported import mode. */
  applyImport(data: PersistedData) {
    this.update((draft) => {
      draft.settings = data.settings;
      draft.lessons = data.lessons;
      draft.reviews = data.reviews;
      draft.attempts = data.attempts;
      draft.notebook = data.notebook;
      draft.sessions = data.sessions;
      draft.resume = data.resume;
    }, { immediate: true });
  }

  /** Reset progress, preserving settings and the notebook. */
  resetProgress() {
    this.update((draft) => {
      draft.lessons = {};
      draft.reviews = [];
      draft.attempts = [];
      draft.sessions = [];
      draft.resume = null;
    }, { immediate: true });
  }

  /** Delete only this app's namespaced key. */
  deleteAll() {
    try {
      window.localStorage.removeItem(this.key);
    } catch {
      // Nothing else to clean up when storage is unavailable.
    }
    this.dataValue = emptyData(this.contentVersion);
    this.hasLocalEdits = false;
    this.setStatus({ kind: 'saved', at: this.dataValue.savedAt });
  }
}
