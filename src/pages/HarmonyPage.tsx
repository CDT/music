import { useMemo, useState } from 'react';
import { STUDIES } from '../content/studies';
import { patternsForMeter } from '../content/patterns';
import { chordSymbolText, describePitchAgainstChord, parseChordSymbol, romanFor } from '../domain/harmony';
import { sliceBars, withChords } from '../domain/score';
import { barBeats } from '../domain/rhythm';
import { pitchName } from '../domain/pitch';
import { useStore } from '../app/use-store';
import { ScorePlayer } from '../features/transport/ScorePlayer';
import { BeatGrid } from '../features/notation/BeatGrid';
import { Button, Card, Muted, Pill, SectionHeading, StatusNote, inputClass } from '../components/ui';
import type { Score } from '../domain/types';

const CHECKLIST = [
  'Sing the whole phrase and identify a plausible home note. Check it by playing a closing gesture; the last note alone is not proof of the key.',
  'Find the melody and its rhythm in small groups. Use a reference note and degrees if that helps.',
  'Mark phrase endings, long notes and strong beats. Start with one chord per bar or per two bars.',
  'Try I and V first, then IV and vi (i, iv, V, VI in minor). Hear each option with the entire phrase.',
  'Inspect sustained melody notes against chord tones. Treat short connecting notes flexibly.',
  'Play bass roots only while singing or playing the melody. Listen to the bass line and the ending.',
  'Add compact chords, then one accompaniment pattern. Keep the melody audible.',
  'Compare at least two plausible choices, and record why one suits the phrase you want.',
];

const LEARNED_CHORDS = ['C', 'F', 'G', 'Am', 'Dm', 'Em', 'G7'];
const ALL_COURSE_CHORDS = [
  'C', 'F', 'G', 'Am', 'Dm', 'Em', 'G7', 'D', 'A', 'Bm', 'F#m', 'E', 'Bb', 'Cadd9', 'C/E', 'C/G',
];

