import { Link } from 'react-router-dom';
import { LESSONS, TOTAL_LESSONS, lessonById } from '../content/course';
import { intervalDescription, localDateString } from '../domain/review';
import { useStore } from '../app/use-store';
import {
  completedCount, due, manualAttemptCount, screenExerciseSummaries, skillSummaries, unknownLessonIds,
} from '../app/progress';
import { Card, Meter, Muted, Pill, SectionHeading, SegmentBar, StatusNote } from '../components/ui';
import { SKILL_LABELS } from '../domain/types';

const CONTINUED_PRACTICE = [
  'Recover one new two-bar melody by ear.',
  'Harmonize a familiar phrase two different ways.',
  'Play one phrase in two keys.',
  'Improvise an answer to a motif.',
  'Simplify a favourite piece to melody and bass.',
  'Revisit a difficult transition slowly.',
];

export function ProgressPage() {
  const { data } = useStore();
  const completed = completedCount(data);
  const dueItems = due(data);
  const skills = skillSummaries(data).filter((s) => s.latest !== null);
  const screen = screenExerciseSummaries(data);
  const unknown = unknownLessonIds(data);
  const manual = manualAttemptCount(data);
  const today = localDateString();

  const totalActiveSeconds = data.sessions.reduce((sum, s) => sum + s.activeSeconds, 0);

  return (
    <div>
      <h1 className="reading-heading mb-1 text-3xl font-semibold">Progress</h1>
      <Muted className="mb-5">
        Everything here comes from what you reported and what you did on screen. There is no combined
        musicianship score, because one number would hide the information you actually need.
      </Muted>

      <Card tone="feature" className="mb-6">
        <SectionHeading>Lessons</SectionHeading>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-4xl font-semibold tabular-nums">{completed} / {TOTAL_LESSONS}</p>
          <Muted>completed</Muted>
        </div>
        <Meter
          className="mt-3 max-w-md"
          value={completed}
          max={TOTAL_LESSONS}
          label={`${completed} of ${TOTAL_LESSONS} lessons completed`}
        />
        {unknown.length > 0 ? (
          <div className="mt-3">
            <StatusNote kind="info">
              {`${unknown.length} lesson id${unknown.length === 1 ? '' : 's'} in your saved data are not part of this version of the course. They remain in your backups but are excluded from the total above.`}
            </StatusNote>
          </div>
        ) : null}
        <ul className="mt-4 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {LESSONS.filter((l) => data.lessons[l.id]?.status === 'completed').slice(-6).reverse().map((lesson) => (
            <li key={lesson.id}>
              <Link to={`/lesson/${lesson.id}`} className="text-[var(--color-primary)] underline">
                {lesson.title}
              </Link>
              {data.lessons[lesson.id]?.readiness ? (
                <span className="ml-2 text-[var(--color-muted)]">
                  {data.lessons[lesson.id]!.readiness!.replace('-', ' ')}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card tone="raised">
          <SectionHeading>Reviews</SectionHeading>
          <p className="mb-2">
            {dueItems.length === 0
              ? 'Nothing is due today.'
              : `${dueItems.length} due today or earlier.`}
          </p>
          <Muted className="mb-3">
            Intervals are 1, 3, 7, 14 and 30 days. A comfortable review moves you to the next
            interval; “with help” keeps the same stage and returns tomorrow; “not yet” resets to the
            first interval. Nothing is ever erased for being overdue.
          </Muted>
          <ul className="space-y-1 text-sm">
            {[...data.reviews]
              .sort((a, b) => (a.dueDate === b.dueDate ? a.id.localeCompare(b.id) : a.dueDate.localeCompare(b.dueDate)))
              .slice(0, 10)
              .map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-2">
                  <Link to={`/lesson/${item.lessonId}`} className="text-[var(--color-primary)] underline">
                    {lessonById(item.lessonId)?.title ?? item.lessonId}
                  </Link>
                  <Pill tone={item.dueDate <= today ? 'help' : 'neutral'}>
                    {item.dueDate <= today ? 'Due' : `Due ${item.dueDate}`}
                  </Pill>
                  <span className="text-[var(--color-muted)]">
                    {`Stage ${item.stage} · next interval ${intervalDescription(item.stage)}`}
                  </span>
                </li>
              ))}
          </ul>
          {data.reviews.length === 0 ? <Muted>No reviews scheduled yet.</Muted> : null}
        </Card>

        <Card>
          <SectionHeading>Self-reported readiness by skill</SectionHeading>
          {skills.length === 0 ? (
            <Muted>Nothing reported yet. Readiness appears here once you answer “How did it go?”.</Muted>
          ) : (
            <ul className="space-y-3">
              {skills.map((skill) => (
                <li key={skill.skill}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>{SKILL_LABELS[skill.skill]}</span>
                    <Pill tone={skill.latest === 'comfortable' ? 'good' : skill.latest === 'with-help' ? 'help' : 'notyet'}>
                      {skill.latest?.replace('-', ' ')}
                    </Pill>
                  </div>
                  <SegmentBar
                    className="mt-1.5"
                    label={`${SKILL_LABELS[skill.skill]}: ${skill.counts.comfortable} comfortable, ${skill.counts['with-help']} with help, ${skill.counts['not-yet']} not yet`}
                    segments={[
                      { key: 'comfortable', value: skill.counts.comfortable, tone: 'good' },
                      { key: 'with-help', value: skill.counts['with-help'], tone: 'help' },
                      { key: 'not-yet', value: skill.counts['not-yet'], tone: 'notyet' },
                    ]}
                  />
                  <span className="mt-1 block text-xs text-[var(--color-muted)]">
                    {`${skill.counts.comfortable} comfortable · ${skill.counts['with-help']} with help · ${skill.counts['not-yet']} not yet`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionHeading>Screen exercises</SectionHeading>
          {screen.length === 0 ? (
            <Muted>No screen exercises recorded yet.</Muted>
          ) : (
            <ul className="space-y-2 text-sm">
              {screen.map((entry) => (
                <li key={entry.metric}>
                  <strong>{entry.metric.replace('-', ' ')}: </strong>
                  {`${entry.correct} of ${entry.total} across ${entry.attempts} attempt${entry.attempts === 1 ? '' : 's'}`}
                  {entry.assisted > 0 ? ` · ${entry.assisted} assisted` : ''}
                  <Muted>
                    {`Input: ${Object.entries(entry.inputModes).map(([mode, count]) => `${mode} ×${count}`).join(', ')}`}
                  </Muted>
                </li>
              ))}
            </ul>
          )}
          <Muted className="mt-3">
            {`${manual} attempts were recorded as acoustic-piano tasks. Those are self-reported only; the app never measured them.`}
          </Muted>
        </Card>

        <Card>
          <SectionHeading>Sessions</SectionHeading>
          <p className="mb-2">
            {data.sessions.length === 0
              ? 'No sessions recorded yet.'
              : `${data.sessions.length} sessions, roughly ${Math.round(totalActiveSeconds / 60)} minutes of active app time.`}
          </p>
          <Muted>
            Active time accumulates only while the app is visible and in use, and pauses after about
            five idle minutes. It is an estimate of time in the app, not a measurement of time at
            your piano.
          </Muted>
        </Card>

        <Card>
          <SectionHeading>Continued practice</SectionHeading>
          <Muted className="mb-2">Choose three of these at a time and keep them for a week or two.</Muted>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {CONTINUED_PRACTICE.map((task) => <li key={task}>{task}</li>)}
          </ul>
          <Muted className="mt-3">
            More keys, compound meter, chromatic melody notes and secondary dominants are sensible
            later study. They are suggestions for your own practice, not unimplemented lessons in
            this app.
          </Muted>
        </Card>
      </div>
    </div>
  );
}
