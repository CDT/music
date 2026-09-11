import type { LessonId, Readiness, ReviewItem } from './types';

/**
 * A transparent, small review scheduler. Intervals are stated plainly to the
 * learner; nothing here claims to be optimal spaced repetition.
 */
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30] as const;
export const MAX_STAGE = REVIEW_INTERVAL_DAYS.length - 1;

/** Local calendar date as YYYY-MM-DD. */
export function localDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Add calendar days, so daylight-saving transitions do not shift the date. */
export function addCalendarDays(dateString: string, days: number): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return localDateString(date);
}

export function isDue(item: ReviewItem, today = localDateString()): boolean {
  return item.dueDate <= today;
}

export function createReviewItem(
  lessonId: LessonId,
  exerciseId: string,
  today = localDateString(),
): ReviewItem {
  return {
    id: `rev-${lessonId}`,
    lessonId,
    exerciseId,
    stage: 0,
    dueDate: addCalendarDays(today, REVIEW_INTERVAL_DAYS[0]),
  };
}

/**
 * Apply a self-reported outcome to a review item.
 * Repeated work on the same item within one local day never advances twice.
 */
export function applyReview(
  item: ReviewItem,
  readiness: Readiness,
  now: Date = new Date(),
): ReviewItem {
  const today = localDateString(now);
  const alreadyReviewedToday = item.lastReviewedAt
    ? localDateString(new Date(item.lastReviewedAt)) === today
    : false;

  if (readiness === 'comfortable') {
    const stage = alreadyReviewedToday ? item.stage : Math.min(item.stage + 1, MAX_STAGE);
    return {
      ...item,
      stage,
      dueDate: addCalendarDays(today, REVIEW_INTERVAL_DAYS[stage]),
      lastReviewedAt: now.toISOString(),
    };
  }
  if (readiness === 'with-help') {
    return {
      ...item,
      dueDate: addCalendarDays(today, 1),
      lastReviewedAt: now.toISOString(),
    };
  }
  return {
    ...item,
    stage: 0,
    dueDate: addCalendarDays(today, 1),
    lastReviewedAt: now.toISOString(),
  };
}

/** Due reviews, oldest due date first, then stable ID order. */
export function dueReviews(items: ReviewItem[], today = localDateString()): ReviewItem[] {
  return items
    .filter((item) => isDue(item, today))
    .sort((a, b) => (a.dueDate === b.dueDate ? a.id.localeCompare(b.id) : a.dueDate.localeCompare(b.dueDate)));
}

export const REVIEW_LIMITS: Record<'5' | '15' | '30' | 'open', number> = {
  '5': 1,
  '15': 3,
  '30': 5,
  open: 5,
};

export function recommendedReviewCount(minutes: 5 | 15 | 30 | null): number {
  if (minutes === null) return REVIEW_LIMITS.open;
  return REVIEW_LIMITS[String(minutes) as '5' | '15' | '30'];
}

export function intervalDescription(stage: number): string {
  const clamped = Math.min(Math.max(stage, 0), MAX_STAGE);
  const days = REVIEW_INTERVAL_DAYS[clamped];
  return `${days} day${days === 1 ? '' : 's'}`;
}

/* ---------- Session planning ---------- */

export type PlannedTaskKind = 'review' | 'lesson' | 'application';

export interface PlannedTask {
  id: string;
  kind: PlannedTaskKind;
  title: string;
  detail: string;
  minutes: number;
  lessonId?: LessonId;
  exerciseId?: string;
}

export interface SessionPlanInput {
  minutes: 5 | 15 | 30 | null;
  due: ReviewItem[];
  nextLessonId: LessonId | null;
  nextLessonTitle: string | null;
  lessonInProgress: boolean;
}

/** Order: one appropriate due review, the current lesson task, then a small creative application. */
export function planSession(input: SessionPlanInput): PlannedTask[] {
  const budget = input.minutes;
  const reviewCount = Math.min(recommendedReviewCount(budget), input.due.length);
  const tasks: PlannedTask[] = [];

  for (let i = 0; i < reviewCount; i += 1) {
    const item = input.due[i];
    tasks.push({
      id: `task-review-${item.id}`,
      kind: 'review',
      title: 'Revisit one earlier task',
      detail: `Review from ${item.lessonId}. Due ${item.dueDate}.`,
      minutes: budget === 5 ? 1 : 3,
      lessonId: item.lessonId,
      exerciseId: item.exerciseId,
    });
    if (budget === 5) break;
  }

  if (input.nextLessonId) {
    tasks.push({
      id: `task-lesson-${input.nextLessonId}`,
      kind: 'lesson',
      title: input.lessonInProgress ? 'Continue your lesson' : 'Start the next lesson',
      detail: input.nextLessonTitle ?? input.nextLessonId,
      minutes: budget === 5 ? 2 : budget === 15 ? 5 : 8,
      lessonId: input.nextLessonId,
    });
  }

  tasks.push({
    id: 'task-application',
    kind: 'application',
    title: 'Make a little music',
    detail: budget === 5
      ? 'Play one phrase you have been working on, with any accompaniment you like.'
      : 'Play the lesson idea inside a short phrase of your own, then repeat it once on purpose.',
    minutes: budget === 5 ? 2 : budget === 15 ? 7 : 14,
  });

  return tasks;
}
