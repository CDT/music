import { MusicError, parsePitch } from './pitch';
import type { Meter, NoteEvent, Score, Voice } from './types';

/** Bar length in quarter beats: numerator × 4 / denominator. */
export function barBeats(meter: Meter): number {
  return (meter.numerator * 4) / meter.denominator;
}

export function meterText(meter: Meter): string {
  return `${meter.numerator}/${meter.denominator}`;
}

export function beatsToSeconds(beats: number, tempoQuarterBpm: number): number {
  return (beats * 60) / tempoQuarterBpm;
}

export function secondsToBeats(seconds: number, tempoQuarterBpm: number): number {
  return (seconds * tempoQuarterBpm) / 60;
}

/** Dotted-quarter pulse rate for compound meters. */
export function compoundPulseBpm(tempoQuarterBpm: number): number {
  return (tempoQuarterBpm * 2) / 3;
}

let noteCounter = 0;
export function nextNoteId(prefix = 'n'): string {
  noteCounter += 1;
  return `${prefix}${noteCounter}`;
}

export interface ParseOptions {
  voice?: Voice;
  startBeat?: number;
  idPrefix?: string;
}

/**
 * Parse "C4:1 D4:0.5 r:1 | E4:2" into note events.
 * Durations are quarter-note beats. "|" is decorative and validated separately.
 */
export function parseNotes(text: string, options: ParseOptions = {}): NoteEvent[] {
  const voice = options.voice ?? 'melody';
  const prefix = options.idPrefix ?? 'n';
  let beat = options.startBeat ?? 0;
  const events: NoteEvent[] = [];
  let index = 0;
  for (const rawToken of text.split(/\s+/)) {
    const token = rawToken.trim();
    if (!token || token === '|') continue;
    const [pitchText, durationText] = token.split(':');
    if (durationText === undefined) throw new MusicError(`Token "${token}" is missing its duration`);
    const duration = Number(durationText);
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new MusicError(`Token "${token}" has an invalid duration`);
    }
    const pitch = parsePitch(pitchText);
    index += 1;
    events.push({
      id: `${prefix}-${index}`,
      startBeat: beat,
      durationBeats: duration,
      pitch,
      voice,
    });
    beat += duration;
  }
  return events;
}

export function notesText(events: NoteEvent[]): string {
  return events
    .map((e) => `${e.pitch ? `${e.pitch.letter}${accidentalText(e.pitch.accidental)}${e.pitch.octave}` : 'r'}:${trimNumber(e.durationBeats)}`)
    .join(' ');
}

function accidentalText(accidental: number): string {
  if (accidental === 0) return '';
  return accidental > 0 ? '#'.repeat(accidental) : 'b'.repeat(-accidental);
}

export function trimNumber(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

export function totalBeats(events: NoteEvent[]): number {
  return events.reduce((max, e) => Math.max(max, e.startBeat + e.durationBeats), 0);
}

export interface BarSlice {
  index: number;          // 0-based bar index after any pickup
  startBeat: number;
  beats: number;
  notes: NoteEvent[];
}

/** Split melody events into bars. Pickup beats are bar index -1. */
export function splitIntoBars(score: Score, voice: Voice = 'melody'): BarSlice[] {
  const length = barBeats(score.meter);
  const pickup = score.pickupBeats ?? 0;
  const notes = score.notes.filter((n) => n.voice === voice);
  const bars: BarSlice[] = [];
  if (pickup > 0) {
    bars.push({
      index: -1,
      startBeat: 0,
      beats: pickup,
      notes: notes.filter((n) => n.startBeat < pickup),
    });
  }
  const bodyBeats = score.totalBeats - pickup;
  const count = Math.ceil(bodyBeats / length - 1e-9);
  for (let i = 0; i < count; i += 1) {
    const start = pickup + i * length;
    bars.push({
      index: i,
      startBeat: start,
      beats: length,
      notes: notes.filter((n) => n.startBeat >= start - 1e-9 && n.startBeat < start + length - 1e-9),
    });
  }
  return bars;
}

export interface BarValidation {
  barIndex: number;
  expected: number;
  actual: number;
  ok: boolean;
}

/** Check that every bar's note durations sum to the bar length. */
export function validateBars(score: Score, voice: Voice = 'melody'): BarValidation[] {
  const length = barBeats(score.meter);
  return splitIntoBars(score, voice).map((bar) => {
    const actual = bar.notes.reduce((sum, n) => sum + n.durationBeats, 0);
    const expected = bar.index === -1 ? bar.beats : length;
    return { barIndex: bar.index, expected, actual, ok: Math.abs(actual - expected) < 1e-6 };
  });
}

export function describeDuration(beats: number): string {
  const names: Record<string, string> = {
    '0.25': 'sixteenth',
    '0.5': 'eighth',
    '0.75': 'dotted eighth',
    '1': 'quarter',
    '1.5': 'dotted quarter',
    '2': 'half',
    '3': 'dotted half',
    '4': 'whole',
  };
  return names[trimNumber(beats)] ?? `${trimNumber(beats)} beats`;
}

/** Beat positions of each bar's pulse, used by the metronome and count-ins. */
export function pulsePositions(meter: Meter): number[] {
  if (meter.denominator === 8 && meter.numerator === 6) return [0, 1.5];
  return Array.from({ length: meter.numerator }, (_, i) => i);
}

export function countInBeats(meter: Meter, bars = 1): number {
  return barBeats(meter) * bars;
}
