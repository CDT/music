import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { exerciseById } from '../../content/exercises';
import { glossaryEntry } from '../../content/glossary';
import { requireScore } from '../../content/examples';
import { moduleOf, nextLessonId, previousLessonId } from '../../content/course';
import { useStore } from '../../app/use-store';
import { completeLesson, markLessonStarted, setBlockIndex } from '../../app/progress';
import { Button, Card, Details, Muted, Pill, SectionHeading, StatusNote } from '../../components/ui';
import { ScorePlayer } from '../transport/ScorePlayer';
import { BeatGrid } from '../notation/BeatGrid';
import { Staff } from '../notation/Staff';
import { ExerciseRunner } from '../exercises/ExerciseRunner';
import { SKILL_LABELS } from '../../domain/types';
import type { Lesson, LessonBlock, Readiness } from '../../domain/types';

export type LessonMode = 'learn' | 'ear';
export type TimeBudget = 5 | 15 | 30 | null;

export function LessonReader({ lesson, budget }: { lesson: Lesson; budget: TimeBudget }) {
  const { store, data } = useStore();
  const [mode, setMode] = useState<LessonMode>('learn');
  const [reflectionText, setReflectionText] = useState('');
  const progress = data.lessons[lesson.id];
  const module = moduleOf(lesson.id);
  // Readiness is read straight from stored progress, so it stays correct when
  // the lesson changes or another tab saves a newer value.
  const readiness: Readiness | null = progress?.readiness ?? null;

  // Furthest block reached, so a session can resume where it stopped. The ref
  // keeps this from writing on every render, which would loop through the store.
  const furthestBlockRef = useRef(progress?.blockIndex ?? 0);

  useEffect(() => {
    furthestBlockRef.current = 0;
    markLessonStarted(store, lesson.id);
  }, [store, lesson.id]);

  const recordBlockSeen = useCallback((index: number) => {
    if (index <= furthestBlockRef.current) return;
    furthestBlockRef.current = index;
    setBlockIndex(store, lesson.id, index);
  }, [store, lesson.id]);

  const blocks = useMemo(() => {
    if (budget !== 5) return lesson.blocks;
    // The five-minute path shows Listen, one Try task and Make it yours.
    const firstExample = lesson.blocks.find((b) => b.type === 'example');
    const firstExercise = lesson.blocks.find((b) => b.type === 'exercise');
    return [firstExample, firstExercise].filter(Boolean) as LessonBlock[];
  }, [lesson.blocks, budget]);

  const next = nextLessonId(lesson.id);
  const previous = previousLessonId(lesson.id);

  return (
    <article className="reading">
      <header className="mb-5">
        <Muted>
          {module ? `Module ${module.index} — ${module.title}` : null}
          {' · '}
          {lesson.id}
        </Muted>
        <h1 className="reading-heading mt-1 text-3xl font-semibold">{lesson.title}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          {lesson.skills.map((skill) => <Pill key={skill}>{SKILL_LABELS[skill]}</Pill>)}
          {progress?.status === 'completed' ? <Pill tone="good">Completed</Pill> : null}
          {progress?.readiness ? (
            <Pill tone={progress.readiness === 'comfortable' ? 'good' : progress.readiness === 'with-help' ? 'help' : 'notyet'}>
              {`Readiness: ${readinessLabel(progress.readiness)}`}
            </Pill>
          ) : null}
        </div>
      </header>

      <div className="no-print mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
        <fieldset>
          <legend className="sr-only">Lesson mode</legend>
          <div className="flex gap-2">
            <Button variant={mode === 'learn' ? 'primary' : 'secondary'} onClick={() => setMode('learn')}>
              Learn
            </Button>
            <Button variant={mode === 'ear' ? 'primary' : 'secondary'} onClick={() => setMode('ear')}>
              Try by ear
            </Button>
          </div>
        </fieldset>
        <Muted>
          {mode === 'learn'
            ? 'Notes, keyboard highlights, degrees and answers can be shown.'
            : 'Pitches, staff and answer labels stay hidden until you ask for a hint or reveal. Rhythm stays visible.'}
        </Muted>
      </div>

      <section className="lesson-section mb-6">
        <SectionHeading id="outcome">What you will be able to do</SectionHeading>
        <p>{lesson.objective}</p>
      </section>

      <Details summary="Before you start" className="lesson-section mb-6 no-print">
        <p>{lesson.beforeYouStart}</p>
        {lesson.prerequisites.length > 0 ? (
          <p className="mt-2 text-sm">
            {'Recommended prior lesson: '}
            {lesson.prerequisites.map((id) => (
              <Link key={id} to={`/lesson/${id}`} className="text-[var(--color-primary)] underline">{id}</Link>
            ))}
            {'. This is a recommendation and never blocks access.'}
          </p>
        ) : null}
      </Details>

      {budget === 5 ? (
        <div className="mb-5 no-print">
          <StatusNote kind="info">
            Five-minute path: Listen, one task, and Make it yours. Your place and progress are the same
            as in the longer paths.
          </StatusNote>
        </div>
      ) : null}

      {blocks.map((block, index) => (
        <BlockView
          key={`${block.type}-${index}`}
          block={block}
          index={index}
          mode={mode}
          lessonId={lesson.id}
          onSeen={recordBlockSeen}
        />
      ))}

      <section className="lesson-section mb-6">
        <SectionHeading id="make-it-yours">Make it yours</SectionHeading>
        <p>{lesson.makeItYours}</p>
      </section>

      <Details summary="If this is difficult" className="lesson-section mb-6">
        <ul className="list-disc space-y-1 pl-5">
          {lesson.ifDifficult.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </Details>

      <section className="lesson-section mb-6">
        <SectionHeading id="ready">Ready to continue?</SectionHeading>
        <p className="mb-3">{lesson.readinessCheck}</p>
        <div className="no-print flex flex-wrap gap-2">
          {(['not-yet', 'with-help', 'comfortable'] as const).map((value) => (
            <Button
              key={value}
              variant={readiness === value ? 'primary' : 'secondary'}
              onClick={() => completeLesson(store, lesson.id, value)}
            >
              {readinessLabel(value)}
            </Button>
          ))}
        </div>
        <Muted className="mt-2">
          All three choices let you continue and record the lesson as completed. Readiness is stored
          separately from completion, so choosing “Not yet” simply schedules an earlier review.
        </Muted>
      </section>

      <section className="lesson-section mb-8">
        <SectionHeading id="remember">Remember and revisit</SectionHeading>
        <p className="mb-3">{lesson.takeaway}</p>
        <div className="no-print mb-3">
          <label htmlFor="lesson-note" className="mb-1 block text-sm font-medium">
            An optional short note for yourself
          </label>
          <textarea
            id="lesson-note"
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-[var(--color-line)] p-2"
            placeholder="What happened, and what would you try next time?"
          />
          <Button
            className="mt-2"
            disabled={!reflectionText.trim()}
            onClick={() => {
              const now = new Date().toISOString();
              store.update((draft) => {
                draft.notebook.push({
                  id: `nb-${Date.now()}`,
                  title: `Note on ${lesson.title}`,
                  kind: 'journal',
                  text: reflectionText,
                  tags: ['lesson-note'],
                  lessonId: lesson.id,
                  draft: false,
                  arrangements: [],
                  createdAt: now,
                  updatedAt: now,
                });
              }, { immediate: true });
              setReflectionText('');
            }}
          >
            Save to notebook
          </Button>
        </div>
        <Muted>{`Review task: ${lesson.reviewTask}`}</Muted>
        {lesson.glossary.length > 0 ? (
          <p className="mt-3 text-sm">
            {'Reference: '}
            {lesson.glossary.map((id, index) => {
              const entry = glossaryEntry(id);
              if (!entry) return null;
              return (
                <span key={id}>
                  {index > 0 ? ', ' : ''}
                  <Link to={`/reference?term=${id}`} className="text-[var(--color-primary)] underline">
                    {entry.term}
                  </Link>
                </span>
              );
            })}
          </p>
        ) : null}
      </section>

      <nav className="no-print flex flex-wrap justify-between gap-3 border-t border-[var(--color-line)] pt-4">
        {previous ? (
          <Link to={`/lesson/${previous}`} className="text-[var(--color-primary)] underline">
            ← Previous lesson
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/lesson/${next}`} className="text-[var(--color-primary)] underline">
            Next lesson →
          </Link>
        ) : (
          <Link to="/progress" className="text-[var(--color-primary)] underline">
            See your progress →
          </Link>
        )}
      </nav>
    </article>
  );
}

function readinessLabel(readiness: Readiness): string {
  return readiness === 'not-yet' ? 'Not yet' : readiness === 'with-help' ? 'With help' : 'Comfortable';
}

function BlockView({ block, index, mode, lessonId, onSeen }: {
  block: LessonBlock; index: number; mode: LessonMode; lessonId: Lesson['id'];
  onSeen: (index: number) => void;
}) {
  useEffect(() => { onSeen(index); }, [onSeen, index]);

  switch (block.type) {
    case 'prose':
      return (
        <section className="lesson-section mb-6">
          {block.heading ? <SectionHeading>{block.heading}</SectionHeading> : null}
          {block.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="mb-3">{paragraph}</p>
          ))}
        </section>
      );

    case 'example':
      return <ExampleBlock scoreId={block.scoreId} prompt={block.prompt} hideAnswer={block.hideAnswer} mode={mode} />;

    case 'exercise': {
      const exercise = exerciseById(block.exerciseId);
      if (!exercise) {
        return (
          <StatusNote kind="error">{`Exercise ${block.exerciseId} could not be found.`}</StatusNote>
        );
      }
      return <ExerciseRunner exercise={exercise} lessonId={lessonId} />;
    }

    case 'piano-task':
      return (
        <Card className="lesson-section mb-6 bg-[var(--color-accent-soft)]">
          <SectionHeading>At your piano</SectionHeading>
          <ol className="mb-3 list-decimal space-y-2 pl-5 text-lg">
            {block.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <p className="text-base"><strong>Easier: </strong>{block.easier}</p>
          <p className="text-base"><strong>Stretch: </strong>{block.stretch}</p>
          <Muted className="mt-2">
            The app cannot hear your piano. Nothing in this section is scored automatically.
          </Muted>
        </Card>
      );

    case 'reflection':
      return (
        <section className="lesson-section mb-6">
          <SectionHeading>Reflect</SectionHeading>
          <p>{block.prompt}</p>
        </section>
      );
  }
}

function ExampleBlock({ scoreId, prompt, hideAnswer, mode }: {
  scoreId: string; prompt: string; hideAnswer: boolean; mode: LessonMode;
}) {
  const [revealed, setRevealed] = useState(false);
  let score;
  try {
    score = requireScore(scoreId);
  } catch {
    return <StatusNote kind="error">{`Example ${scoreId} could not be found.`}</StatusNote>;
  }
  const hidden = (hideAnswer || mode === 'ear') && !revealed;

  return (
    <Card className="lesson-section mb-6">
      <SectionHeading>Listen</SectionHeading>
      <p className="mb-3">{prompt}</p>
      <ScorePlayer score={score} compact showTempo countInBars={score.meter.numerator === 3 ? 1 : 0} />
      <div className="mt-3">
        {hidden ? (
          <>
            <Muted>
              Pitches are hidden for this attempt. The rhythm below is still shown.
            </Muted>
            <BeatGrid score={score} hidePitches labelMode="notes" />
            <Button className="mt-2 no-print" variant="accent" onClick={() => setRevealed(true)}>
              Reveal the notes
            </Button>
          </>
        ) : (
          <>
            <Staff score={score} />
            <BeatGrid score={score} labelMode="both" />
          </>
        )}
      </div>
    </Card>
  );
}
