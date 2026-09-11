import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../app/use-store';
import { Button, Card, Muted, Pill, SectionHeading, inputClass } from '../components/ui';
import { buildScore, majorKey } from '../domain/score';

export function NotebookPage() {
  const { data, store } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const entries = [...data.notebook]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .filter((entry) => {
      const needle = query.trim().toLowerCase();
      if (!needle) return true;
      return [entry.title, entry.text, ...entry.tags].join(' ').toLowerCase().includes(needle);
    });

  const create = (kind: 'journal' | 'melody') => {
    const id = `nb-${Date.now()}`;
    const now = new Date().toISOString();
    store.update((draft) => {
      draft.notebook.push({
        id,
        title: kind === 'melody' ? 'New melody' : 'New practice note',
        kind,
        text: '',
        tags: [],
        draft: kind === 'melody',
        score: kind === 'melody'
          ? buildScore({
            id: `score-${id}`,
            title: 'New melody',
            key: majorKey('C'),
            meter: { numerator: 4, denominator: 4 },
            tempoQuarterBpm: 60,
            bars: ['r:4'],
            chords: ['C'],
            origin: 'learner',
          })
          : undefined,
        arrangements: [],
        createdAt: now,
        updatedAt: now,
      });
    }, { immediate: true });
    navigate(`/notebook/${id}`);
  };

  return (
    <div>
      <h1 className="reading-heading mb-1 text-3xl font-semibold">Melody notebook</h1>
      <Muted className="mb-5">
        Your melodies, arrangements and practice journal. Saved in this browser only — export from
        Settings to keep a copy.
      </Muted>

      <Card className="no-print mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label htmlFor="notebook-search" className="mb-1 block text-sm font-medium">Search</label>
            <input
              id="notebook-search"
              type="search"
              className={inputClass}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title, text or tag"
            />
          </div>
          <Button variant="primary" onClick={() => create('melody')}>New melody</Button>
          <Button onClick={() => create('journal')}>New practice note</Button>
        </div>
      </Card>

      {entries.length === 0 ? (
        <Card>
          <p>
            {data.notebook.length === 0
              ? 'Nothing here yet. Lessons will offer to save notes, and the Harmony Lab saves arrangements.'
              : 'No entries match that search.'}
          </p>
        </Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Card className="h-full">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Pill>{entry.kind === 'melody' ? 'Melody' : 'Journal'}</Pill>
                  {entry.draft ? <Pill tone="help">Draft</Pill> : null}
                  {entry.arrangements.length > 0 ? (
                    <Pill>{`${entry.arrangements.length} arrangement${entry.arrangements.length === 1 ? '' : 's'}`}</Pill>
                  ) : null}
                </div>
                <SectionHeading>{entry.title}</SectionHeading>
                <Muted className="mb-2">{entry.text.slice(0, 180) || 'No text yet.'}</Muted>
                <div className="flex flex-wrap items-center gap-3">
                  <Link to={`/notebook/${entry.id}`} className="text-[var(--color-primary)] underline">
                    Open
                  </Link>
                  <span className="text-xs text-[var(--color-muted)]">
                    {`Updated ${new Date(entry.updatedAt).toLocaleString()}`}
                  </span>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
