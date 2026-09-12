import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LESSONS, TOTAL_LESSONS, lessonById } from '../content/course';
import { planSession } from '../domain/review';
import { useStore } from '../app/use-store';
import { completedCount, due, nextIncompleteLesson } from '../app/progress';
import { Button, Card, Meter, Muted, Pill, SectionHeading } from '../components/ui';

const BUDGETS: Array<{ value: 5 | 15 | 30 | null; label: string; detail: string }> = [
  { value: 5, label: '5 minutes', detail: '1 min recall · 2 min one ear task · 2 min music' },
  { value: 15, label: '15 minutes', detail: '3 min review · 5 min lesson · 5 min piano · 2 min reflection' },
  { value: 30, label: '30 minutes', detail: '5 review · 8 lesson · 10 application · 5 improvising · 2 reflection' },
  { value: null, label: 'Untimed', detail: 'Stop whenever you like; your place is kept' },
];

const FIRST_VISIT_HIGHLIGHTS = [
  {
    title: '48 lessons',
    detail: 'Twelve modules. Each lesson has an outcome, a playable example, on-screen tasks and a task at your own piano.',
  },
  {
    title: 'Six study pieces',
    detail: 'Original, short, and learnable in chunks — playable at your tempo, in more than one key.',
  },
  {
    title: 'Practice tools',
    detail: 'An ear trainer, a metronome, a virtual piano and a harmony lab for comparing two harmonizations.',
  },
];

export function HomePage() {
  const { data, store } = useStore();
  const navigate = useNavigate();
  const [budget, setBudget] = useState<5 | 15 | 30 | null>(data.settings.defaultSessionMinutes);

  const completed = completedCount(data);
  const dueItems = due(data);
  const nextId = nextIncompleteLesson(data);
  const nextLesson = nextId ? lessonById(nextId) : null;
  const inProgress = nextId ? data.lessons[nextId]?.status === 'in-progress' : false;
  const recentNote = [...data.notebook].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const isFirstVisit = completed === 0 && data.notebook.length === 0 && !data.settings.onboarded;

  const tasks = useMemo(() => planSession({
    minutes: budget,
    due: dueItems,
    nextLessonId: nextId,
    nextLessonTitle: nextLesson?.title ?? null,
    lessonInProgress: inProgress,
  }), [budget, dueItems, nextId, nextLesson, inProgress]);

  if (isFirstVisit) {
    return (
      <div>
        <div className="reading">
          <h1 className="reading-heading text-3xl font-semibold">
            Learn to turn the music you hear into melody and accompaniment.
          </h1>
          <p className="mt-4">
            Forty-eight written lessons, six short study pieces, and practice tools that run entirely in
            this browser. You will hear a phrase, sing or imagine it, find it on your piano, and learn
            to support it with chords.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => navigate('/lesson/m01-l01')}>
              Start the first lesson
            </Button>
            <Button onClick={() => navigate('/course')}>Browse the course</Button>
            <Button variant="quiet" onClick={() => navigate('/start')}>Set up a few preferences</Button>
          </div>
          <Muted className="mt-6">
            Nothing is saved anywhere but this browser. There is no account, no subscription, and no
            recording of your playing.
          </Muted>

          {/* Inside the reading column so these line up with the prose above. */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {FIRST_VISIT_HIGHLIGHTS.map((item) => (
              <Card key={item.title}>
                <p className="reading-heading text-lg font-semibold">{item.title}</p>
                <Muted className="mt-1">{item.detail}</Muted>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div>
        <Card tone="feature" className="mb-6">
          <SectionHeading>Continue</SectionHeading>
          {nextLesson ? (
            <>
              <p className="mb-1 text-lg font-medium">{nextLesson.title}</p>
              <Muted className="mb-3">
                {inProgress ? 'You have this lesson open.' : 'Next in course order.'}
                {` ${nextLesson.objective}`}
              </Muted>
              <Button variant="primary" onClick={() => navigate(`/lesson/${nextLesson.id}?minutes=${budget ?? 'open'}`)}>
                {inProgress ? 'Continue this lesson' : 'Start this lesson'}
              </Button>
            </>
          ) : (
            <>
              <p className="mb-3">
                You have completed all {TOTAL_LESSONS} lessons. The continued-practice ladder in
                Progress keeps going from here.
              </p>
              <Button variant="primary" onClick={() => navigate('/progress')}>Open Progress</Button>
            </>
          )}
        </Card>

        <Card tone="raised" className="mb-6">
          <SectionHeading>How long do you have?</SectionHeading>
          <div className="mb-3 flex flex-wrap gap-2">
            {BUDGETS.map((option) => (
              <Button
                key={String(option.value)}
                variant={budget === option.value ? 'primary' : 'secondary'}
                onClick={() => {
                  setBudget(option.value);
                  store.update((draft) => { draft.settings.defaultSessionMinutes = option.value; });
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <Muted className="mb-3">
            {BUDGETS.find((b) => b.value === budget)?.detail}
            {' These are suggestions, not deadlines. You can stop midway and resume where you left off.'}
          </Muted>
          <ol className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="rounded-lg border border-[var(--color-line)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{task.title}</span>
                  <Pill>{`about ${task.minutes} min`}</Pill>
                </div>
                <Muted className="mt-1">{task.detail}</Muted>
                {task.lessonId ? (
                  <Link
                    to={`/lesson/${task.lessonId}?minutes=${budget ?? 'open'}`}
                    className="mt-2 inline-block text-[var(--color-primary)] underline"
                  >
                    Open
                  </Link>
                ) : null}
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div>
        <Card className="mb-6">
          <SectionHeading>Progress</SectionHeading>
          <p className="text-2xl font-semibold tabular-nums">{completed} / {TOTAL_LESSONS}</p>
          <Muted>lessons completed</Muted>
          <Meter
            className="mt-2"
            value={completed}
            max={TOTAL_LESSONS}
            label={`${completed} of ${TOTAL_LESSONS} lessons completed`}
          />
          <p className="mt-3">
            {dueItems.length === 0
              ? 'No reviews are due today.'
              : `${dueItems.length} review${dueItems.length === 1 ? '' : 's'} due.`}
          </p>
          {dueItems.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm">
              {dueItems.slice(0, 5).map((item) => (
                <li key={item.id}>
                  <Link to={`/lesson/${item.lessonId}`} className="text-[var(--color-primary)] underline">
                    {lessonById(item.lessonId)?.title ?? item.lessonId}
                  </Link>
                  {` — due ${item.dueDate}`}
                </li>
              ))}
            </ul>
          ) : null}
          <Link to="/progress" className="mt-3 inline-block text-[var(--color-primary)] underline">
            See all progress
          </Link>
        </Card>

        <Card>
          <SectionHeading>Notebook</SectionHeading>
          {recentNote ? (
            <>
              <p className="font-medium">{recentNote.title}</p>
              <Muted className="mt-1">{recentNote.text.slice(0, 160) || 'No text yet.'}</Muted>
              <Link to={`/notebook/${recentNote.id}`} className="mt-2 inline-block text-[var(--color-primary)] underline">
                Open this entry
              </Link>
            </>
          ) : (
            <>
              <Muted>No entries yet. Your melodies, arrangements and practice notes will appear here.</Muted>
              <Link to="/notebook" className="mt-2 inline-block text-[var(--color-primary)] underline">
                Open the notebook
              </Link>
            </>
          )}
        </Card>
      </div>

      <span className="sr-only">{`Course contains ${LESSONS.length} lessons.`}</span>
    </div>
  );
}
