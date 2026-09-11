import type {
  AppSettings, Attempt, LessonProgress, NotebookEntry, PersistedData, ResumeState,
  ReviewItem, SessionSummary,
} from '../../domain/types';

export const SCHEMA_VERSION = 1;
export const APP_ID = 'inner-melody';
export const MAX_ATTEMPTS = 1000;
export const MAX_SESSIONS = 365;
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export const DEFAULT_SETTINGS: AppSettings = {
  labelMode: 'both',
  defaultSessionMinutes: null,
  masterVolume: 0.7,
  reducedMotion: 'system',
  textScale: 'normal',
  metronomeLatencyMs: 0,
  onboarded: false,
  comfortableRange: 'middle',
};

export function emptyData(contentVersion: string): PersistedData {
  return {
    schemaVersion: SCHEMA_VERSION,
    contentVersion,
    revision: 0,
    savedAt: new Date().toISOString(),
    settings: { ...DEFAULT_SETTINGS },
    lessons: {},
    reviews: [],
    attempts: [],
    notebook: [],
    sessions: [],
    resume: null,
  };
}

/** Storage key namespaced by app and deployment base path. */
export function storageKey(basePath: string): string {
  const normalised = basePath.replace(/^\/+|\/+$/g, '') || 'root';
  return `${APP_ID}:${normalised}:v1`;
}

export class ValidationError extends Error {}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown, field: string, maxLength = 4000): string {
  if (typeof value !== 'string') throw new ValidationError(`${field} must be text`);
  if (value.length > maxLength) throw new ValidationError(`${field} is too long`);
  return value;
}

function optionalStr(value: unknown, field: string, maxLength = 4000): string | undefined {
  return value === undefined || value === null ? undefined : str(value, field, maxLength);
}

function num(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ValidationError(`${field} must be a number`);
  }
  if (value < min || value > max) throw new ValidationError(`${field} is out of range`);
  return value;
}

function bool(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new ValidationError(`${field} must be true or false`);
  return value;
}

function oneOf<T extends string>(value: unknown, field: string, allowed: readonly T[]): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new ValidationError(`${field} must be one of ${allowed.join(', ')}`);
  }
  return value as T;
}

function isoDate(value: unknown, field: string): string {
  const text = str(value, field, 40);
  if (Number.isNaN(Date.parse(text))) throw new ValidationError(`${field} is not a valid timestamp`);
  return text;
}

