import { describe, expect, it } from 'vitest';
import {
  MAX_STAGE, REVIEW_INTERVAL_DAYS, addCalendarDays, applyReview, createReviewItem,
  dueReviews, localDateString, planSession, recommendedReviewCount,
} from '../domain/review';
import type { ReviewItem } from '../domain/types';

const item = (overrides: Partial<ReviewItem> = {}): ReviewItem => ({
  id: 'rev-m01-l01',
  lessonId: 'm01-l01',
  exerciseId: 'q-m01-l01',
  stage: 0,
  dueDate: '2026-03-01',
  ...overrides,
});

describe('review scheduling', () => {
  it('uses the stated intervals', () => {
    expect([...REVIEW_INTERVAL_DAYS]).toEqual([1, 3, 7, 14, 30]);
    expect(MAX_STAGE).toBe(4);
  });

  it('schedules stage 0 for tomorrow on first completion', () => {
    const created = createReviewItem('m01-l01', 'q-m01-l01', '2026-03-01');
    expect(created.stage).toBe(0);
    expect(created.dueDate).toBe('2026-03-02');
  });

  it('advances a stage on a comfortable review', () => {
    const now = new Date(2026, 2, 1, 12, 0, 0);
    const first = applyReview(item(), 'comfortable', now);
    expect(first.stage).toBe(1);
    expect(first.dueDate).toBe('2026-03-04');

    const second = applyReview(first, 'comfortable', new Date(2026, 2, 4, 12, 0, 0));
    expect(second.stage).toBe(2);
    expect(second.dueDate).toBe('2026-03-11');
  });

  it('caps the stage at the longest interval', () => {
    let current = item({ stage: MAX_STAGE });
    current = applyReview(current, 'comfortable', new Date(2026, 2, 1, 12, 0, 0));
    expect(current.stage).toBe(MAX_STAGE);
    expect(current.dueDate).toBe('2026-03-31');
  });

  it('keeps the stage for “with help” and resets it for “not yet”', () => {
    const now = new Date(2026, 2, 1, 12, 0, 0);
    const helped = applyReview(item({ stage: 2 }), 'with-help', now);
    expect(helped.stage).toBe(2);
    expect(helped.dueDate).toBe('2026-03-02');

    const reset = applyReview(item({ stage: 3 }), 'not-yet', now);
    expect(reset.stage).toBe(0);
    expect(reset.dueDate).toBe('2026-03-02');
  });

  it('never advances two stages in one local day', () => {
    const morning = new Date(2026, 2, 1, 9, 0, 0);
    const evening = new Date(2026, 2, 1, 21, 0, 0);
    const first = applyReview(item(), 'comfortable', morning);
    const second = applyReview(first, 'comfortable', evening);
    expect(second.stage).toBe(first.stage);
    expect(second.dueDate).toBe(first.dueDate);
  });

  it('adds calendar days across daylight saving, month and year boundaries', () => {
    // Spring transition in many northern-hemisphere zones.
    expect(addCalendarDays('2026-03-07', 1)).toBe('2026-03-08');
    expect(addCalendarDays('2026-03-28', 7)).toBe('2026-04-04');
    // Month and year boundaries.
    expect(addCalendarDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addCalendarDays('2026-02-27', 3)).toBe('2026-03-02');
    expect(addCalendarDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addCalendarDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addCalendarDays('2026-12-15', 30)).toBe('2027-01-14');
  });

  it('produces a local date string in YYYY-MM-DD form', () => {
    expect(localDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(localDateString(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
  });

  it('sorts due reviews by oldest date, then stable id', () => {
    const items = [
      item({ id: 'rev-b', dueDate: '2026-02-01' }),
      item({ id: 'rev-a', dueDate: '2026-02-01' }),
      item({ id: 'rev-c', dueDate: '2026-01-01' }),
      item({ id: 'rev-d', dueDate: '2026-12-01' }),
    ];
    const due = dueReviews(items, '2026-03-01');
    expect(due.map((i) => i.id)).toEqual(['rev-c', 'rev-a', 'rev-b']);
  });
});

describe('session planning', () => {
  it('limits recommended reviews by session length', () => {
    expect(recommendedReviewCount(5)).toBe(1);
    expect(recommendedReviewCount(15)).toBe(3);
    expect(recommendedReviewCount(30)).toBe(5);
    expect(recommendedReviewCount(null)).toBe(5);
  });

  it('orders one review, the lesson, then a creative application', () => {
    const tasks = planSession({
      minutes: 15,
      due: [item({ id: 'rev-1' }), item({ id: 'rev-2' }), item({ id: 'rev-3' }), item({ id: 'rev-4' })],
      nextLessonId: 'm02-l01',
      nextLessonTitle: 'Find home',
      lessonInProgress: false,
    });
    expect(tasks.filter((t) => t.kind === 'review')).toHaveLength(3);
    expect(tasks[tasks.length - 2].kind).toBe('lesson');
    expect(tasks[tasks.length - 1].kind).toBe('application');
  });

  it('gives a five-minute session only one review', () => {
    const tasks = planSession({
      minutes: 5,
      due: [item({ id: 'rev-1' }), item({ id: 'rev-2' })],
      nextLessonId: 'm01-l02',
      nextLessonTitle: 'Repeats, steps, and leaps',
      lessonInProgress: true,
    });
    expect(tasks.filter((t) => t.kind === 'review')).toHaveLength(1);
    expect(tasks).toHaveLength(3);
  });

  it('still plans something when nothing is due and the course is finished', () => {
    const tasks = planSession({
      minutes: 30, due: [], nextLessonId: null, nextLessonTitle: null, lessonInProgress: false,
    });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].kind).toBe('application');
  });
});
