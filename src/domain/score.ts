import {
  MusicError, keyPrefersFlats, makePitch, midiFor, pitchClassName, pitchClassOf,
  scalePitchClasses, spellInKey,
} from './pitch';
import { chordSymbolText, parseChordSymbol, romanFor } from './harmony';
import { barBeats, parseNotes, totalBeats, validateBars } from './rhythm';
import type {
  ChordEvent, ChordSymbol, KeySpec, Meter, NoteEvent, Pitch, PitchClassSpec, Score,
} from './types';

export interface ScoreInput {
  id: string;
  title: string;
  key: KeySpec;
  meter: Meter;
  tempoQuarterBpm: number;
  /** Bars of "pitch:duration" tokens, one string per bar. */
  bars: string[];
  /** One entry per bar, or "F G" for two chords splitting the bar evenly. */
  chords?: string[];
  /** Tokens sounding before the first complete bar, modelled separately. */
  pickup?: string;
  pickupBeats?: number;
  origin?: Score['origin'];
}

export function majorKey(name: string): KeySpec {
  return { tonic: parsePitchClassSpec(name), mode: 'major' };
}

export function minorKey(name: string): KeySpec {
  return { tonic: parsePitchClassSpec(name), mode: 'minor' };
}

export function parsePitchClassSpec(name: string): PitchClassSpec {
  const match = /^([A-G])(bb|##|[b#]?)$/.exec(name.trim());
  if (!match) throw new MusicError(`Cannot parse pitch class "${name}"`);
  const accidental = ({ '': 0, '#': 1, '##': 2, b: -1, bb: -2 } as const)[
    match[2] as '' | '#' | '##' | 'b' | 'bb'
  ];
  return { letter: match[1] as PitchClassSpec['letter'], accidental };
}

/** Build a validated score from authored bar strings. */
export function buildScore(input: ScoreInput): Score {
  const length = barBeats(input.meter);
  const notes: NoteEvent[] = [];
  const pickupEvents = input.pickup
    ? parseNotes(input.pickup, { startBeat: 0, idPrefix: `${input.id}-pickup` })
    : [];
  const pickupBeats = input.pickup
    ? pickupEvents.reduce((total, e) => total + e.durationBeats, 0)
    : (input.pickupBeats ?? 0);
  if (input.pickup && input.pickupBeats !== undefined && Math.abs(pickupBeats - input.pickupBeats) > 1e-6) {
    throw new MusicError(`${input.id}: pickup notes total ${pickupBeats}, not the declared ${input.pickupBeats}`);
  }
  if (pickupBeats >= length) {
    throw new MusicError(`${input.id}: a pickup must be shorter than one bar`);
  }
  notes.push(...pickupEvents);
  let beat = pickupBeats;
  input.bars.forEach((bar, index) => {
    const events = parseNotes(bar, { startBeat: beat, idPrefix: `${input.id}-b${index + 1}` });
    const sum = events.reduce((total, e) => total + e.durationBeats, 0);
    if (Math.abs(sum - length) > 1e-6) {
      throw new MusicError(
        `${input.id} bar ${index + 1} totals ${sum} quarter beats, expected ${length}`,
      );
    }
    notes.push(...events);
    beat += length;
  });

  const chords: ChordEvent[] = [];
  if (input.chords) {
    if (input.chords.length !== input.bars.length) {
      throw new MusicError(`${input.id}: chord list must cover every bar`);
    }
    input.chords.forEach((text, index) => {
      const parts = text.trim().split(/\s+/);
      const slice = length / parts.length;
      parts.forEach((part, partIndex) => {
        const symbol = parseChordSymbol(part);
        // The first chord also covers any pickup, so the chart has no gap.
        const isFirst = index === 0 && partIndex === 0;
        const start = pickupBeats + index * length + partIndex * slice;
        chords.push({
          startBeat: isFirst ? start - pickupBeats : start,
          durationBeats: isFirst ? slice + pickupBeats : slice,
          symbol,
          romanLabel: romanFor(symbol, input.key),
        });
      });
    });
  }

  const score: Score = {
    id: input.id,
    title: input.title,
    key: input.key,
    meter: input.meter,
    tempoQuarterBpm: input.tempoQuarterBpm,
    totalBeats: Math.max(totalBeats(notes), pickupBeats + input.bars.length * length),
    notes,
    chords,
    origin: input.origin ?? 'guide-original',
  };
  if (pickupBeats > 0) score.pickupBeats = pickupBeats;
  return score;
}

export function chordAt(score: Score, beat: number): ChordEvent | null {
  return (
    score.chords.find(
      (c) => beat >= c.startBeat - 1e-9 && beat < c.startBeat + c.durationBeats - 1e-9,
    ) ?? null
  );
}

/** Chord change positions in beats, including the first chord. */
export function chordChangeBeats(score: Score): number[] {
  return score.chords.map((c) => c.startBeat);
}

export interface TransposeResult {
  score: Score;
  warnings: string[];
}

export class TransposeRangeError extends MusicError {
  readonly suggestedOctaveShift: number;
  constructor(message: string, suggestedOctaveShift: number) {
    super(message);
    this.suggestedOctaveShift = suggestedOctaveShift;
  }
}

const MIN_MELODY_MIDI = 36;
const MAX_MELODY_MIDI = 96;

/**
 * Transpose a whole score to a new key. Melody, bass, chord roots, voicings,
 * key and displayed degrees all move together; rhythmic values are preserved.
 */
export function transposeScore(score: Score, targetKey: KeySpec, extraOctaves = 0): TransposeResult {
  const fromPc = pitchClassOf(midiFor(score.key.tonic.letter, score.key.tonic.accidental, 4));
  const toPc = pitchClassOf(midiFor(targetKey.tonic.letter, targetKey.tonic.accidental, 4));
  let interval = toPc - fromPc;
  if (interval > 6) interval -= 12;
  if (interval < -6) interval += 12;
  const shift = interval + extraOctaves * 12;

  const warnings: string[] = [];
  const sourceScale = scalePitchClasses(score.key);
  const targetScale = scalePitchClasses(targetKey);

  const movePitch = (pitch: Pitch): Pitch => {
    const midi = pitch.midi + shift;
    if (midi < 0 || midi > 127) {
      throw new TransposeRangeError(
        `Transposing ${score.title} to ${pitchClassName(targetKey.tonic)} moves a note outside the keyboard.`,
        interval > 0 ? -1 : 1,
      );
    }
    // Preserve a note's relationship to the scale, including deliberate alterations.
    const degreeIndex = sourceScale.findIndex(
      (pc) => pc.letter === pitch.letter,
    );
    if (degreeIndex >= 0) {
      const sourceSpec = sourceScale[degreeIndex];
      const alteration = pitch.accidental - sourceSpec.accidental;
      const targetSpec = targetScale[degreeIndex];
      const accidental = targetSpec.accidental + alteration;
      if (accidental >= -2 && accidental <= 2) {
        const octave = Math.round(
          (midi - (midiFor(targetSpec.letter, accidental as Pitch['accidental'], 0))) / 12,
        );
        const candidate = makePitch(targetSpec.letter, accidental as Pitch['accidental'], octave);
        if (candidate.midi === midi) return candidate;
      }
    }
    return spellInKey(midi, targetKey);
  };

  const notes = score.notes.map((note) => ({
    ...note,
    pitch: note.pitch ? movePitch(note.pitch) : null,
  }));

  const outOfRange = notes.filter(
    (n) => n.voice === 'melody' && n.pitch && (n.pitch.midi < MIN_MELODY_MIDI || n.pitch.midi > MAX_MELODY_MIDI),
  );
  if (outOfRange.length > 0) {
    warnings.push(
      `${outOfRange.length} melody note${outOfRange.length > 1 ? 's' : ''} sit outside the comfortable range. Shift the whole phrase an octave instead of moving single notes.`,
    );
  }

  const chords = score.chords.map((chord) => {
    const symbol = transposeChordSymbol(chord.symbol, score.key, targetKey, shift);
    return {
      startBeat: chord.startBeat,
      durationBeats: chord.durationBeats,
      symbol,
      romanLabel: romanFor(symbol, targetKey),
      voicing: chord.voicing?.map(movePitch),
    };
  });

  return {
    score: {
      ...score,
      id: `${score.id}-${pitchClassName(targetKey.tonic)}${targetKey.mode === 'minor' ? 'm' : ''}`,
      key: targetKey,
      notes,
      chords,
    },
    warnings,
  };
}

function transposeChordSymbol(
  symbol: ChordSymbol, fromKey: KeySpec, toKey: KeySpec, shift: number,
): ChordSymbol {
  const move = (spec: PitchClassSpec): PitchClassSpec => {
    const midi = midiFor(spec.letter, spec.accidental, 4) + shift;
    const sourceScale = scalePitchClasses(fromKey);
    const targetScale = scalePitchClasses(toKey);
    const degreeIndex = sourceScale.findIndex((pc) => pc.letter === spec.letter);
    if (degreeIndex >= 0) {
      const alteration = spec.accidental - sourceScale[degreeIndex].accidental;
      const target = targetScale[degreeIndex];
      const accidental = target.accidental + alteration;
      if (accidental >= -2 && accidental <= 2) {
        const candidatePc = pitchClassOf(midiFor(target.letter, accidental as Pitch['accidental'], 4));
        if (candidatePc === pitchClassOf(midi)) {
          return { letter: target.letter, accidental: accidental as Pitch['accidental'] };
        }
      }
    }
    const spelled = spellInKey(pitchClassOf(midi) + 48, toKey);
    return { letter: spelled.letter, accidental: spelled.accidental };
  };
  const out: ChordSymbol = { root: move(symbol.root), quality: symbol.quality };
  if (symbol.bass) out.bass = move(symbol.bass);
  return out;
}

export interface ScoreIssue { scoreId: string; message: string; }

/** Structural validation used by the content test suite. */
export function validateScore(score: Score): ScoreIssue[] {
  const issues: ScoreIssue[] = [];
  const push = (message: string) => issues.push({ scoreId: score.id, message });

  for (const bar of validateBars(score)) {
    if (!bar.ok) {
      push(`bar ${bar.barIndex + 1} totals ${bar.actual} quarter beats, expected ${bar.expected}`);
    }
  }

  for (const note of score.notes) {
    if (note.pitch && midiFor(note.pitch.letter, note.pitch.accidental, note.pitch.octave) !== note.pitch.midi) {
      push(`note ${note.id} spelling and MIDI disagree`);
    }
  }

  const melody = score.notes.filter((n) => n.voice === 'melody').sort((a, b) => a.startBeat - b.startBeat);
  for (let i = 1; i < melody.length; i += 1) {
    const previous = melody[i - 1];
    if (previous.startBeat + previous.durationBeats > melody[i].startBeat + 1e-9) {
      push(`melody notes overlap at beat ${melody[i].startBeat}`);
    }
  }

  const chords = [...score.chords].sort((a, b) => a.startBeat - b.startBeat);
  for (let i = 0; i < chords.length; i += 1) {
    const chord = chords[i];
    if (chord.startBeat < -1e-9 || chord.startBeat + chord.durationBeats > score.totalBeats + 1e-9) {
      push(`chord ${chordSymbolText(chord.symbol)} falls outside the score`);
    }
    if (i > 0) {
      const previous = chords[i - 1];
      if (previous.startBeat + previous.durationBeats > chord.startBeat + 1e-9) {
        push(`chord regions overlap at beat ${chord.startBeat}`);
      }
    }
  }
  if (chords.length > 0) {
    const covered = chords.reduce((sum, c) => sum + c.durationBeats, 0);
    if (Math.abs(covered - score.totalBeats) > 1e-6) {
      push(`chord chart covers ${covered} of ${score.totalBeats} quarter beats`);
    }
  }
  return issues;
}

export function preferredAccidentalText(key: KeySpec): string {
  return keyPrefersFlats(key) ? 'flats' : 'sharps';
}

/**
 * Extract an inclusive 1-based bar range as a standalone score.
 * Note start times are rebased to zero; chord regions are clipped to the slice.
 */
export function sliceBars(score: Score, firstBar: number, lastBar: number, id?: string): Score {
  const length = barBeats(score.meter);
  const pickup = score.pickupBeats ?? 0;
  const start = pickup + (firstBar - 1) * length;
  const end = pickup + lastBar * length;
  const notes = score.notes
    .filter((n) => n.startBeat >= start - 1e-9 && n.startBeat < end - 1e-9)
    .map((n) => ({ ...n, startBeat: n.startBeat - start }));
  const chords = score.chords
    .filter((c) => c.startBeat + c.durationBeats > start + 1e-9 && c.startBeat < end - 1e-9)
    .map((c) => {
      const from = Math.max(c.startBeat, start);
      const to = Math.min(c.startBeat + c.durationBeats, end);
      return { ...c, startBeat: from - start, durationBeats: to - from };
    });
  return {
    ...score,
    id: id ?? `${score.id}-b${firstBar}-${lastBar}`,
    title: `${score.title}, bars ${firstBar}–${lastBar}`,
    totalBeats: end - start,
    notes,
    chords,
  };
}

/** A score containing only the given voices. */
export function withVoices(score: Score, voices: NoteEvent['voice'][], id?: string): Score {
  return {
    ...score,
    id: id ?? `${score.id}-${voices.join('-')}`,
    notes: score.notes.filter((n) => voices.includes(n.voice)),
  };
}

/** Replace the chord chart of a score, one entry per bar (space-separated splits a bar). */
export function withChords(score: Score, bars: string[], id?: string): Score {
  const length = barBeats(score.meter);
  const pickup = score.pickupBeats ?? 0;
  const chords: ChordEvent[] = [];
  bars.forEach((text, index) => {
    const parts = text.trim().split(/\s+/);
    const slice = length / parts.length;
    parts.forEach((part, partIndex) => {
      const symbol = parseChordSymbol(part);
      chords.push({
        startBeat: pickup + index * length + partIndex * slice,
        durationBeats: slice,
        symbol,
        romanLabel: romanFor(symbol, score.key),
      });
    });
  });
  return { ...score, id: id ?? `${score.id}-alt`, chords };
}