function calendarDate(value: unknown, field: string): string {
  const text = str(value, field, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new ValidationError(`${field} is not a YYYY-MM-DD date`);
  return text;
}

const READINESS = ['not-yet', 'with-help', 'comfortable'] as const;
const INPUT_MODES = ['manual-piano', 'screen', 'midi'] as const;
const LESSON_STATUS = ['not-started', 'in-progress', 'completed'] as const;
const LABEL_MODES = ['notes', 'degrees', 'both', 'hidden'] as const;

function validateSettings(value: unknown): AppSettings {
  if (!isObject(value)) return { ...DEFAULT_SETTINGS };
  const minutes = value.defaultSessionMinutes;
  return {
    labelMode: value.labelMode === undefined
      ? DEFAULT_SETTINGS.labelMode
      : oneOf(value.labelMode, 'labelMode', LABEL_MODES),
    defaultSessionMinutes: minutes === null || minutes === undefined
      ? null
      : (num(minutes, 'defaultSessionMinutes', 5, 30) as 5 | 15 | 30),
    masterVolume: value.masterVolume === undefined
      ? DEFAULT_SETTINGS.masterVolume
      : num(value.masterVolume, 'masterVolume', 0, 1),
    reducedMotion: value.reducedMotion === undefined
      ? DEFAULT_SETTINGS.reducedMotion
      : oneOf(value.reducedMotion, 'reducedMotion', ['system', 'on'] as const),
    textScale: value.textScale === undefined
      ? DEFAULT_SETTINGS.textScale
      : oneOf(value.textScale, 'textScale', ['normal', 'large'] as const),
    metronomeLatencyMs: value.metronomeLatencyMs === undefined
      ? 0
      : num(value.metronomeLatencyMs, 'metronomeLatencyMs', -500, 500),
    onboarded: value.onboarded === undefined ? false : bool(value.onboarded, 'onboarded'),
    comfortableRange: value.comfortableRange === undefined
      ? DEFAULT_SETTINGS.comfortableRange
      : oneOf(value.comfortableRange, 'comfortableRange', ['low', 'middle', 'high'] as const),
  };
}

function validateLessonProgress(value: unknown): LessonProgress {
  if (!isObject(value)) throw new ValidationError('lesson progress must be an object');
  return {
    lessonId: str(value.lessonId, 'lessonId', 40) as LessonProgress['lessonId'],
    status: oneOf(value.status, 'status', LESSON_STATUS),
    blockIndex: num(value.blockIndex ?? 0, 'blockIndex', 0, 500),
    readiness: value.readiness === undefined || value.readiness === null
      ? undefined
      : oneOf(value.readiness, 'readiness', READINESS),
    completedAt: value.completedAt === undefined || value.completedAt === null
      ? undefined
      : isoDate(value.completedAt, 'completedAt'),
    updatedAt: isoDate(value.updatedAt ?? new Date().toISOString(), 'updatedAt'),
  };
}

function validateReview(value: unknown): ReviewItem {
  if (!isObject(value)) throw new ValidationError('review item must be an object');
  return {
    id: str(value.id, 'review id', 80),
    lessonId: str(value.lessonId, 'lessonId', 40) as ReviewItem['lessonId'],
    exerciseId: str(value.exerciseId, 'exerciseId', 80),
    stage: num(value.stage, 'stage', 0, 10),
    dueDate: calendarDate(value.dueDate, 'dueDate'),
    lastReviewedAt: value.lastReviewedAt === undefined || value.lastReviewedAt === null
      ? undefined
      : isoDate(value.lastReviewedAt, 'lastReviewedAt'),
  };
}

function validateAttempt(value: unknown): Attempt {
  if (!isObject(value)) throw new ValidationError('attempt must be an object');
  const screen = value.screenResult;
  return {
    id: str(value.id, 'attempt id', 80),
    exerciseId: str(value.exerciseId, 'exerciseId', 80),
    lessonId: optionalStr(value.lessonId, 'lessonId', 40) as Attempt['lessonId'],
    seed: value.seed === undefined || value.seed === null ? undefined : num(value.seed, 'seed', 0, 2 ** 32),
    generatorVersion: value.generatorVersion === undefined || value.generatorVersion === null
      ? undefined
      : num(value.generatorVersion, 'generatorVersion', 0, 1000),
    inputMode: oneOf(value.inputMode, 'inputMode', INPUT_MODES),
    startedAt: isoDate(value.startedAt, 'startedAt'),
    completedAt: isoDate(value.completedAt, 'completedAt'),
    hints: Array.isArray(value.hints) ? value.hints.slice(0, 20).map((h) => str(h, 'hint', 200)) : [],
    replayCount: num(value.replayCount ?? 0, 'replayCount', 0, 10000),
    readiness: value.readiness === undefined || value.readiness === null
      ? undefined
      : oneOf(value.readiness, 'readiness', READINESS),
    screenResult: isObject(screen)
      ? {
        correct: num(screen.correct, 'correct', 0, 1000),
        total: num(screen.total, 'total', 0, 1000),
        metric: oneOf(screen.metric, 'metric', ['pitch-sequence', 'choice', 'rhythm-spacing', 'beat-aligned'] as const),
      }
      : undefined,
  };
}

function validateNotebookEntry(value: unknown): NotebookEntry {
  if (!isObject(value)) throw new ValidationError('notebook entry must be an object');
  const score = value.score;
  if (score !== undefined && score !== null) {
    if (!isObject(score)) throw new ValidationError('notebook score must be an object');
    if (Array.isArray(score.notes) && score.notes.length > 2000) {
      throw new ValidationError('notebook score has too many notes');
    }
  }
  return {
    id: str(value.id, 'entry id', 80),
    title: str(value.title ?? 'Untitled', 'title', 200),
    kind: oneOf(value.kind, 'kind', ['journal', 'melody'] as const),
    text: str(value.text ?? '', 'text', 20000),
    tags: Array.isArray(value.tags) ? value.tags.slice(0, 30).map((t) => str(t, 'tag', 60)) : [],
    lessonId: optionalStr(value.lessonId, 'lessonId', 40) as NotebookEntry['lessonId'],
    score: (score ?? undefined) as NotebookEntry['score'],
    draft: bool(value.draft ?? false, 'draft'),
    arrangements: Array.isArray(value.arrangements)
      ? value.arrangements.slice(0, 50).map((a) => {
        if (!isObject(a)) throw new ValidationError('arrangement must be an object');
        return {
          id: str(a.id, 'arrangement id', 80),
          title: str(a.title ?? 'Arrangement', 'arrangement title', 200),
          chords: Array.isArray(a.chords) ? (a.chords as NotebookEntry['arrangements'][number]['chords']) : [],
          patternId: str(a.patternId ?? 'held', 'patternId', 40),
          comment: str(a.comment ?? '', 'comment', 4000),
        };
      })
      : [],
    createdAt: isoDate(value.createdAt ?? new Date().toISOString(), 'createdAt'),
    updatedAt: isoDate(value.updatedAt ?? new Date().toISOString(), 'updatedAt'),
  };
}

function validateSession(value: unknown): SessionSummary {
  if (!isObject(value)) throw new ValidationError('session must be an object');
  return {
    id: str(value.id, 'session id', 80),
    startedAt: isoDate(value.startedAt, 'startedAt'),
    activeSeconds: num(value.activeSeconds ?? 0, 'activeSeconds', 0, 60 * 60 * 24),
    lessonIds: Array.isArray(value.lessonIds)
      ? value.lessonIds.slice(0, 50).map((l) => str(l, 'lessonId', 40) as SessionSummary['lessonIds'][number])
      : [],
    completed: bool(value.completed ?? false, 'completed'),
  };
}

function validateResume(value: unknown): ResumeState | null {
  if (!isObject(value)) return null;
  const minutes = value.budgetMinutes;
  return {
    budgetMinutes: minutes === null || minutes === undefined
      ? null
      : (num(minutes, 'budgetMinutes', 5, 30) as 5 | 15 | 30),
    taskIds: Array.isArray(value.taskIds) ? value.taskIds.slice(0, 50).map((t) => str(t, 'taskId', 80)) : [],
    taskIndex: num(value.taskIndex ?? 0, 'taskIndex', 0, 100),
    activeSeconds: num(value.activeSeconds ?? 0, 'activeSeconds', 0, 60 * 60 * 24),
    startedAt: isoDate(value.startedAt ?? new Date().toISOString(), 'startedAt'),
  };
}

export interface ValidationResult {
  data: PersistedData;
  warnings: string[];
}

/** Validate persisted or imported data. Throws only for an unusable payload. */
export function validatePersisted(raw: unknown, contentVersion: string): ValidationResult {
  if (!isObject(raw)) throw new ValidationError('Saved data is not an object.');
  const schemaVersion = num(raw.schemaVersion ?? 1, 'schemaVersion', 1, 1000);
  if (schemaVersion > SCHEMA_VERSION) {
    throw new ValidationError(
      `This file was saved by a newer version of the app (schema ${schemaVersion}). Your current data has not been changed.`,
    );
  }
  const warnings: string[] = [];
  const collect = <T>(list: unknown, name: string, validate: (value: unknown) => T, cap: number): T[] => {
    if (!Array.isArray(list)) return [];
    const out: T[] = [];
    for (const item of list.slice(0, cap)) {
      try { out.push(validate(item)); } catch (error) {
        warnings.push(`Skipped an invalid ${name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return out;
  };

  const lessons: Record<string, LessonProgress> = {};
  if (isObject(raw.lessons)) {
    for (const [key, value] of Object.entries(raw.lessons)) {
      try { lessons[key] = validateLessonProgress(value); } catch (error) {
        warnings.push(`Skipped invalid progress for ${key}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  return {
    warnings,
    data: {
      schemaVersion: SCHEMA_VERSION,
      contentVersion: optionalStr(raw.contentVersion, 'contentVersion', 40) ?? contentVersion,
      revision: num(raw.revision ?? 0, 'revision', 0, Number.MAX_SAFE_INTEGER),
      savedAt: isoDate(raw.savedAt ?? new Date().toISOString(), 'savedAt'),
      settings: validateSettings(raw.settings),
      lessons,
      reviews: collect(raw.reviews, 'review', validateReview, 500),
      attempts: collect(raw.attempts, 'attempt', validateAttempt, MAX_ATTEMPTS),
      notebook: collect(raw.notebook, 'notebook entry', validateNotebookEntry, 2000),
      sessions: collect(raw.sessions, 'session', validateSession, MAX_SESSIONS),
      resume: raw.resume ? validateResume(raw.resume) : null,
    },
  };
}

/** Migrate a copy of older data. Version 1 is the first schema. */
export function migrate(data: PersistedData): PersistedData {
  return { ...data, schemaVersion: SCHEMA_VERSION };
}
