import type { Meter } from '../domain/types';

export type PatternTarget =
  | { kind: 'chord' }                 // whole compact voicing
  | { kind: 'bass' }                  // bass root
  | { kind: 'index'; index: number }  // voicing tone by index
  | { kind: 'fifth' }
  | { kind: 'upper-root' };

export interface PatternEvent {
  /** Offset in quarter beats from the start of the bar. */
  offset: number;
  durationBeats: number;
  target: PatternTarget;
  accent?: boolean;
}

export interface AccompanimentPattern {
  id: string;
  label: string;
  description: string;
  /** Meters this pattern may be used in. */
  meters: Array<`${number}/${4 | 8}`>;
  events: PatternEvent[];
  /** Held patterns retrigger at every chord change instead of using offsets. */
  sustained?: boolean;
}

const chord = (offset: number, durationBeats: number, accent?: boolean): PatternEvent => ({
  offset, durationBeats, target: { kind: 'chord' }, accent,
});
const bass = (offset: number, durationBeats: number, accent?: boolean): PatternEvent => ({
  offset, durationBeats, target: { kind: 'bass' }, accent,
});
const tone = (offset: number, durationBeats: number, index: number, accent?: boolean): PatternEvent => ({
  offset, durationBeats, target: { kind: 'index', index }, accent,
});

export const PATTERNS: AccompanimentPattern[] = [
  {
    id: 'held',
    label: 'Held chord',
    description: 'One full compact chord at each change, held until the next change or the bar end.',
    meters: ['4/4', '3/4', '6/8'],
    sustained: true,
    events: [chord(0, 4)],
  },
  {
    id: 'block',
    label: 'Block chords',
    description: 'The full compact chord on beats 1 and 3.',
    meters: ['4/4'],
    events: [chord(0, 1.8, true), chord(2, 1.8)],
  },
  {
    id: 'bass-chord',
    label: 'Bass and chord',
    description: 'Bass root on beats 1 and 3, compact chord on beats 2 and 4.',
    meters: ['4/4'],
    events: [bass(0, 0.9, true), chord(1, 0.8), bass(2, 0.9), chord(3, 0.8)],
  },
  {
    id: 'compact-broken',
    label: 'Compact broken chord',
    description: 'Voicing tones 1–2–3–2, one per beat, inside a small hand position.',
    meters: ['4/4'],
    events: [tone(0, 0.9, 0, true), tone(1, 0.9, 1), tone(2, 0.9, 2), tone(3, 0.9, 1)],
  },
  {
    id: 'open-broken',
    label: 'Open broken chord',
    description: 'Root, fifth, upper root, fifth — a wider, flowing shape.',
    meters: ['4/4'],
    events: [
      { offset: 0, durationBeats: 0.9, target: { kind: 'bass' }, accent: true },
      { offset: 1, durationBeats: 0.9, target: { kind: 'fifth' } },
      { offset: 2, durationBeats: 0.9, target: { kind: 'upper-root' } },
      { offset: 3, durationBeats: 0.9, target: { kind: 'fifth' } },
    ],
  },
  {
    id: 'alberti',
    label: 'Alberti figure',
    description: 'Low, high, middle, high in eighth notes — a classical keyboard texture.',
    meters: ['4/4'],
    events: [
      tone(0, 0.45, 0, true), tone(0.5, 0.45, 2), tone(1, 0.45, 1), tone(1.5, 0.45, 2),
      tone(2, 0.45, 0), tone(2.5, 0.45, 2), tone(3, 0.45, 1), tone(3.5, 0.45, 2),
    ],
  },
  {
    id: 'waltz',
    label: 'Waltz',
    description: 'Bass on beat 1, chord on beats 2 and 3.',
    meters: ['3/4'],
    events: [bass(0, 0.9, true), chord(1, 0.8), chord(2, 0.8)],
  },
  {
    id: 'gentle-six',
    label: 'Gentle six-eight',
    description: 'Six flowing eighths grouped as two dotted-quarter pulses.',
    meters: ['6/8'],
    events: [
      tone(0, 0.45, 0, true), tone(0.5, 0.45, 1), tone(1, 0.45, 2),
      { offset: 1.5, durationBeats: 0.45, target: { kind: 'fifth' }, accent: true },
      tone(2, 0.45, 1), tone(2.5, 0.45, 2),
    ],
  },
  {
    id: 'pop-offbeat',
    label: 'Pop offbeat',
    description: 'Bass on beats 1 and 3 with chords on the offbeats.',
    meters: ['4/4'],
    events: [
      bass(0, 0.8, true), chord(0.5, 0.4), chord(1.5, 0.4),
      bass(2, 0.8), chord(2.5, 0.4), chord(3.5, 0.4),
    ],
  },
];

export function patternById(id: string): AccompanimentPattern {
  const found = PATTERNS.find((p) => p.id === id);
  if (!found) throw new Error(`Unknown accompaniment pattern "${id}"`);
  return found;
}

export function meterKey(meter: Meter): `${number}/${4 | 8}` {
  return `${meter.numerator}/${meter.denominator}` as `${number}/${4 | 8}`;
}

export function patternsForMeter(meter: Meter): AccompanimentPattern[] {
  const key = meterKey(meter);
  return PATTERNS.filter((p) => p.meters.includes(key));
}

export function patternSupportsMeter(pattern: AccompanimentPattern, meter: Meter): boolean {
  return pattern.meters.includes(meterKey(meter));
}
