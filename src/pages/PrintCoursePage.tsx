import { Link } from 'react-router-dom';
import { MODULES, TOTAL_LESSONS } from '../content/course';
import { scoreById } from '../content/examples';
import { exerciseById } from '../content/exercises';
import { notesText } from '../domain/rhythm';
import { chordSymbolText } from '../domain/harmony';
import { keyName } from '../domain/pitch';
import { Button } from '../components/ui';
import type { Lesson, LessonBlock } from '../domain/types';

/**
 * A dedicated print view of the complete written course. It renders text and
 * note data only, so it does not need to load any interactive audio component.
 */
export function PrintCoursePage() {
  return (
    <div className="reading max-w-none">
      <div className="no-print mb-6 flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={() => window.print()}>Print this course</Button>
        <Link to="/course" className="text-[var(--color-primary)] underline">Back to the course</Link>
        <span className="text-sm text-[var(--color-muted)]">
          Printing does not change your progress and does not reveal answers in any exercise you have open.
        </span>
      </div>

      <h1 className="reading-heading text-3xl font-semibold">From Inner Melody to Piano</h1>
      <p className="mb-6">
        {`The complete written course: 12 modules and ${TOTAL_LESSONS} lessons. Musical examples are given as note data, so this document is readable without sound.`}
      </p>

      {MODULES.map((module) => (
        <section key={module.id} className="print-page-break mb-8">
          <h2 className="reading-heading text-2xl font-semibold">
            {`Module ${module.index} — ${module.title}`}
          </h2>
          <p className="mb-4 italic">{module.summary}</p>
          {module.lessons.map((lesson) => <PrintLesson key={lesson.id} lesson={lesson} />)}
        </section>
      ))}
    </div>
  );
}

function PrintLesson({ lesson }: { lesson: Lesson }) {
  return (
    <article className="lesson-section mb-8">
      <h3 className="reading-heading text-xl font-semibold">{`${lesson.id} — ${lesson.title}`}</h3>

      <h4 className="mt-3 font-semibold">What you will be able to do</h4>
      <p>{lesson.objective}</p>

      <h4 className="mt-3 font-semibold">Before you start</h4>
      <p>{lesson.beforeYouStart}</p>

      {lesson.blocks.map((block, index) => <PrintBlock key={index} block={block} />)}

      <h4 className="mt-3 font-semibold">Make it yours</h4>
      <p>{lesson.makeItYours}</p>

      <h4 className="mt-3 font-semibold">If this is difficult</h4>
      <ul className="list-disc pl-6">
        {lesson.ifDifficult.map((item) => <li key={item}>{item}</li>)}
      </ul>

      <h4 className="mt-3 font-semibold">Ready to continue?</h4>
      <p>{lesson.readinessCheck}</p>
      <p className="italic">Choose Not yet, With help, or Comfortable. All three let you continue.</p>

      <h4 className="mt-3 font-semibold">Remember and revisit</h4>
      <p>{lesson.takeaway}</p>
      <p>{`Review task: ${lesson.reviewTask}`}</p>
    </article>
  );
}

function PrintBlock({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case 'prose':
      return (
        <>
          {block.heading ? <h4 className="mt-3 font-semibold">{block.heading}</h4> : null}
          {block.paragraphs.map((paragraph) => <p key={paragraph.slice(0, 30)}>{paragraph}</p>)}
        </>
      );

    case 'example': {
      const score = scoreById(block.scoreId);
      return (
        <>
          <h4 className="mt-3 font-semibold">Listen</h4>
          <p>{block.prompt}</p>
          {score ? (
            <p className="font-mono text-sm">
              {`${score.title} · ${keyName(score.key)} · ${score.meter.numerator}/${score.meter.denominator} · ${score.tempoQuarterBpm} BPM`}
              <br />
              {`Melody: ${notesText(score.notes.filter((n) => n.voice === 'melody'))}`}
              {score.chords.length > 0 ? (
                <>
                  <br />
                  {`Chords: ${score.chords.map((c) => `${chordSymbolText(c.symbol)} (${c.romanLabel})`).join(' | ')}`}
                </>
              ) : null}
            </p>
          ) : null}
        </>
      );
    }

    case 'exercise': {
      const exercise = exerciseById(block.exerciseId);
      if (!exercise) return null;
      return (
        <>
          <h4 className="mt-3 font-semibold">{`Try it — ${exercise.title}`}</h4>
          <p>{exercise.instructions}</p>
          {'promptNotes' in exercise ? (
            <p className="font-mono text-sm">{`Prompt: ${exercise.promptNotes}`}</p>
          ) : null}
        </>
      );
    }

    case 'piano-task':
      return (
        <>
          <h4 className="mt-3 font-semibold">At your piano</h4>
          <ol className="list-decimal pl-6">
            {block.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <p><strong>Easier: </strong>{block.easier}</p>
          <p><strong>Stretch: </strong>{block.stretch}</p>
        </>
      );

    case 'reflection':
      return (
        <>
          <h4 className="mt-3 font-semibold">Reflect</h4>
          <p>{block.prompt}</p>
        </>
      );
  }
}
