import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GLOSSARY, REFERENCE_CHORDS } from '../content/glossary';
import { scoreById } from '../content/examples';
import { PATTERNS } from '../content/patterns';
import { chordPitchClasses, chordSymbolText, compactVoicing, parseChordSymbol, romanFor } from '../domain/harmony';
import { keyName, pitchClassName, scalePitchClasses } from '../domain/pitch';
import { majorKey, minorKey } from '../domain/score';
import { previewPitches } from '../services/audio/transport';
import { ScorePlayer } from '../features/transport/ScorePlayer';
import { Button, Card, Muted, Pill, SectionHeading, inputClass } from '../components/ui';
import type { KeySpec } from '../domain/types';

const KEYS: KeySpec[] = [
  majorKey('C'), majorKey('G'), majorKey('F'), majorKey('D'), minorKey('A'),
];

export function ReferencePage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const focusTerm = params.get('term');

  const entries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return GLOSSARY.filter((entry) =>
      !needle
      || entry.term.toLowerCase().includes(needle)
      || entry.definition.toLowerCase().includes(needle)
      || entry.example.toLowerCase().includes(needle)
      || entry.tags.some((tag) => tag.includes(needle)));
  }, [query]);

  return (
    <div>
      <h1 className="reading-heading mb-1 text-3xl font-semibold">Reference</h1>
      <Muted className="mb-5">
        Every term the course introduces, with a concrete example in C major or A minor.
      </Muted>

      <Card className="no-print mb-6">
        <label htmlFor="reference-search" className="mb-1 block text-sm font-medium">Search the reference</label>
        <input
          id="reference-search"
          type="search"
          className={inputClass}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            const next = new URLSearchParams(params);
            if (e.target.value) next.set('q', e.target.value); else next.delete('q');
            setParams(next, { replace: true });
          }}
        />
        <Muted className="mt-2" aria-live="polite">{`${entries.length} entries.`}</Muted>
      </Card>

      <section className="mb-8">
        <h2 className="reading-heading mb-3 text-xl font-semibold">Glossary</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {entries.map((entry) => {
            const score = entry.scoreId ? scoreById(entry.scoreId) : undefined;
            return (
              <li key={entry.id} id={entry.id}>
                <Card className={`h-full ${focusTerm === entry.id ? 'border-[var(--color-primary)]' : ''}`}>
                  <SectionHeading>{entry.term}</SectionHeading>
                  <p className="mb-2">{entry.definition}</p>
                  <p className="mb-2 text-sm"><strong>Example: </strong>{entry.example}</p>
                  {score ? <ScorePlayer score={score} compact /> : null}
                  {entry.chordText ? (
                    <Button
                      className="mt-2"
                      onClick={() => {
                        const symbol = parseChordSymbol(entry.chordText!);
                        void previewPitches(compactVoicing(symbol, 52).map((p) => p.midi), 1.4);
                      }}
                    >
                      {`Play ${entry.chordText}`}
                    </Button>
                  ) : null}
                  {entry.lessons.length > 0 ? (
                    <p className="mt-3 text-sm">
                      {'Used in: '}
                      {entry.lessons.map((id, index) => (
                        <span key={id}>
                          {index > 0 ? ', ' : ''}
                          <Link to={`/lesson/${id}`} className="text-[var(--color-primary)] underline">{id}</Link>
                        </span>
                      ))}
                    </p>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="reading-heading mb-3 text-xl font-semibold">Keys and scales</h2>
        <Card>
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Scales and their diatonic triads</caption>
            <thead>
              <tr>
                <th scope="col" className="border-b border-[var(--color-line)] px-2 py-1 text-left">Key</th>
                <th scope="col" className="border-b border-[var(--color-line)] px-2 py-1 text-left">Scale</th>
                <th scope="col" className="border-b border-[var(--color-line)] px-2 py-1 text-left">I/i</th>
                <th scope="col" className="border-b border-[var(--color-line)] px-2 py-1 text-left">IV/iv</th>
                <th scope="col" className="border-b border-[var(--color-line)] px-2 py-1 text-left">V</th>
                <th scope="col" className="border-b border-[var(--color-line)] px-2 py-1 text-left">vi/VI</th>
              </tr>
            </thead>
            <tbody>
              {KEYS.map((key) => {
                const scale = scalePitchClasses(key);
                const triad = (degree: number) => {
                  const root = scale[degree - 1];
                  const quality = key.mode === 'major'
                    ? [1, 4, 5].includes(degree) ? 'major' : 'minor'
                    : degree === 1 || degree === 4 ? 'minor' : 'major';
                  const symbol = { root, quality: quality as 'major' | 'minor' };
                  return chordPitchClasses(symbol).map(pitchClassName).join(' ');
                };
                const dominant = key.mode === 'minor'
                  ? 'E G# B (raised seventh; natural minor v is E G B)'
                  : triad(5);
                return (
                  <tr key={keyName(key)}>
                    <th scope="row" className="border-b border-[var(--color-line)] px-2 py-1 text-left font-medium">
                      {keyName(key)}
                    </th>
                    <td className="border-b border-[var(--color-line)] px-2 py-1">
                      {scale.map(pitchClassName).join(' ')}
                    </td>
                    <td className="border-b border-[var(--color-line)] px-2 py-1">{triad(1)}</td>
                    <td className="border-b border-[var(--color-line)] px-2 py-1">{triad(4)}</td>
                    <td className="border-b border-[var(--color-line)] px-2 py-1">{dominant}</td>
                    <td className="border-b border-[var(--color-line)] px-2 py-1">{triad(6)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Muted className="mt-3">
            In A minor the V shown uses G#, an alteration of natural minor. The natural-minor v is
            E–G–B. The final column is vi in a major key and VI in a minor key.
          </Muted>
        </Card>
      </section>

      <section className="mb-8">
        <h2 className="reading-heading mb-3 text-xl font-semibold">Chords</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REFERENCE_CHORDS.map((text) => {
            const symbol = parseChordSymbol(text);
            const voicing = compactVoicing(symbol, 52);
            return (
              <li key={text}>
                <Card>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-lg font-semibold">{chordSymbolText(symbol)}</span>
                    <Pill>{romanFor(symbol, majorKey('C'))} in C</Pill>
                  </div>
                  <p className="mb-2 text-sm">
                    {chordPitchClasses(symbol).map(pitchClassName).join(' – ')}
                  </p>
                  <Button onClick={() => void previewPitches(voicing.map((p) => p.midi), 1.4)}>
                    Play it
                  </Button>
                </Card>
              </li>
            );
          })}
        </ul>
        <Muted className="mt-3">
          Transposed chords are generated from the theory model, so their spellings follow the key
          rather than a substituted label.
        </Muted>
      </section>

      <section>
        <h2 className="reading-heading mb-3 text-xl font-semibold">Accompaniment patterns</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {PATTERNS.map((pattern) => (
            <li key={pattern.id}>
              <Card>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <SectionHeading>{pattern.label}</SectionHeading>
                  {pattern.meters.map((m) => <Pill key={m}>{m}</Pill>)}
                </div>
                <p className="text-sm">{pattern.description}</p>
                <Muted className="mt-2">
                  {pattern.sustained
                    ? 'Retriggers at every chord change.'
                    : `Events at beats ${[...new Set(pattern.events.map((e) => e.offset))].join(', ')} of each bar.`}
                </Muted>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
