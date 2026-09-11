import type { CourseModule, Lesson, LessonBlock, LessonId, SkillId } from '../../domain/types';

export interface LessonInput {
  id: LessonId;
  title: string;
  objective: string;
  beforeYouStart: string;
  skills: SkillId[];
  prerequisites?: LessonId[];
  blocks: LessonBlock[];
  makeItYours: string;
  ifDifficult: string[];
  readinessCheck: string;
  takeaway: string;
  reviewTask: string;
  reviewExerciseId: string;
  glossary?: string[];
}

export function makeModule(
  id: string,
  index: number,
  title: string,
  summary: string,
  lessons: LessonInput[],
): CourseModule {
  const built: Lesson[] = lessons.map((input, position) => ({
    id: input.id,
    moduleId: id,
    title: input.title,
    objective: input.objective,
    prerequisites: input.prerequisites ?? (position > 0 ? [lessons[position - 1].id] : []),
    skills: input.skills,
    blocks: input.blocks,
    readinessCheck: input.readinessCheck,
    takeaway: input.takeaway,
    reviewExerciseId: input.reviewExerciseId,
    beforeYouStart: input.beforeYouStart,
    ifDifficult: input.ifDifficult,
    makeItYours: input.makeItYours,
    reviewTask: input.reviewTask,
    glossary: input.glossary ?? [],
  }));
  return { id, index, title, summary, lessons: built };
}

/* Short block constructors keep the lesson files readable. */

export function prose(heading: string | undefined, ...paragraphs: string[]): LessonBlock {
  return heading ? { type: 'prose', heading, paragraphs } : { type: 'prose', paragraphs };
}

export function example(scoreId: string, prompt: string, hideAnswer = false): LessonBlock {
  return { type: 'example', scoreId, prompt, hideAnswer };
}

export function exercise(exerciseId: string): LessonBlock {
  return { type: 'exercise', exerciseId };
}

export function pianoTask(steps: string[], easier: string, stretch: string): LessonBlock {
  return { type: 'piano-task', steps, easier, stretch };
}

export function reflection(prompt: string): LessonBlock {
  return { type: 'reflection', prompt };
}
