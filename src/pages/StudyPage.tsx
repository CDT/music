import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { studyById } from '../content/studies';
import { patternsForMeter } from '../content/patterns';
import { TransposeRangeError, majorKey, minorKey, sliceBars, transposeScore, withChords } from '../domain/score';
import { keyName } from '../domain/pitch';
import { barBeats, meterText } from '../domain/rhythm';
import { useStore } from '../app/use-store';
import { ScorePlayer } from '../features/transport/ScorePlayer';
import { BeatGrid } from '../features/notation/BeatGrid';
import { Staff } from '../features/notation/Staff';
import { Button, Card, Muted, Pill, SectionHeading, StatusNote, inputClass } from '../components/ui';
import type { KeySpec, Score } from '../domain/types';

const TARGET_KEYS: Array<{ id: string; label: string; key: KeySpec }> = [
  { id: 'C', label: 'C major', key: majorKey('C') },
  { id: 'G', label: 'G major', key: majorKey('G') },
  { id: 'F', label: 'F major', key: majorKey('F') },
  { id: 'D', label: 'D major', key: majorKey('D') },
  { id: 'Am', label: 'A minor', key: minorKey('A') },
];

export function StudyPage() {
  const { studyId } = useParams();
  const [params, setParams] = useSearchParams();
  const { store } = useStore();
  const study = studyId ? studyById(studyId) : undefined;

  const [chunkStart, setChunkStart] = useState(1);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [useAlternate, setUseAlternate] = useState(false);
  const [comment, setComment] = useState('');
  const [saved, setSaved] = useState(false);
  const targetKeyId = params.get('key') ?? '';

  const patternId = params.get('pattern') ?? (study?.suggestedPatterns[0] ?? 'held');

  const baseScore: Score | null = useMemo(() => {
    if (!study) return null;
    const variant = study.variants?.find((v) => v.id === variantId);
    let score = variant ? variant.score : study.score;
    if (useAlternate && study.alternateChords) {
      score = withChords(score, study.alternateChords.bars, `${score.id}-alt`);
    }
    return score;
  }, [study, variantId, useAlternate]);

  const transposed = useMemo(() => {
    if (!baseScore || !targetKeyId) return { score: baseScore, warnings: [] as string[], error: null as string | null };
    const target = TARGET_KEYS.find((k) => k.id === targetKeyId);
    if (!target) return { score: baseScore, warnings: [], error: null };
    if (target.key.mode !== baseScore.key.mode) {
      return {
        score: baseScore,
        warnings: [],
        error: `This study is in a ${baseScore.key.mode} key, so it transposes to other ${baseScore.key.mode} keys. Changing mode would rewrite the music rather than transpose it.`,
      };
    }
    try {
      const result = transposeScore(baseScore, target.key);
      return { score: result.score, warnings: result.warnings, error: null };
    } catch (error) {
      if (error instanceof TransposeRangeError) {
        return {
          score: baseScore,
          warnings: [],
          error: `${error.message} Try shifting the whole phrase ${error.suggestedOctaveShift > 0 ? 'up' : 'down'} an octave instead.`,
        };
      }
      return { score: baseScore, warnings: [], error: String(error) };
    }
  }, [baseScore, targetKeyId]);

  if (!study || !baseScore) {
    return (
      <Card className="reading">
        <SectionHeading>That study could not be found</SectionHeading>
        <p>
          <Link to="/studies" className="text-[var(--color-primary)] underline">Back to the studies</Link>
        </p>
      </Card>
    );
  }

  const score = transposed.score!;
  const barCount = Math.round(score.totalBeats / barBeats(score.meter));
  const chunk = sliceBars(score, chunkStart, Math.min(chunkStart + 1, barCount), `${score.id}-chunk-${chunkStart}`);
  const patterns = patternsForMeter(score.meter);
  const patternOk = patterns.some((p) => p.id === patternId);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Pill>{study.id.toUpperCase()}</Pill>
        <Pill>{keyName(score.key)}</Pill>
        <Pill>{meterText(score.meter)}</Pill>
        <Pill>{`${score.tempoQuarterBpm} BPM`}</Pill>
      </div>
      <h1 className="reading-heading mb-1 text-3xl font-semibold">{study.title}</h1>
      <p className="reading mb-4">{study.teaching}</p>

      <Card className="mb-6">
        <SectionHeading>Listen</SectionHeading>
        <ScorePlayer
          score={score}
          defaultPatternId={patternOk ? patternId : null}
          countInBars={study.countInBars}
        />
        <Muted className="mt-2">
          {study.score.meter.numerator === 3
            ? 'The count-in for this study is one complete three-beat bar, not the default four beats.'
            : 'The count-in is one complete bar.'}
        </Muted>
        <div className="mt-3">
          <Staff score={score} />
          <BeatGrid score={score} labelMode="both" />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeading>Learn by ear in chunks</SectionHeading>
          <Muted className="mb-3">
            Two bars at a time. Listen, sing, then find it. Asking for one chunk never reveals the rest.
          </Muted>
          <div className="mb-3 flex flex-wrap gap-2">
            {Array.from({ length: Math.ceil(barCount / 2) }, (_, i) => i * 2 + 1).map((start) => (
              <Button
                key={start}
                variant={chunkStart === start ? 'primary' : 'secondary'}
                onClick={() => setChunkStart(start)}
              >
                {`Bars ${start}–${Math.min(start + 1, barCount)}`}
              </Button>
            ))}
          </div>
          <ScorePlayer score={chunk} compact countInBars={study.countInBars} />
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-[var(--color-primary)]">
              Show this chunk’s notes
            </summary>
            <BeatGrid score={chunk} labelMode="both" />
          </details>
        </Card>

        <Card>
          <SectionHeading>Accompaniment and mix</SectionHeading>
          <label htmlFor="pattern" className="mb-1 block text-sm font-medium">Pattern</label>
          <select
            id="pattern"
            className={`${inputClass} mb-3`}
            value={patternOk ? patternId : ''}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              next.set('pattern', e.target.value);
              setParams(next, { replace: true });
            }}
          >
            {patterns.map((pattern) => (
              <option key={pattern.id} value={pattern.id}>{`${pattern.label} — ${pattern.description}`}</option>
            ))}
          </select>
          <Muted className="mb-3">
            {`Only patterns compatible with ${meterText(score.meter)} are offered. Incompatible patterns are not silently adapted.`}
          </Muted>
          <p className="mb-2 text-sm font-medium">Audition the layers separately</p>
          <ScorePlayer score={score} defaultPatternId={patternOk ? patternId : null} countInBars={study.countInBars} />
        </Card>

        <Card>
          <SectionHeading>Reference harmony</SectionHeading>
          <table className="chord-table w-full border-collapse text-sm">
            <caption className="sr-only">Reference chord chart</caption>
            <thead>
              <tr>
                <th scope="col" className="border-b border-[var(--color-line)] px-2 py-1 text-left">Bar</th>
                <th scope="col" className="border-b border-[var(--color-line)] px-2 py-1 text-left">Chord</th>
                <th scope="col" className="border-b border-[var(--color-line)] px-2 py-1 text-left">Numeral</th>
              </tr>
            </thead>
            <tbody>
              {score.chords.map((chord) => (
                <tr key={`${chord.startBeat}-${chord.romanLabel}`}>
                  <td className="border-b border-[var(--color-line)] px-2 py-1">
                    {Math.floor(chord.startBeat / barBeats(score.meter)) + 1}
                    {chord.durationBeats < barBeats(score.meter)
                      ? ` (beat ${(chord.startBeat % barBeats(score.meter)) + 1})`
                      : ''}
                  </td>
                  <td className="border-b border-[var(--color-line)] px-2 py-1 font-medium">
                    {`${chord.symbol.root.letter}${chord.symbol.root.accidental > 0 ? '#' : chord.symbol.root.accidental < 0 ? 'b' : ''}${chord.symbol.quality === 'minor' ? 'm' : chord.symbol.quality === 'dominant7' ? '7' : chord.symbol.quality === 'add9' ? 'add9' : chord.symbol.quality === 'diminished' ? '°' : ''}`}
                  </td>
                  <td className="border-b border-[var(--color-line)] px-2 py-1">{chord.romanLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {study.alternateChords ? (
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useAlternate}
                onChange={(e) => setUseAlternate(e.target.checked)}
                className="h-4 w-4"
              />
              {`Use the comparison progression: ${study.alternateChords.label}`}
            </label>
          ) : null}
          {useAlternate && study.alternateChords ? (
            <Muted className="mt-2">{study.alternateChords.comment}</Muted>
          ) : null}
        </Card>

        <Card>
          <SectionHeading>Transpose</SectionHeading>
          <label htmlFor="key" className="mb-1 block text-sm font-medium">Key</label>
          <select
            id="key"
            className={`${inputClass} mb-3`}
            value={targetKeyId}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              if (e.target.value) next.set('key', e.target.value);
              else next.delete('key');
              setParams(next, { replace: true });
            }}
          >
            <option value="">{`Original — ${keyName(study.score.key)}`}</option>
            {TARGET_KEYS.filter((k) => k.key.mode === study.score.key.mode).map((k) => (
              <option key={k.id} value={k.id}>{k.label}</option>
            ))}
          </select>
          {transposed.error ? <StatusNote kind="warning">{transposed.error}</StatusNote> : null}
          {transposed.warnings.map((warning) => (
            <div key={warning} className="mt-2"><StatusNote kind="warning">{warning}</StatusNote></div>
          ))}
          <Muted className="mt-2">
            Melody, bass, chord roots, voicings and displayed degrees all move together. Rhythmic
            values are preserved.
          </Muted>
        </Card>

        {study.variants && study.variants.length > 0 ? (
          <Card>
            <SectionHeading>Named variants</SectionHeading>
            <div className="mb-3 flex flex-wrap gap-2">
              <Button variant={variantId === null ? 'primary' : 'secondary'} onClick={() => setVariantId(null)}>
                Canonical version
              </Button>
              {study.variants.map((variant) => (
                <Button
                  key={variant.id}
                  variant={variantId === variant.id ? 'primary' : 'secondary'}
                  onClick={() => setVariantId(variant.id)}
                >
                  {variant.title}
                </Button>
              ))}
            </div>
            {study.variants.map((variant) => (
              variantId === variant.id ? <Muted key={variant.id}>{variant.description}</Muted> : null
            ))}
          </Card>
        ) : null}

        <Card>
          <SectionHeading>Teaching notes</SectionHeading>
          <ul className="list-disc space-y-1 pl-5">
            {study.notes.map((note) => <li key={note}>{note}</li>)}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <SectionHeading>Save an arrangement choice</SectionHeading>
          <label htmlFor="arrangement-comment" className="mb-1 block text-sm font-medium">
            Why did you choose this key, pattern and harmony?
          </label>
          <textarea
            id="arrangement-comment"
            rows={3}
            className="w-full rounded-lg border border-[var(--color-line)] p-2"
            value={comment}
            onChange={(e) => { setComment(e.target.value); setSaved(false); }}
            placeholder="For example: the open broken pattern keeps the melody clear, and F suits bar 5's long A."
          />
          <Button
            className="mt-2"
            variant="primary"
            disabled={!comment.trim()}
            onClick={() => {
              const now = new Date().toISOString();
              store.update((draft) => {
                draft.notebook.push({
                  id: `nb-${Date.now()}`,
                  title: `${study.title} arrangement`,
                  kind: 'journal',
                  text: comment,
                  tags: [`study:${study.id}`, 'arrangement'],
                  draft: false,
                  arrangements: [{
                    id: `arr-${Date.now()}`,
                    title: `${keyName(score.key)} · ${patternOk ? patternId : 'no pattern'}${useAlternate ? ' · comparison harmony' : ''}`,
                    chords: score.chords,
                    patternId: patternOk ? patternId : 'held',
                    comment,
                  }],
                  createdAt: now,
                  updatedAt: now,
                });
              }, { immediate: true });
              setComment('');
              setSaved(true);
            }}
          >
            Save to notebook
          </Button>
          {saved ? <div className="mt-2"><StatusNote kind="success">Saved to your notebook.</StatusNote></div> : null}
        </Card>
      </div>
    </div>
  );
}
