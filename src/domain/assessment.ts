import { pitchClassOf } from './pitch';

/**
 * Screen-answer comparison only. Nothing here assesses acoustic-piano playing;
 * manual tasks never receive a numeric correctness value.
 */

export interface NoteComparison {
  index: number;
  expected: number | null;
  actual: number | null;
  status: 'correct' | 'too-high' | 'too-low' | 'missing' | 'extra';
  distanceSemitones?: number;
}

export interface PitchSequenceResult {
  metric: 'pitch-sequence';
  correct: number;
  total: number;
  octaveEquivalent: boolean;
  comparisons: NoteComparison[];
  summary: string;
}

/**
 * Compare a submitted pitch sequence with a target by position and length.
 * Missing and extra notes are reported explicitly, never trimmed away.
 */
export function comparePitchSequence(
  expected: number[],
  actual: number[],
  octaveEquivalent = false,
): PitchSequenceResult {
  const length = Math.max(expected.length, actual.length);
  const comparisons: NoteComparison[] = [];
  let correct = 0;

  for (let i = 0; i < length; i += 1) {
    const target = i < expected.length ? expected[i] : null;
    const played = i < actual.length ? actual[i] : null;
    if (target === null) {
      comparisons.push({ index: i, expected: null, actual: played, status: 'extra' });
      continue;
    }
    if (played === null) {
      comparisons.push({ index: i, expected: target, actual: null, status: 'missing' });
      continue;
    }
    const matches = octaveEquivalent
      ? pitchClassOf(target) === pitchClassOf(played)
      : target === played;
    if (matches) {
      correct += 1;
      comparisons.push({ index: i, expected: target, actual: played, status: 'correct', distanceSemitones: 0 });
    } else {
      comparisons.push({
        index: i,
        expected: target,
        actual: played,
        status: played > target ? 'too-high' : 'too-low',
        distanceSemitones: played - target,
      });
    }
  }

  return {
    metric: 'pitch-sequence',
    correct,
    total: expected.length,
    octaveEquivalent,
    comparisons,
    summary: summarisePitchSequence(comparisons, expected.length, octaveEquivalent),
  };
}

function summarisePitchSequence(
  comparisons: NoteComparison[], total: number, octaveEquivalent: boolean,
): string {
  const wrong = comparisons.filter((c) => c.status === 'too-high' || c.status === 'too-low');
  const missing = comparisons.filter((c) => c.status === 'missing').length;
  const extra = comparisons.filter((c) => c.status === 'extra').length;
  const parts: string[] = [];
  const correct = comparisons.filter((c) => c.status === 'correct').length;
  parts.push(`${correct} of ${total} notes matched${octaveEquivalent ? ' by pitch class' : ''}.`);
  if (wrong.length > 0) {
    const first = wrong[0];
    const ordinal = ordinalWord(first.index + 1);
    parts.push(
      `Your ${ordinal} note was ${first.status === 'too-high' ? 'higher' : 'lower'} than the target by ${Math.abs(first.distanceSemitones ?? 0)} semitone${Math.abs(first.distanceSemitones ?? 0) === 1 ? '' : 's'}.`,
    );
  }
  if (missing > 0) parts.push(`${missing} note${missing === 1 ? '' : 's'} were not played.`);
  if (extra > 0) parts.push(`${extra} extra note${extra === 1 ? '' : 's'} were played.`);
  return parts.join(' ');
}

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
export function ordinalWord(n: number): string {
  return ORDINALS[n - 1] ?? `${n}th`;
}

/* ---------- Rhythm ---------- */

export interface RhythmMatch {
  expectedIndex: number | null;
  tapIndex: number | null;
  expectedBeat: number | null;
  actualBeat: number | null;
  deltaBeats?: number;
}

export interface RhythmResult {
  metric: 'rhythm-spacing' | 'beat-aligned';
  scored: boolean;
  correct: number;
  total: number;
  matches: RhythmMatch[];
  unmatchedTaps: number;
  missedOnsets: number;
  summary: string;
}

export interface RhythmOptions {
  mode?: 'spacing' | 'beat-aligned';
  toleranceBeats?: number;
  tempoQuarterBpm: number;
  /** Only used in beat-aligned mode: audio time of the first counted beat. */
  timelineStartMs?: number;
  latencyOffsetMs?: number;
}

/**
 * Compare tapped timestamps with expected onsets.
 * Default spacing mode aligns the first tap to the first onset and compares
 * inter-onset intervals only. A rest-only or single-onset prompt is not scored.
 */
