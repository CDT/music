import type { CourseModule, Lesson, LessonId } from '../domain/types';
import { module01 } from './modules/module01';
import { module02 } from './modules/module02';
import { module03 } from './modules/module03';
import { module04 } from './modules/module04';
import { module05 } from './modules/module05';
import { module06 } from './modules/module06';
import { module07 } from './modules/module07';
import { module08 } from './modules/module08';
import { module09 } from './modules/module09';
import { module10 } from './modules/module10';
import { module11 } from './modules/module11';
import { module12 } from './modules/module12';
import chineseText from './zh-CN.json';

export const CONTENT_VERSION = '1.0.0';

export const MODULES: CourseModule[] = [
  module01, module02, module03, module04, module05, module06,
  module07, module08, module09, module10, module11, module12,
];

export const LESSONS: Lesson[] = MODULES.flatMap((m) => m.lessons);

export const LESSON_MAP = new Map<string, Lesson>(LESSONS.map((l) => [l.id, l]));

export const LESSON_ORDER: LessonId[] = LESSONS.map((l) => l.id);

export function lessonById(id: string): Lesson | undefined {
  return LESSON_MAP.get(id);
}

export function moduleOf(lessonId: string): CourseModule | undefined {
  return MODULES.find((m) => m.lessons.some((l) => l.id === lessonId));
}

export function nextLessonId(lessonId: LessonId): LessonId | null {
  const index = LESSON_ORDER.indexOf(lessonId);
  if (index < 0 || index === LESSON_ORDER.length - 1) return null;
  return LESSON_ORDER[index + 1];
}

export function previousLessonId(lessonId: LessonId): LessonId | null {
  const index = LESSON_ORDER.indexOf(lessonId);
  if (index <= 0) return null;
  return LESSON_ORDER[index - 1];
}

export const TOTAL_LESSONS = LESSONS.length;

/** Flattened searchable text for the course search box. */
export interface LessonSearchRecord {
  lesson: Lesson;
  moduleTitle: string;
  text: string;
}

export const LESSON_SEARCH_INDEX: LessonSearchRecord[] = MODULES.flatMap((module) =>
  module.lessons.map((lesson) => ({
    lesson,
    moduleTitle: module.title,
    text: [
      lesson.id,
      lesson.title,
      lesson.objective,
      lesson.beforeYouStart,
      lesson.readinessCheck,
      lesson.takeaway,
      lesson.makeItYours,
      lesson.reviewTask,
      module.title,
      module.summary,
      ...lesson.ifDifficult,
      ...lesson.blocks.flatMap((block) => {
        switch (block.type) {
          case 'prose': return [block.heading ?? '', ...block.paragraphs];
          case 'example': return [block.prompt];
          case 'piano-task': return [...block.steps, block.easier, block.stretch];
          case 'reflection': return [block.prompt];
          case 'exercise': return [block.exerciseId];
        }
      }),
    ].flatMap((text) => [text, (chineseText as Record<string, string>)[text] ?? '']).join(' ').toLowerCase(),
  })),
);

export function searchLessons(query: string): LessonSearchRecord[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return LESSON_SEARCH_INDEX;
  return LESSON_SEARCH_INDEX.filter((record) => record.text.includes(needle));
}
