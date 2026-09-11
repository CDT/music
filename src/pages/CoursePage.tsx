import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MODULES, TOTAL_LESSONS, searchLessons } from '../content/course';
import { useStore } from '../app/use-store';
import { completedCount } from '../app/progress';
import { Button, Card, Muted, Pill, inputClass } from '../components/ui';
import { SKILL_LABELS } from '../domain/types';
import type { SkillId } from '../domain/types';

type Filter = 'all' | 'not-started' | 'in-progress' | 'completed';

export function CoursePage() {
  const { data } = useStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [skill, setSkill] = useState<SkillId | 'all'>('all');

  const matches = useMemo(() => {
    const found = new Set(searchLessons(query).map((record) => record.lesson.id));
    return found;
  }, [query]);

  const completed = completedCount(data);

  const visibleModules = MODULES.map((module) => ({
    module,
    lessons: module.lessons.filter((lesson) => {
      if (!matches.has(lesson.id)) return false;
      if (skill !== 'all' && !lesson.skills.includes(skill)) return false;
      const status = data.lessons[lesson.id]?.status ?? 'not-started';
      if (filter !== 'all' && status !== filter) return false;
      return true;
    }),
  })).filter((entry) => entry.lessons.length > 0);

  const shown = visibleModules.reduce((sum, entry) => sum + entry.lessons.length, 0);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="reading-heading text-3xl font-semibold">The course</h1>
          <Muted>{`12 modules, ${TOTAL_LESSONS} lessons. ${completed} completed.`}</Muted>
        </div>
        <Link to="/print/course" className="text-[var(--color-primary)] underline">
          Print the whole written course
        </Link>
      </div>

      <Card className="no-print mb-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="course-search" className="mb-1 block text-sm font-medium">Search</label>
            <input
              id="course-search"
              type="search"
              className={inputClass}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="minor, Canon, pedal, transposition…"
            />
          </div>
          <div>
            <label htmlFor="course-filter" className="mb-1 block text-sm font-medium">Status</label>
            <select id="course-filter" className={inputClass} value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
              <option value="all">All lessons</option>
              <option value="not-started">Not started</option>
              <option value="in-progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label htmlFor="course-skill" className="mb-1 block text-sm font-medium">Skill</label>
            <select id="course-skill" className={inputClass} value={skill} onChange={(e) => setSkill(e.target.value as SkillId | 'all')}>
              <option value="all">All skills</option>
              {Object.entries(SKILL_LABELS).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        <Muted className="mt-2" aria-live="polite">{`${shown} lesson${shown === 1 ? '' : 's'} shown.`}</Muted>
      </Card>

      {shown === 0 ? (
        <Card>
          <p>No lessons match that search.</p>
          <Button className="mt-3" onClick={() => { setQuery(''); setFilter('all'); setSkill('all'); }}>
            Clear the filters
          </Button>
        </Card>
      ) : null}

      {visibleModules.map(({ module, lessons }) => (
        <section key={module.id} className="mb-7">
          <h2 className="reading-heading text-xl font-semibold">
            {`Module ${module.index} — ${module.title}`}
          </h2>
          <Muted className="mb-3">{module.summary}</Muted>
          <ul className="grid gap-3 sm:grid-cols-2">
            {lessons.map((lesson) => {
              const progress = data.lessons[lesson.id];
              const status = progress?.status ?? 'not-started';
              return (
                <li key={lesson.id}>
                  <Link
                    to={`/lesson/${lesson.id}`}
                    className="block h-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-primary)]"
                  >
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-[var(--color-muted)]">{lesson.id}</span>
                      <Pill tone={status === 'completed' ? 'good' : status === 'in-progress' ? 'help' : 'neutral'}>
                        {status === 'completed' ? 'Completed' : status === 'in-progress' ? 'In progress' : 'Not started'}
                      </Pill>
                    </div>
                    <p className="font-medium">{lesson.title}</p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">{lesson.objective}</p>
                    {progress?.readiness ? (
                      <p className="mt-2 text-xs text-[var(--color-muted)]">
                        {`Self-reported readiness: ${progress.readiness.replace('-', ' ')}`}
                      </p>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