export function HarmonyPage() {
  const { store, data } = useStore();
  const [studyId, setStudyId] = useState('s01');
  const [firstBar, setFirstBar] = useState(5);
  const [lastBar, setLastBar] = useState(8);
  const [chordSet, setChordSet] = useState<'learned' | 'all'>('learned');
  const [patternId, setPatternId] = useState('bass-chord');
  const [selectedNote, setSelectedNote] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [saved, setSaved] = useState(false);

  const study = STUDIES.find((s) => s.id === studyId)!;
  const barCount = Math.round(study.score.totalBeats / barBeats(study.score.meter));
  // The two inputs are clamped only to the score, so editing one never fights
  // the other; the region simply uses whichever is lower.
  const from = Math.min(firstBar, lastBar);
  const to = Math.max(firstBar, lastBar);
  const region = useMemo(
    () => sliceBars(study.score, from, to, `${study.id}-region`),
    [study, from, to],
  );

  const [chartA, setChartA] = useState<string[]>([]);
  const [chartB, setChartB] = useState<string[]>([]);

  const slots = to - from + 1;
  const defaultChart = useMemo(
    () => region.chords
      .filter((c) => Math.abs(c.durationBeats - barBeats(study.score.meter)) < 1e-6 || true)
      .slice(0, slots)
      .map((c) => chordSymbolText(c.symbol)),
    [region, slots, study.score.meter],
  );

  const currentA = chartA.length === slots ? chartA : defaultChart;
  const currentB = chartB.length === slots ? chartB : defaultChart;

  // Building a version is a pure derivation: an unreadable chord yields null
  // and a message, without setting state while rendering.
  const buildVersion = (chart: string[], id: string): { score: Score | null; error: string | null } => {
    try {
      return { score: withChords(region, chart, id), error: null };
    } catch (e) {
      return { score: null, error: e instanceof Error ? e.message : String(e) };
    }
  };

  const versionA = buildVersion(currentA, `${region.id}-a`);
  const versionB = buildVersion(currentB, `${region.id}-b`);
  const error = versionA.error ?? versionB.error;

  const candidates = (chordSet === 'learned' ? LEARNED_CHORDS : ALL_COURSE_CHORDS);
  const melodyNotes = region.notes.filter((n) => n.voice === 'melody' && n.pitch);
  const patterns = patternsForMeter(region.meter);

  return (
    <div>
      <h1 className="reading-heading mb-1 text-3xl font-semibold">Harmony Lab</h1>
      <Muted className="mb-5">
        Choose a melody, try chords under it, and compare two versions at the same tempo and melody
        volume. There is no “best chord” button here, because several chords are usually defensible.
      </Muted>

      <Card className="mb-6">
        <SectionHeading>The reusable checklist</SectionHeading>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {CHECKLIST.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </Card>

      <Card className="mb-6">
        <SectionHeading>Choose a melody and region</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="study" className="mb-1 block text-sm font-medium">Melody</label>
            <select
              id="study"
              className={inputClass}
              value={studyId}
              onChange={(e) => {
                setStudyId(e.target.value);
                setChartA([]); setChartB([]);
                setFirstBar(1); setLastBar(4);
              }}
            >
              {STUDIES.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="first-bar" className="mb-1 block text-sm font-medium">First bar</label>
            <input
              id="first-bar"
              type="number"
              min={1}
              max={barCount}
              className={inputClass}
              value={firstBar}
              onChange={(e) => {
                const value = Math.min(Math.max(Number(e.target.value) || 1, 1), barCount);
                setFirstBar(value); setChartA([]); setChartB([]);
              }}
            />
          </div>
          <div>
            <label htmlFor="last-bar" className="mb-1 block text-sm font-medium">Last bar</label>
            <input
              id="last-bar"
              type="number"
              min={1}
              max={barCount}
              className={inputClass}
              value={lastBar}
              onChange={(e) => {
                const value = Math.min(Math.max(Number(e.target.value) || 1, 1), barCount);
                setLastBar(value); setChartA([]); setChartB([]);
              }}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <span>Candidate chords</span>
            <select
              className="rounded border border-[var(--color-line)] px-2 py-1"
              value={chordSet}
              onChange={(e) => setChordSet(e.target.value as 'learned' | 'all')}
            >
              <option value="learned">Learned so far</option>
              <option value="all">All course chords</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span>Pattern</span>
            <select
              className="rounded border border-[var(--color-line)] px-2 py-1"
              value={patternId}
              onChange={(e) => setPatternId(e.target.value)}
            >
              {patterns.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
        </div>
      </Card>

      {error ? <div className="mb-4"><StatusNote kind="warning">{error}</StatusNote></div> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartEditor
          title="Version A"
          chart={currentA}
          candidates={candidates}
          firstBar={from}
          score={versionA.score}
          patternId={patternId}
          onChange={setChartA}
        />
        <ChartEditor
          title="Version B"
          chart={currentB}
          candidates={candidates}
          firstBar={from}
          score={versionB.score}
          patternId={patternId}
          onChange={setChartB}
        />
      </div>

      <Card className="mt-6">
        <SectionHeading>Check one melody note against a chord</SectionHeading>
        <div className="mb-3 flex flex-wrap gap-2">
          {melodyNotes.map((note) => (
            <Button
              key={note.id}
              variant={selectedNote === note.pitch!.midi ? 'primary' : 'secondary'}
              onClick={() => setSelectedNote(note.pitch!.midi)}
            >
              {pitchName(note.pitch!)}
            </Button>
          ))}
        </div>
        {selectedNote !== null ? (
          <ul className="space-y-1 text-sm">
            {candidates.map((text) => {
              const symbol = parseChordSymbol(text);
              return (
                <li key={text}>
                  <strong>{`${text} (${romanFor(symbol, region.key)}): `}</strong>
                  {describePitchAgainstChord(selectedNote, symbol, region.key)}
                </li>
              );
            })}
          </ul>
        ) : (
          <Muted>Choose a melody note to see how each candidate chord relates to it.</Muted>
        )}
        <Muted className="mt-3">
          A note outside a chord is not an error. Short connecting notes frequently sit outside the
          harmony that supports them.
        </Muted>
      </Card>

      <Card className="mt-6">
        <SectionHeading>Save your choice</SectionHeading>
        <label htmlFor="reason" className="mb-1 block text-sm font-medium">
          Which version did you choose, and what did you hear?
        </label>
        <textarea
          id="reason"
          rows={3}
          className="w-full rounded-lg border border-[var(--color-line)] p-2"
          value={reason}
          onChange={(e) => { setReason(e.target.value); setSaved(false); }}
        />
        <Button
          className="mt-2"
          variant="primary"
          disabled={!reason.trim()}
          onClick={() => {
            const now = new Date().toISOString();
            store.update((draft) => {
              draft.notebook.push({
                id: `nb-${Date.now()}`,
                title: `${study.title} bars ${from}–${to}`,
                kind: 'journal',
                text: reason,
                tags: [`study:${study.id}`, 'harmony-lab'],
                draft: false,
                arrangements: [
                  {
                    id: `arr-a-${Date.now()}`,
                    title: `Version A: ${currentA.join(' – ')}`,
                    chords: versionA.score?.chords ?? [],
                    patternId,
                    comment: reason,
                  },
                  {
                    id: `arr-b-${Date.now()}`,
                    title: `Version B: ${currentB.join(' – ')}`,
                    chords: versionB.score?.chords ?? [],
                    patternId,
                    comment: '',
                  },
                ],
                createdAt: now,
                updatedAt: now,
              });
            }, { immediate: true });
            setReason('');
            setSaved(true);
          }}
        >
          Save both versions to the notebook
        </Button>
        {saved ? <div className="mt-2"><StatusNote kind="success">Saved. Both versions are stored so you can reopen and hear them.</StatusNote></div> : null}
        <Muted className="mt-3">
          {`${data.notebook.filter((n) => n.tags.includes('harmony-lab')).length} harmony comparisons saved so far.`}
        </Muted>
      </Card>
    </div>
  );
}

function ChartEditor({ title, chart, candidates, firstBar, score, patternId, onChange }: {
  title: string;
  chart: string[];
  candidates: string[];
  firstBar: number;
  score: Score | null;
  patternId: string;
  onChange: (chart: string[]) => void;
}) {
  return (
    <Card>
      <SectionHeading>{title}</SectionHeading>
      <div className="mb-3 space-y-2">
        {chart.map((value, index) => (
          <div key={`${title}-${index}`} className="flex items-center gap-2">
            <Pill>{`Bar ${firstBar + index}`}</Pill>
            <select
              aria-label={`${title}, bar ${firstBar + index} chord`}
              className="flex-1 rounded border border-[var(--color-line)] px-2 py-2"
              value={value}
              onChange={(e) => {
                const next = [...chart];
                next[index] = e.target.value;
                onChange(next);
              }}
            >
              {[...new Set([...candidates, value])].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <select
              aria-label={`${title}, bar ${firstBar + index} second chord`}
              className="w-28 rounded border border-[var(--color-line)] px-2 py-2"
              value={value.includes(' ') ? value.split(' ')[1] : ''}
              onChange={(e) => {
                const next = [...chart];
                const root = value.split(' ')[0];
                next[index] = e.target.value ? `${root} ${e.target.value}` : root;
                onChange(next);
              }}
            >
              <option value="">one chord</option>
              {candidates.map((option) => <option key={option} value={option}>{`+ ${option}`}</option>)}
            </select>
          </div>
        ))}
      </div>
      {score ? (
        <>
          <ScorePlayer
            score={score}
            defaultPatternId={patternId}
            showMix
            showTempo
            showPattern={false}
            showLoop={false}
          />
          <div className="mt-3">
            <BeatGrid score={score} labelMode="both" />
          </div>
        </>
      ) : (
        <StatusNote kind="warning">That chord could not be read. Choose another.</StatusNote>
      )}
    </Card>
  );
}
