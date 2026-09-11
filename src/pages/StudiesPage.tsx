import { useState } from 'react';
import { Link } from 'react-router-dom';
import { STUDIES } from '../content/studies';
import { useStore } from '../app/use-store';
import { Card, Muted, Pill, SectionHeading, inputClass } from '../components/ui';
import { keyName } from '../domain/pitch';
import { meterText } from '../domain/rhythm';

const STAGES = [
  { id: 'listen', label: 'Listen' },
  { id: 'learn', label: 'Learn by ear in chunks' },
  { id: 'bass', label: 'Add bass' },
  { id: 'chords', label: 'Add chords' },
  { id: 'pattern', label: 'Choose a pattern' },
  { id: 'transpose', label: 'Transpose' },
  { id: 'vary', label: 'Make a variation' },
];

export function StudiesPage() {
  const { data } = useStore();
  const [filter, setFilter] = useState<'all' | 'major' | 'minor' | '3/4'>('all');

  const visible = STUDIES.filter((study) => {
    if (filter === 'all') return true;
    if (filter === '3/4') return study.score.meter.numerator === 3;
    return study.score.key.mode === filter;
  });

  return (
    <div>
      <h1 className="reading-heading mb-1 text-3xl font-semibold">Study pieces</h1>
      <Muted className="mb-5">
        Six short melodies written for this course. They are original studies, not transcriptions of
        commercial songs or of anyone’s arrangement.
      </Muted>

      <Card className="no-print mb-6">
        <label htmlFor="study-filter" className="mb-1 block text-sm font-medium">Filter</label>
        <select
          id="study-filter"
          className={`${inputClass} max-w-xs`}
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
        >
          <option value="all">All six studies</option>
          <option value="major">Major keys</option>
          <option value="minor">Minor keys</option>
          <option value="3/4">Three-beat meter</option>
        </select>
      </Card>

      <ul className="grid gap-4 md:grid-cols-2">
        {visible.map((study) => {
          const notes = data.notebook.filter((entry) => entry.tags.includes(`study:${study.id}`));
          return (
            <li key={study.id}>
              <Card className="h-full">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Pill>{study.id.toUpperCase()}</Pill>
                  <Pill>{keyName(study.score.key)}</Pill>
                  <Pill>{meterText(study.score.meter)}</Pill>
                  <Pill>{`${study.score.tempoQuarterBpm} BPM`}</Pill>
                </div>
                <SectionHeading>{study.title}</SectionHeading>
                <p className="mb-2">{study.teaching}</p>
                <Muted className="mb-3">
                  {`Learning stages: ${STAGES.map((s) => s.label).join(' · ')}`}
                </Muted>
                {notes.length > 0 ? (
                  <Muted className="mb-2">{`${notes.length} saved arrangement note${notes.length === 1 ? '' : 's'}.`}</Muted>
                ) : null}
                <Link to={`/studies/${study.id}`} className="text-[var(--color-primary)] underline">
                  Open {study.title}
                </Link>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
