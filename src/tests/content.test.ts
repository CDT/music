import { describe, expect, it } from 'vitest';
import { LESSONS, LESSON_ORDER, MODULES, TOTAL_LESSONS, searchLessons } from '../content/course';
import { EXERCISES, exerciseById } from '../content/exercises';
import { GLOSSARY, glossaryEntry } from '../content/glossary';
import { STUDIES, STUDY_SCORES } from '../content/studies';
import { SCORE_LIBRARY, scoreById } from '../content/examples';
import { PATTERNS, patternsForMeter } from '../content/patterns';
import { validateScore } from '../domain/score';
import { barBeats, splitIntoBars, validateBars } from '../domain/rhythm';
import { chordSymbolText } from '../domain/harmony';

describe('curriculum completeness', () => {
  it('has 12 modules and 48 lessons with unique ids', () => {
    expect(MODULES).toHaveLength(12);
    expect(TOTAL_LESSONS).toBe(48);
    expect(new Set(LESSON_ORDER).size).toBe(48);
    MODULES.forEach((module, index) => {
      expect(module.index).toBe(index + 1);
      expect(module.lessons).toHaveLength(4);
      module.lessons.forEach((lesson, position) => {
        expect(lesson.id).toBe(`m${String(index + 1).padStart(2, '0')}-l${String(position + 1).padStart(2, '0')}`);
        expect(lesson.moduleId).toBe(module.id);
      });
    });
  });

  it('resolves every prerequisite, example, exercise, review task and glossary link', () => {
    for (const lesson of LESSONS) {
      for (const prerequisite of lesson.prerequisites) {
        expect(LESSON_ORDER, `${lesson.id} prerequisite`).toContain(prerequisite);
      }
      for (const block of lesson.blocks) {
        if (block.type === 'example') {
          expect(scoreById(block.scoreId), `${lesson.id} example ${block.scoreId}`).toBeDefined();
        }
        if (block.type === 'exercise') {
          expect(exerciseById(block.exerciseId), `${lesson.id} exercise ${block.exerciseId}`).toBeDefined();
        }
      }
      expect(exerciseById(lesson.reviewExerciseId), `${lesson.id} review exercise`).toBeDefined();
      for (const term of lesson.glossary) {
        expect(glossaryEntry(term), `${lesson.id} glossary ${term}`).toBeDefined();
      }
    }
  });

  it('gives every lesson the required sections with non-empty text', () => {
    for (const lesson of LESSONS) {
      expect(lesson.title.length, lesson.id).toBeGreaterThan(3);
      expect(lesson.objective.length, lesson.id).toBeGreaterThan(20);
      expect(lesson.beforeYouStart.length, lesson.id).toBeGreaterThan(20);
      expect(lesson.makeItYours.length, lesson.id).toBeGreaterThan(20);
      expect(lesson.readinessCheck.length, lesson.id).toBeGreaterThan(20);
      expect(lesson.takeaway.length, lesson.id).toBeGreaterThan(10);
      expect(lesson.reviewTask.length, lesson.id).toBeGreaterThan(10);
      expect(lesson.ifDifficult.length, lesson.id).toBeGreaterThanOrEqual(2);
      expect(lesson.skills.length, lesson.id).toBeGreaterThan(0);

      const hasExample = lesson.blocks.some((b) => b.type === 'example');
      const hasExercise = lesson.blocks.some((b) => b.type === 'exercise');
      const hasPianoTask = lesson.blocks.some((b) => b.type === 'piano-task');
      expect(hasExample, `${lesson.id} needs a playable Listen example`).toBe(true);
      expect(hasExercise, `${lesson.id} needs at least one task`).toBe(true);
      expect(hasPianoTask, `${lesson.id} needs an At your piano task`).toBe(true);

      for (const block of lesson.blocks) {
        if (block.type === 'piano-task') {
          expect(block.steps.length, lesson.id).toBeGreaterThan(1);
          expect(block.easier.length, lesson.id).toBeGreaterThan(10);
          expect(block.stretch.length, lesson.id).toBeGreaterThan(10);
        }
        if (block.type === 'prose') {
          expect(block.paragraphs.every((p) => p.trim().length > 40), lesson.id).toBe(true);
        }
      }
    }
  });

  it('reaches an editorial word count in every lesson without placeholder bodies', () => {
    for (const lesson of LESSONS) {
      const words = [
        lesson.objective, lesson.beforeYouStart, lesson.makeItYours, lesson.readinessCheck,
        lesson.takeaway, ...lesson.ifDifficult,
        ...lesson.blocks.flatMap((block) => {
          switch (block.type) {
            case 'prose': return block.paragraphs;
            case 'example': return [block.prompt];
            case 'piano-task': return [...block.steps, block.easier, block.stretch];
            case 'reflection': return [block.prompt];
            default: return [];
          }
        }),
      ].join(' ').split(/\s+/).length;
      expect(words, `${lesson.id} word count`).toBeGreaterThan(320);
      const text = JSON.stringify(lesson).toLowerCase();
      expect(text, lesson.id).not.toContain('coming soon');
      expect(text, lesson.id).not.toContain('lorem ipsum');
      expect(text, lesson.id).not.toContain('todo');
    }
  });

  it('finds the expected search terms', () => {
    for (const term of ['minor', 'canon', 'pedal', 'transposition']) {
      expect(searchLessons(term).length, term).toBeGreaterThan(0);
    }
  });
});

