import { LESSONS, LESSON_ORDER, lessonById } from '../content/course';
import { applyReview, createReviewItem, dueReviews, localDateString } from '../domain/review';
import type {
  Attempt, LessonId, LessonProgress, PersistedData, Readiness, ReviewItem, SkillId,
} from '../domain/types';
import type { LearnerStore } from '../services/storage/store';

export function lessonProgress(data: PersistedData, lessonId: LessonId): LessonProgress | undefined {
  return data.lessons[lessonId];
}

export function completedCount(data: PersistedData): number {
  return LESSON_ORDER.filter((id) => data.lessons[id]?.status === 'completed').length;
}

/** Lesson IDs from an older content version that no longer exist. */
export function unknownLessonIds(data: PersistedData): string[] {
  return Object.keys(data.lessons).filter((id) => !lessonById(id));
}

export function nextIncompleteLesson(data: PersistedData): LessonId | null {
  const inProgress = LESSON_ORDER.find((id) => data.lessons[id]?.status === 'in-progress');
  if (inProgress) return inProgress;
  return LESSON_ORDER.find((id) => data.lessons[id]?.status !== 'completed') ?? null;
}

export function markLessonStarted(store: LearnerStore, lessonId: LessonId) {
  store.update((draft) => {
    const existing = draft.lessons[lessonId];
    if (existing?.status === 'completed') return;
    draft.lessons[lessonId] = {
      lessonId,
      status: 'in-progress',
      blockIndex: existing?.blockIndex ?? 0,
      readiness: existing?.readiness,
      updatedAt: new Date().toISOString(),
    };
  });
}

export function setBlockIndex(store: LearnerStore, lessonId: LessonId, blockIndex: number) {
  store.update((draft) => {
    const existing = draft.lessons[lessonId];
    draft.lessons[lessonId] = {
      lessonId,
      status: existing?.status === 'completed' ? 'completed' : 'in-progress',
      blockIndex,
      readiness: existing?.readiness,
      completedAt: existing?.completedAt,
      updatedAt: new Date().toISOString(),
    };
  });
}

/**
 * Record readiness and completion. Completion and readiness are stored
 * separately: a learner may complete a lesson while still needing help.
 */
export function completeLesson(store: LearnerStore, lessonId: LessonId, readiness: Readiness) {
  const lesson = lessonById(lessonId);
  store.update((draft) => {
    const now = new Date().toISOString();
    const existing = draft.lessons[lessonId];
    draft.lessons[lessonId] = {
      lessonId,
      status: 'completed',
      blockIndex: existing?.blockIndex ?? 0,
      readiness,
      completedAt: existing?.completedAt ?? now,
      updatedAt: now,
    };
    if (lesson) {
      const index = draft.reviews.findIndex((r) => r.lessonId === lessonId);
      if (index < 0) {
        draft.reviews.push(createReviewItem(lessonId, lesson.reviewExerciseId));
      }
    }
  }, { immediate: true });
}

export function recordReviewOutcome(store: LearnerStore, reviewId: string, readiness: Readiness) {
  store.update((draft) => {
    const index = draft.reviews.findIndex((r) => r.id === reviewId);
    if (index < 0) return;
    draft.reviews[index] = applyReview(draft.reviews[index], readiness);
  }, { immediate: true });
}

export function recordAttempt(store: LearnerStore, attempt: Attempt) {
  store.update((draft) => {
    draft.attempts.push(attempt);
  });
}

export function due(data: PersistedData): ReviewItem[] {
  return dueReviews(data.reviews, localDateString());
}

export interface SkillSummary {
  skill: SkillId;
  latest: Readiness | null;
  counts: Record<Readiness, number>;
}

/** Self-reported readiness per skill. No combined score is produced. */
export function skillSummaries(data: PersistedData): SkillSummary[] {
  const map = new Map<SkillId, SkillSummary>();
  for (const lesson of LESSONS) {
    for (const skill of lesson.skills) {
      if (!map.has(skill)) {
        map.set(skill, { skill, latest: null, counts: { 'not-yet': 0, 'with-help': 0, comfortable: 0 } });
      }
    }
  }
  const ordered = [...LESSONS].sort((a, b) => {
    const at = data.lessons[a.id]?.updatedAt ?? '';
    const bt = data.lessons[b.id]?.updatedAt ?? '';
    return at.localeCompare(bt);
  });
  for (const lesson of ordered) {
    const readiness = data.lessons[lesson.id]?.readiness;
    if (!readiness) continue;
    for (const skill of lesson.skills) {
      const entry = map.get(skill);
      if (!entry) continue;
      entry.counts[readiness] += 1;
      entry.latest = readiness;
    }
  }
  return [...map.values()];
}

export interface ScreenExerciseSummary {
  metric: string;
  attempts: number;
  correct: number;
  total: number;
  assisted: number;
  inputModes: Record<string, number>;
}

export function screenExerciseSummaries(data: PersistedData): ScreenExerciseSummary[] {
  const map = new Map<string, ScreenExerciseSummary>();
  for (const attempt of data.attempts) {
    if (!attempt.screenResult) continue;
    const key = attempt.screenResult.metric;
    const entry = map.get(key) ?? {
      metric: key, attempts: 0, correct: 0, total: 0, assisted: 0, inputModes: {},
    };
    entry.attempts += 1;
    entry.correct += attempt.screenResult.correct;
    entry.total += attempt.screenResult.total;
    if (attempt.hints.length > 0) entry.assisted += 1;
    entry.inputModes[attempt.inputMode] = (entry.inputModes[attempt.inputMode] ?? 0) + 1;
    map.set(key, entry);
  }
  return [...map.values()];
}

export function manualAttemptCount(data: PersistedData): number {
  return data.attempts.filter((a) => a.inputMode === 'manual-piano').length;
}