export function compareRhythm(
  expectedOnsetBeats: number[],
  tapTimestampsMs: number[],
  options: RhythmOptions,
): RhythmResult {
  const mode = options.mode ?? 'spacing';
  const tolerance = options.toleranceBeats ?? 0.2;
  const beatMs = 60000 / options.tempoQuarterBpm;

  if (expectedOnsetBeats.length < 2 && mode === 'spacing') {
    return {
      metric: 'rhythm-spacing',
      scored: false,
      correct: 0,
      total: expectedOnsetBeats.length,
      matches: [],
      unmatchedTaps: tapTimestampsMs.length,
      missedOnsets: 0,
      summary: 'This prompt has fewer than two onsets, so spacing cannot be measured. Listen and compare by ear instead.',
    };
  }
  if (tapTimestampsMs.length === 0) {
    return {
      metric: mode === 'spacing' ? 'rhythm-spacing' : 'beat-aligned',
      scored: false,
      correct: 0,
      total: expectedOnsetBeats.length,
      matches: [],
      unmatchedTaps: 0,
      missedOnsets: expectedOnsetBeats.length,
      summary: 'No taps were recorded.',
    };
  }

  let actualBeats: number[];
  if (mode === 'spacing') {
    const origin = tapTimestampsMs[0];
    actualBeats = tapTimestampsMs.map((t) => expectedOnsetBeats[0] + (t - origin) / beatMs);
  } else {
    const start = options.timelineStartMs ?? 0;
    const latency = options.latencyOffsetMs ?? 0;
    actualBeats = tapTimestampsMs.map((t) => (t - start - latency) / beatMs);
  }

  // One-to-one monotonic matching within the tolerance.
  const matches: RhythmMatch[] = [];
  let tapCursor = 0;
  let correct = 0;
  for (let i = 0; i < expectedOnsetBeats.length; i += 1) {
    const expected = expectedOnsetBeats[i];
    let bestIndex = -1;
    let bestDelta = Infinity;
    for (let j = tapCursor; j < actualBeats.length; j += 1) {
      const delta = Math.abs(actualBeats[j] - expected);
      if (delta < bestDelta) { bestDelta = delta; bestIndex = j; }
      if (actualBeats[j] > expected + tolerance) break;
    }
    if (bestIndex >= 0 && bestDelta <= tolerance) {
      matches.push({
        expectedIndex: i,
        tapIndex: bestIndex,
        expectedBeat: expected,
        actualBeat: actualBeats[bestIndex],
        deltaBeats: actualBeats[bestIndex] - expected,
      });
      tapCursor = bestIndex + 1;
      correct += 1;
    } else {
      matches.push({ expectedIndex: i, tapIndex: null, expectedBeat: expected, actualBeat: null });
    }
  }
  const matchedTaps = new Set(matches.map((m) => m.tapIndex).filter((v): v is number => v !== null));
  const unmatchedTaps = actualBeats.length - matchedTaps.size;
  for (let j = 0; j < actualBeats.length; j += 1) {
    if (!matchedTaps.has(j)) {
      matches.push({ expectedIndex: null, tapIndex: j, expectedBeat: null, actualBeat: actualBeats[j] });
    }
  }
  const missedOnsets = matches.filter((m) => m.expectedIndex !== null && m.tapIndex === null).length;

  const label = mode === 'spacing' ? 'Rhythm spacing' : 'Beat-aligned rhythm';
  const summary = [
    `${label}: ${correct} of ${expectedOnsetBeats.length} onsets matched within ${tolerance} of a beat.`,
    missedOnsets > 0 ? `${missedOnsets} expected onset${missedOnsets === 1 ? '' : 's'} had no tap nearby.` : '',
    unmatchedTaps > 0 ? `${unmatchedTaps} extra tap${unmatchedTaps === 1 ? '' : 's'} did not line up with an onset.` : '',
    expectedOnsetBeats.length < 4 ? 'This is a very short sample, so read it as a description rather than a proficiency measure.' : '',
  ].filter(Boolean).join(' ');

  return {
    metric: mode === 'spacing' ? 'rhythm-spacing' : 'beat-aligned',
    scored: true,
    correct,
    total: expectedOnsetBeats.length,
    matches,
    unmatchedTaps,
    missedOnsets,
    summary,
  };
}

/* ---------- Multiple choice ---------- */

export interface ChoiceResult {
  metric: 'choice';
  correct: number;
  total: number;
  chosenId: string;
  answerId: string;
  isCorrect: boolean;
  summary: string;
}

export function compareChoice(chosenId: string, answerId: string, explanation?: string): ChoiceResult {
  const isCorrect = chosenId === answerId;
  return {
    metric: 'choice',
    correct: isCorrect ? 1 : 0,
    total: 1,
    chosenId,
    answerId,
    isCorrect,
    summary: isCorrect
      ? `That matches what sounded.${explanation ? ` ${explanation}` : ''}`
      : `That is not what sounded this time.${explanation ? ` ${explanation}` : ''} Listen again and compare the two options directly.`,
  };
}

/** An attempt is assisted when any hint was opened or the answer was revealed. */
export function isAssisted(hints: string[]): boolean {
  return hints.length > 0;
}
