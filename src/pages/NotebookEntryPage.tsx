import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../app/use-store';
import { Button, Card, Field, Muted, Pill, SectionHeading, StatusNote, inputClass } from '../components/ui';
import { NoteEntry } from '../features/piano/Keyboard';
import { ScorePlayer } from '../features/transport/ScorePlayer';
import { BeatGrid } from '../features/notation/BeatGrid';
import { buildScore, majorKey, minorKey } from '../domain/score';
import { barBeats, trimNumber } from '../domain/rhythm';
import { keyName, spellInKey } from '../domain/pitch';
import { patternsForMeter } from '../content/patterns';
import type { KeySpec, Meter, NotebookEntry, Score } from '../domain/types';

const KEYS: Array<{ id: string; label: string; key: KeySpec }> = [
  { id: 'C', label: 'C major', key: majorKey('C') },
  { id: 'G', label: 'G major', key: majorKey('G') },
  { id: 'F', label: 'F major', key: majorKey('F') },
  { id: 'D', label: 'D major', key: majorKey('D') },
  { id: 'Am', label: 'A minor', key: minorKey('A') },
];

const DURATIONS = [0.5, 1, 1.5, 2, 3, 4];

interface EditorNote { midi: number | null; beats: number; }

export function NotebookEntryPage() {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const { data, store } = useStore();
  const entry = data.notebook.find((e) => e.id === entryId);

  const [title, setTitle] = useState(entry?.title ?? '');
  const [text, setText] = useState(entry?.text ?? '');
  const [tags, setTags] = useState((entry?.tags ?? []).join(', '));
  const [keyId, setKeyId] = useState('C');
  const [meterId, setMeterId] = useState('4/4');
  const [tempo, setTempo] = useState(entry?.score?.tempoQuarterBpm ?? 60);
  const [notes, setNotes] = useState<EditorNote[]>([]);
  const [duration, setDuration] = useState(1);
  const [undoStack, setUndoStack] = useState<EditorNote[][]>([]);
  const [redoStack, setRedoStack] = useState<EditorNote[][]>([]);
  const [patternId, setPatternId] = useState('held');
  const [arrangementTitle, setArrangementTitle] = useState('');
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load a different entry's fields during render rather than from an effect,
  // so the editor never shows the previous entry's content for one frame.
  if (entry && loadedId !== entry.id) {
    setLoadedId(entry.id);
    setTitle(entry.title);
    setText(entry.text);
    setTags(entry.tags.join(', '));
    if (entry.score) {
      setTempo(entry.score.tempoQuarterBpm);
      setMeterId(`${entry.score.meter.numerator}/${entry.score.meter.denominator}`);
      const found = KEYS.find((k) =>
        k.key.tonic.letter === entry.score!.key.tonic.letter && k.key.mode === entry.score!.key.mode);
      if (found) setKeyId(found.id);
      setNotes(entry.score.notes
        .filter((n) => n.voice === 'melody')
        .map((n) => ({ midi: n.pitch?.midi ?? null, beats: n.durationBeats })));
    }
  }

  const musicKey = KEYS.find((k) => k.id === keyId)!.key;
  const meter: Meter = useMemo(() => (meterId === '3/4'
    ? { numerator: 3, denominator: 4 }
    : meterId === '6/8'
      ? { numerator: 6, denominator: 8 }
      : { numerator: 4, denominator: 4 }), [meterId]);
  const barLength = barBeats(meter);

  const bars = useMemo(() => {
    const out: EditorNote[][] = [];
    let current: EditorNote[] = [];
    let total = 0;
    for (const note of notes) {
      current.push(note);
      total += note.beats;
      if (total >= barLength - 1e-9) {
        out.push(current);
        current = [];
        total = 0;
      }
    }
    if (current.length > 0) out.push(current);
    return out;
  }, [notes, barLength]);

  const barTotals = bars.map((bar) => bar.reduce((sum, n) => sum + n.beats, 0));
  const invalidBar = barTotals.findIndex((total) => Math.abs(total - barLength) > 1e-6);
  const isDraft = notes.length === 0 || invalidBar >= 0;

  const score: Score | null = useMemo(() => {
    if (isDraft) return null;
    try {
      return buildScore({
        id: `score-${entryId}`,
        title: title || 'Melody',
        key: musicKey,
        meter,
        tempoQuarterBpm: tempo,
        bars: bars.map((bar) => bar
          .map((n) => (n.midi === null
            ? `r:${trimNumber(n.beats)}`
            : `${formatPitch(n.midi, musicKey)}:${trimNumber(n.beats)}`))
          .join(' ')),
        origin: 'learner',
      });
    } catch {
      return null;
    }
  }, [isDraft, bars, musicKey, meter, tempo, title, entryId]);

  const save = useCallback(() => {
    if (!entry) return;
    store.update((draft) => {
      const index = draft.notebook.findIndex((e) => e.id === entry.id);
      if (index < 0) return;
      const updated: NotebookEntry = {
        ...draft.notebook[index],
        title: title || 'Untitled',
        text,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        draft: entry.kind === 'melody' ? isDraft : false,
        score: entry.kind === 'melody' ? (score ?? draft.notebook[index].score) : undefined,
        updatedAt: new Date().toISOString(),
      };
      draft.notebook[index] = updated;
    });
  }, [entry, store, title, text, tags, isDraft, score]);

  // Autosave after a short debounce.
  useEffect(() => {
    if (!entry) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [save, entry]);

  if (!entry) {
    return (
      <Card className="reading">
        <SectionHeading>That notebook entry could not be found</SectionHeading>
        <p className="mb-3">It may have been deleted, or the link may be from an export.</p>
        <Link to="/notebook" className="text-[var(--color-primary)] underline">Back to the notebook</Link>
      </Card>
    );
  }

  const pushNote = (note: EditorNote) => {
    setUndoStack((stack) => [...stack, notes]);
    setRedoStack([]);
    setNotes((current) => [...current, note]);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Pill>{entry.kind === 'melody' ? 'Melody' : 'Journal'}</Pill>
        {entry.draft ? <Pill tone="help">Draft</Pill> : null}
        {entry.lessonId ? (
          <Link to={`/lesson/${entry.lessonId}`} className="text-sm text-[var(--color-primary)] underline">
            {`From ${entry.lessonId}`}
          </Link>
        ) : null}
      </div>

      <Card className="mb-6">
        <Field id="entry-title" label="Title">
          <input id="entry-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field id="entry-text" label="Practice notes" hint="Plain text. It is stored and displayed as text, never as HTML.">
          <textarea
            id="entry-text"
            rows={5}
            className="w-full rounded-lg border border-[var(--color-line)] p-2"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </Field>
        <Field id="entry-tags" label="Tags" hint="Comma separated.">
          <input id="entry-tags" className={inputClass} value={tags} onChange={(e) => setTags(e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => { save(); store.flush(); }}>Save now</Button>
          <Button
            onClick={() => {
              store.update((draft) => {
                draft.notebook = draft.notebook.filter((e) => e.id !== entry.id);
              }, { immediate: true });
              navigate('/notebook');
            }}
          >
            Delete this entry
          </Button>
        </div>
      </Card>

      {entry.kind === 'melody' ? (
        <Card className="mb-6">
          <SectionHeading>Melody editor</SectionHeading>
          <div className="mb-3 grid gap-3 sm:grid-cols-3">
            <Field id="entry-key" label="Key">
              <select id="entry-key" className={inputClass} value={keyId} onChange={(e) => setKeyId(e.target.value)}>
                {KEYS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
            </Field>
            <Field id="entry-meter" label="Meter">
              <select id="entry-meter" className={inputClass} value={meterId} onChange={(e) => setMeterId(e.target.value)}>
                <option value="4/4">4/4</option>
                <option value="3/4">3/4</option>
                <option value="6/8">6/8</option>
              </select>
            </Field>
            <Field id="entry-tempo" label={`Tempo: ${tempo} BPM`}>
              <input
                id="entry-tempo"
                type="range"
                min={30}
                max={180}
                value={tempo}
                onChange={(e) => setTempo(Number(e.target.value))}
                className="w-full"
              />
            </Field>
          </div>

          <fieldset className="mb-3">
            <legend className="mb-1 text-sm font-medium">Duration of the next note</legend>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((value) => (
                <Button
                  key={value}
                  variant={duration === value ? 'primary' : 'secondary'}
                  onClick={() => setDuration(value)}
                >
                  {`${value} beat${value === 1 ? '' : 's'}`}
                </Button>
              ))}
            </div>
          </fieldset>

          <NoteEntry musicKey={musicKey} lowMidi={48} highMidi={84} onAdd={(midi) => pushNote({ midi, beats: duration })} />

          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => pushNote({ midi: null, beats: duration })}>Add a rest</Button>
            <Button
              disabled={undoStack.length === 0}
              onClick={() => {
                setRedoStack((stack) => [...stack, notes]);
                setNotes(undoStack[undoStack.length - 1]);
                setUndoStack((stack) => stack.slice(0, -1));
              }}
            >
              Undo
            </Button>
            <Button
              disabled={redoStack.length === 0}
              onClick={() => {
                setUndoStack((stack) => [...stack, notes]);
                setNotes(redoStack[redoStack.length - 1]);
                setRedoStack((stack) => stack.slice(0, -1));
              }}
            >
              Redo
            </Button>
            <Button
              disabled={notes.length === 0}
              onClick={() => { setUndoStack((s) => [...s, notes]); setNotes((n) => n.slice(0, -1)); }}
            >
              Delete last
            </Button>
          </div>

          <div className="mt-4">
            <h3 className="mb-2 font-medium">Bars</h3>
            {bars.length === 0 ? <Muted>No notes yet.</Muted> : (
              <ol className="space-y-1 text-sm">
                {bars.map((bar, index) => {
                  const total = barTotals[index];
                  const ok = Math.abs(total - barLength) < 1e-6;
                  return (
                    <li key={index} className={ok ? '' : 'text-[var(--color-accent)]'}>
                      {`Bar ${index + 1}: `}
                      {bar.map((n) => (n.midi === null ? 'rest' : formatPitch(n.midi, musicKey))).join(' ')}
                      {` — ${trimNumber(total)} of ${barLength} beats`}
                      {ok ? '' : ` (${total > barLength ? 'excess' : 'remaining'} ${trimNumber(Math.abs(barLength - total))})`}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {isDraft ? (
            <div className="mt-3">
              <StatusNote kind="warning">
                {notes.length === 0
                  ? 'This melody is empty, so it is saved as a draft. Add notes to enable playback.'
                  : `Bar ${invalidBar + 1} does not add up to ${barLength} beats, so this is saved as a draft and full arrangement playback is disabled until it is repaired.`}
              </StatusNote>
            </div>
          ) : score ? (
            <div className="mt-4">
              <ScorePlayer score={score} showPattern={false} />
              <BeatGrid score={score} labelMode="both" />
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card className="mb-6">
        <SectionHeading>Arrangements</SectionHeading>
        {entry.arrangements.length === 0 ? (
          <Muted>No arrangements saved against this entry yet.</Muted>
        ) : (
          <ul className="space-y-2">
            {entry.arrangements.map((arrangement) => (
              <li key={arrangement.id} className="rounded-lg border border-[var(--color-line)] p-3">
                <p className="font-medium">{arrangement.title}</p>
                <Muted>{`Pattern: ${arrangement.patternId}`}</Muted>
                {arrangement.comment ? <p className="mt-1 text-sm">{arrangement.comment}</p> : null}
                <Button
                  className="mt-2"
                  onClick={() => store.update((draft) => {
                    const index = draft.notebook.findIndex((e) => e.id === entry.id);
                    if (index < 0) return;
                    draft.notebook[index] = {
                      ...draft.notebook[index],
                      arrangements: draft.notebook[index].arrangements.filter((a) => a.id !== arrangement.id),
                      updatedAt: new Date().toISOString(),
                    };
                  }, { immediate: true })}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
        {score ? (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <Field id="arr-title" label="New arrangement name">
              <input
                id="arr-title"
                className={inputClass}
                value={arrangementTitle}
                onChange={(e) => setArrangementTitle(e.target.value)}
              />
            </Field>
            <Field id="arr-pattern" label="Pattern">
              <select
                id="arr-pattern"
                className={inputClass}
                value={patternId}
                onChange={(e) => setPatternId(e.target.value)}
              >
                {patternsForMeter(meter).map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </Field>
            <Button
              variant="primary"
              disabled={!arrangementTitle.trim()}
              onClick={() => {
                store.update((draft) => {
                  const index = draft.notebook.findIndex((e) => e.id === entry.id);
                  if (index < 0) return;
                  draft.notebook[index] = {
                    ...draft.notebook[index],
                    arrangements: [...draft.notebook[index].arrangements, {
                      id: `arr-${Date.now()}`,
                      title: arrangementTitle,
                      chords: score.chords,
                      patternId,
                      comment: '',
                    }],
                    updatedAt: new Date().toISOString(),
                  };
                }, { immediate: true });
                setArrangementTitle('');
              }}
            >
              Add arrangement
            </Button>
          </div>
        ) : null}
      </Card>

      <Card className="print-keep">
        <SectionHeading>Printable worksheet</SectionHeading>
        <Muted className="mb-2">
          {`${title || 'Untitled'} · ${keyName(musicKey)} · ${meterId} · ${tempo} BPM`}
        </Muted>
        {score ? <BeatGrid score={score} labelMode="both" /> : <Muted>Complete the bars to print a worksheet.</Muted>}
        <Button className="mt-2 no-print" onClick={() => window.print()}>Print this entry</Button>
      </Card>
    </div>
  );
}

function formatPitch(midi: number, key: KeySpec): string {
  const pitch = spellInKey(midi, key);
  const accidental = pitch.accidental > 0 ? '#'.repeat(pitch.accidental) : pitch.accidental < 0 ? 'b'.repeat(-pitch.accidental) : '';
  return `${pitch.letter}${accidental}${pitch.octave}`;
}