describe('study pieces', () => {
  it('has six studies with eight complete bars each', () => {
    expect(STUDIES).toHaveLength(6);
    for (const study of STUDIES) {
      const bars = splitIntoBars(study.score);
      expect(bars.length, study.id).toBe(8);
      for (const validation of validateBars(study.score)) {
        expect(validation.ok, `${study.id} bar ${validation.barIndex + 1}`).toBe(true);
        expect(validation.actual).toBeCloseTo(validation.expected, 9);
      }
      expect(validateScore(study.score), study.id).toEqual([]);
    }
  });

  it('gives S04 three quarter beats per bar', () => {
    const s04 = STUDIES.find((s) => s.id === 's04')!;
    expect(barBeats(s04.score.meter)).toBe(3);
    expect(s04.score.totalBeats).toBe(24);
    for (const validation of validateBars(s04.score)) {
      expect(validation.expected).toBe(3);
    }
  });

  it('changes S02 chords exactly at quarter beat 26', () => {
    const s02 = STUDIES.find((s) => s.id === 's02')!;
    const change = s02.score.chords.find((c) => c.startBeat === 26);
    expect(change).toBeDefined();
    expect(chordSymbolText(change!.symbol)).toBe('G');
    const previous = s02.score.chords.find((c) => c.startBeat === 24);
    expect(chordSymbolText(previous!.symbol)).toBe('F');
    expect(previous!.durationBeats).toBe(2);
  });

  it('gives S06 a nine-bar named ending variant while the canonical score stays eight bars', () => {
    const s06 = STUDIES.find((s) => s.id === 's06')!;
    expect(splitIntoBars(s06.score)).toHaveLength(8);
    const variant = s06.variants?.find((v) => v.id === 's06-ending');
    expect(variant).toBeDefined();
    expect(splitIntoBars(variant!.score)).toHaveLength(9);
    expect(chordSymbolText(s06.score.chords[s06.score.chords.length - 1].symbol)).toBe('A');
  });

  it('spells S03 with G sharp, never A flat', () => {
    const s03 = STUDIES.find((s) => s.id === 's03')!;
    const altered = s03.score.notes.filter((n) => n.pitch?.accidental === 1);
    expect(altered.length).toBeGreaterThan(0);
    for (const note of altered) {
      expect(note.pitch!.letter).toBe('G');
      expect(note.pitch!.accidental).toBe(1);
    }
    expect(s03.score.notes.some((n) => n.pitch?.letter === 'A' && n.pitch.accidental === -1)).toBe(false);
  });

  it('only suggests patterns compatible with each study’s meter', () => {
    for (const study of STUDIES) {
      const allowed = patternsForMeter(study.score.meter).map((p) => p.id);
      for (const id of study.suggestedPatterns) {
        expect(allowed, `${study.id} suggests ${id}`).toContain(id);
      }
    }
    expect(patternsForMeter({ numerator: 3, denominator: 4 }).map((p) => p.id)).not.toContain('block');
    expect(patternsForMeter({ numerator: 4, denominator: 4 }).map((p) => p.id)).not.toContain('waltz');
  });
});

describe('scores, exercises and patterns', () => {
  it('validates every score in the library', () => {
    for (const [id, score] of SCORE_LIBRARY) {
      expect(validateScore(score), id).toEqual([]);
    }
    expect(STUDY_SCORES.length).toBeGreaterThanOrEqual(8);
  });

  it('gives every exercise unique ids, instructions and a manual alternative where needed', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
    for (const exercise of EXERCISES) {
      expect(exercise.instructions.length, exercise.id).toBeGreaterThan(20);
      expect(exercise.skills.length, exercise.id).toBeGreaterThan(0);
      if (exercise.mode === 'phrase') {
        expect(exercise.answerMidi.length, exercise.id).toBeGreaterThan(1);
      }
      if (exercise.mode === 'rhythm') {
        expect(exercise.onsetBeats.length, exercise.id).toBeGreaterThan(0);
      }
      if (exercise.mode === 'free-echo') {
        // Manual tasks carry no machine-checkable answer field.
        expect('answerMidi' in exercise).toBe(false);
      }
    }
  });

  it('covers all seven exercise modes', () => {
    const modes = new Set(EXERCISES.map((e) => e.mode));
    for (const mode of ['contour', 'degree', 'phrase', 'rhythm', 'chord-quality', 'function', 'free-echo']) {
      expect(modes, mode).toContain(mode);
    }
  });

  it('declares a meter for every accompaniment pattern', () => {
    for (const pattern of PATTERNS) {
      expect(pattern.meters.length, pattern.id).toBeGreaterThan(0);
      for (const event of pattern.events) {
        expect(event.offset).toBeGreaterThanOrEqual(0);
        expect(event.durationBeats).toBeGreaterThan(0);
      }
    }
  });

  it('gives every glossary entry a definition, example and resolvable references', () => {
    expect(new Set(GLOSSARY.map((g) => g.id)).size).toBe(GLOSSARY.length);
    for (const entry of GLOSSARY) {
      expect(entry.definition.length, entry.id).toBeGreaterThan(30);
      expect(entry.example.length, entry.id).toBeGreaterThan(5);
      if (entry.scoreId) expect(scoreById(entry.scoreId), entry.id).toBeDefined();
      for (const lessonId of entry.lessons) {
        expect(LESSON_ORDER, `${entry.id} → ${lessonId}`).toContain(lessonId);
      }
    }
  });
});
