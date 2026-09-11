import { buildScore, majorKey, minorKey, sliceBars, withChords } from '../domain/score';
import type { KeySpec, Meter, Score } from '../domain/types';
import { STUDY_SCORES, STUDIES } from './studies';

const FOUR_FOUR: Meter = { numerator: 4, denominator: 4 };
const C = majorKey('C');
const G = majorKey('G');
const F = majorKey('F');
const D = majorKey('D');
const Am = minorKey('A');

interface ExampleInput {
  id: string;
  title: string;
  bars: string[];
  chords?: string[];
  key?: KeySpec;
  meter?: Meter;
  tempo?: number;
  pickup?: string;
}

function ex(input: ExampleInput): Score {
  return buildScore({
    id: input.id,
    title: input.title,
    key: input.key ?? C,
    meter: input.meter ?? FOUR_FOUR,
    tempoQuarterBpm: input.tempo ?? 60,
    bars: input.bars,
    chords: input.chords,
    pickup: input.pickup,
  });
}

/** Chord-only demonstration: silent melody bars carrying a chord chart. */
function chordDemo(id: string, title: string, chords: string[], key = C, meter = FOUR_FOUR, tempo = 60): Score {
  return buildScore({
    id, title, key, meter, tempoQuarterBpm: tempo,
    bars: chords.map(() => `r:${(meter.numerator * 4) / meter.denominator}`),
    chords,
  });
}

const s01 = STUDY_SCORES[0];
const s02 = STUDY_SCORES[1];
const s04 = STUDY_SCORES[3];
const s05 = STUDY_SCORES[4];
const s06 = STUDY_SCORES[6];

const EXAMPLES: Score[] = [
  /* Module 1 */
  ex({ id: 'ex-m01-l01-a', title: 'Step echo: C–D–C', bars: ['C4:1 D4:1 C4:2'], chords: ['C'] }),
  ex({ id: 'ex-m01-l01-b', title: 'Skip echo: C–E–C', bars: ['C4:1 E4:1 C4:2'], chords: ['C'] }),
  ex({ id: 'ex-m01-l02-a', title: 'Repeat then step', bars: ['C4:1 C4:1 D4:1 C4:1'], chords: ['C'] }),
  ex({ id: 'ex-m01-l02-b', title: 'Leaps through the chord', bars: ['C4:1 E4:1 G4:1 E4:1'], chords: ['C'] }),
  ex({ id: 'ex-m01-l03-a', title: 'A whole small phrase', bars: ['C4:1 D4:1 E4:1 D4:1', 'C4:2 r:2'], chords: ['C', 'C'] }),
  ex({ id: 'ex-m01-l03-b', title: 'A different ending', bars: ['C4:1 D4:1 E4:1 D4:1', 'E4:2 r:2'], chords: ['C', 'C'] }),
  ex({ id: 'ex-m01-l04-a', title: 'Two bars over one held chord', bars: ['C4:1 E4:1 G4:1 E4:1', 'C4:4'], chords: ['C', 'C'] }),
  ex({ id: 'ex-m01-l04-b', title: 'A second phrase ending on C', bars: ['G4:1 E4:1 G4:1 E4:1', 'C4:4'], chords: ['C', 'C'] }),

  /* Module 2 */
  chordDemo('ex-m02-l01-key', 'Establishing C: C–F–G–C', ['C', 'F', 'G', 'C']),
  ex({ id: 'ex-m02-l01-a', title: 'Ending on C', bars: ['E4:1 F4:1 E4:1 D4:1', 'C4:4'], chords: ['C', 'C'] }),
  ex({ id: 'ex-m02-l01-b', title: 'Ending on D', bars: ['E4:1 F4:1 E4:1 C4:1', 'D4:4'], chords: ['C', 'G'] }),
  ex({ id: 'ex-m02-l01-c', title: 'Ending on B', bars: ['E4:1 D4:1 E4:1 C4:1', 'B4:4'], chords: ['C', 'G'] }),
  chordDemo('ex-m02-l01-g', 'Establishing G: G–C–D–G', ['G', 'C', 'D', 'G'], G),
  ex({ id: 'ex-m02-l02-a', title: 'Degrees 1–3–5–3–1 in C', bars: ['C4:1 E4:1 G4:1 E4:1', 'C4:4'], chords: ['C', 'C'] }),
  ex({ id: 'ex-m02-l02-b', title: 'Degrees 1–3–5–3–1 in G', bars: ['G4:1 B4:1 D5:1 B4:1', 'G4:4'], chords: ['G', 'G'], key: G }),
  ex({ id: 'ex-m02-l03-a', title: '1–2–1 and 3–4–3', bars: ['C4:1 D4:1 C4:2', 'E4:1 F4:1 E4:2'], chords: ['C', 'C'] }),
  ex({ id: 'ex-m02-l03-b', title: '1–2–3 and 5–4–3', bars: ['C4:1 D4:1 E4:2', 'G4:1 F4:1 E4:2'], chords: ['C', 'C'] }),
  ex({ id: 'ex-m02-l04-a', title: '6 and 7 in context', bars: ['G4:1 A4:1 B4:1 C5:1', 'B4:1 A4:1 G4:2'], chords: ['C', 'G'] }),
  ex({ id: 'ex-m02-l04-b', title: 'The same ending in G major', bars: ['D5:1 E5:1 F#5:1 G5:1', 'F#5:1 E5:1 D5:2'], chords: ['G', 'D'], key: G }),

  /* Module 3 */
  ex({ id: 'ex-m03-l01-a', title: 'Rhythm 1, 1, 2 on C–D–E', bars: ['C4:1 D4:1 E4:2'], chords: ['C'] }),
  ex({ id: 'ex-m03-l01-b', title: 'Rhythm .5, .5, 1, 2 on C–D–E–G', bars: ['C4:0.5 D4:0.5 E4:1 G4:2'], chords: ['C'] }),
  ex({ id: 'ex-m03-l02-a', title: 'With a rest', bars: ['C4:1 r:1 D4:1 E4:1'], chords: ['C'] }),
  ex({ id: 'ex-m03-l02-b', title: 'With a repeated note', bars: ['C4:1 C4:1 D4:1 E4:1'], chords: ['C'] }),
  ex({ id: 'ex-m03-l02-c', title: 'A one-beat pickup', bars: ['C5:2 B4:1 A4:1'], chords: ['C'], pickup: 'G4:1' }),
  sliceBars(s01, 1, 4, 'ex-m03-l03-q'),
  sliceBars(s01, 5, 8, 'ex-m03-l03-a'),

  /* Module 4 */
  chordDemo('ex-m04-l01-a', 'C major then C minor', ['C', 'Cm']),
  chordDemo('ex-m04-l01-b', 'Four contrasting pairs', ['F', 'Fm', 'G', 'Gm', 'D', 'Dm', 'A', 'Am']),
  ex({ id: 'ex-m04-l02-a', title: 'Over V then I', bars: ['G4:1 B4:1 D5:2', 'E5:1 D5:1 C5:2'], chords: ['G', 'C'] }),
  chordDemo('ex-m04-l02-b', 'C–G–C', ['C', 'G', 'C']),
  chordDemo('ex-m04-l03-a', 'C–F–G–C', ['C', 'F', 'G', 'C']),
  chordDemo('ex-m04-l03-b', 'C–Am–F–G', ['C', 'Am', 'F', 'G']),
  ex({ id: 'ex-m04-l03-c', title: 'The same melody over F, Am and C', bars: ['A4:2 G4:1 E4:1', 'A4:2 G4:1 E4:1', 'A4:2 G4:1 E4:1'], chords: ['F', 'Am', 'C'] }),
  withChords(sliceBars(s01, 5, 8, 'ex-m04-l04-a'), ['F', 'C', 'G', 'C'], 'ex-m04-l04-a'),
  withChords(sliceBars(s01, 5, 8, 'ex-m04-l04-b'), ['Am', 'C', 'G', 'C'], 'ex-m04-l04-b'),

  /* Module 5 */
  chordDemo('ex-m05-l01-a', 'C–F–G–C in compact voicings', ['C', 'F/C', 'G/B', 'C']),
  sliceBars(s02, 1, 4, 'ex-m05-l02-a'),
  chordDemo('ex-m05-l02-b', 'C–Am–F–G', ['C', 'Am', 'F', 'G']),
  sliceBars(s01, 1, 4, 'ex-m05-l03-a'),
  sliceBars(s01, 1, 4, 'ex-m05-l04-a'),

  /* Module 6 */
  ex({ id: 'ex-m06-l01-a', title: 'A motif from C D E G A', bars: ['C4:1 D4:1 E4:2', 'G4:1 E4:1 C4:2'], chords: ['C', 'C'] }),
  ex({ id: 'ex-m06-l02-a', title: 'The original idea', bars: ['C4:1 D4:1 E4:2'], chords: ['C'] }),
  ex({ id: 'ex-m06-l02-b', title: 'Rhythmic variation', bars: ['C4:0.5 C4:0.5 D4:1 E4:2'], chords: ['C'] }),
  ex({ id: 'ex-m06-l02-c', title: 'Ending variation', bars: ['C4:1 D4:1 G4:2'], chords: ['C'] }),
  ex({ id: 'ex-m06-l02-d', title: 'Diatonic sequence one step higher', bars: ['D4:1 E4:1 F4:2'], chords: ['Dm'] }),
  ex({ id: 'ex-m06-l03-a', title: 'Target tones E–E–A–G', bars: ['E4:1 D4:1 E4:2', 'E4:2 r:2', 'A4:1 G4:1 A4:2', 'G4:2 r:2'], chords: ['C', 'Am', 'F', 'G'] }),
  ex({
    id: 'ex-m06-l04-a', title: 'Question and answer',
    bars: ['C4:1 D4:1 E4:2', 'G4:2 E4:2', 'C4:1 D4:1 E4:2', 'D4:4', 'C4:1 D4:1 E4:2', 'G4:2 A4:2', 'G4:1 F4:1 E4:2', 'C4:4'],
    chords: ['C', 'C', 'G', 'G', 'C', 'C', 'G', 'C'],
  }),

  /* Module 7 */
  chordDemo('ex-m07-l01-a', 'A C-major cadence', ['F', 'G', 'C'], C),
  chordDemo('ex-m07-l01-b', 'Am–Dm–Em–Am', ['Am', 'Dm', 'Em', 'Am'], Am),
  ex({ id: 'ex-m07-l01-c', title: 'A as home', bars: ['A4:1 C5:1 E5:1 C5:1', 'A4:4'], chords: ['Am', 'Am'], key: Am, tempo: 58 }),
  chordDemo('ex-m07-l02-a', 'Em–Am then E–Am', ['Em', 'Am', 'E', 'Am'], Am),
  ex({ id: 'ex-m07-l02-b', title: 'The raised seventh resolving', bars: ['B4:1 G#4:1 E4:2', 'A4:4'], chords: ['E', 'Am'], key: Am, tempo: 58 }),
  chordDemo('ex-m07-l03-a', 'Am–F–C–G (i–VI–III–VII)', ['Am', 'F', 'C', 'G'], Am),
  chordDemo('ex-m07-l03-b', 'Am–Dm–E–Am (i–iv–V–i)', ['Am', 'Dm', 'E', 'Am'], Am),
  ex({ id: 'ex-m07-l03-c', title: 'A sustained C over Am and F', bars: ['C5:4', 'C5:4'], chords: ['Am', 'F'], key: Am, tempo: 58 }),

  /* Module 8 */
  sliceBars(s01, 1, 2, 'ex-m08-l01-a'),
  sliceBars(s01, 7, 8, 'ex-m08-l02-a'),
  ex({ id: 'ex-m08-l03-a', title: 'One phrase, two octaves', bars: ['C4:1 D4:1 E4:1 G4:1', 'E4:2 C4:2', 'C5:1 D5:1 E5:1 G5:1', 'E5:2 C5:2'], chords: ['C', 'C', 'C', 'C'] }),
  sliceBars(s01, 5, 8, 'ex-m08-l04-a'),

  /* Module 9 */
  chordDemo('ex-m09-l01-a', 'C/E – F – C/G – G – C', ['C/E', 'F', 'C/G', 'G', 'C']),
  ex({ id: 'ex-m09-l01-b', title: 'The bass line alone', bars: ['E3:4', 'F3:4', 'G3:4', 'G3:4', 'C3:4'], chords: ['C/E', 'F', 'C/G', 'G', 'C'] }),
  ex({ id: 'ex-m09-l02-a', title: 'E–F–G over one C chord', bars: ['E4:1 F4:1 G4:2'], chords: ['C'] }),
  ex({ id: 'ex-m09-l02-b', title: 'The same melody with a chord change on F', bars: ['E4:1 F4:1 G4:2'], chords: ['C F C C'] }),
  ex({ id: 'ex-m09-l02-c', title: 'A sustained F over C, then over F', bars: ['E4:1 F4:2 G4:1', 'E4:1 F4:2 G4:1'], chords: ['C', 'F'] }),
  ex({ id: 'ex-m09-l03-a', title: 'Dm–G7–C with melody', bars: ['F4:2 A4:2', 'B4:2 F4:2', 'E4:2 D4:1 C4:1'], chords: ['Dm', 'G7', 'C'] }),
  withChords(sliceBars(s01, 5, 8, 'ex-m09-l04-a'), ['F', 'C', 'G', 'C'], 'ex-m09-l04-a'),
  withChords(sliceBars(s01, 5, 8, 'ex-m09-l04-b'), ['Dm', 'Am', 'G7', 'C'], 'ex-m09-l04-b'),

  /* Module 10 */
  sliceBars(s04, 1, 4, 'ex-m10-l01-a'),
  sliceBars(s01, 1, 4, 'ex-m10-l01-b'),
  sliceBars(s02, 1, 4, 'ex-m10-l02-a'),
  sliceBars(s05, 1, 4, 'ex-m10-l03-a'),
  sliceBars(s05, 5, 8, 'ex-m10-l03-b'),
  ex({
    id: 'ex-m10-l04-a', title: 'Skyward Letter reduced to melody and roots',
    bars: ['A4:1 G4:1 F4:1 A4:1', 'B4:1 A4:1 G4:2', 'G4:1 B4:1 E5:2', 'C5:1 B4:1 A4:2'],
    chords: ['F', 'G', 'Em', 'Am'], tempo: 64,
  }),

  /* Module 11 */
  chordDemo('ex-m11-l01-a', 'The D-major ground', ['D', 'A', 'Bm', 'F#m', 'G', 'D', 'G', 'A'], D),
  ex({
    id: 'ex-m11-l01-b', title: 'The bass roots alone',
    bars: ['D3:4', 'A2:4', 'B2:4', 'F#2:4', 'G2:4', 'D3:4', 'G2:4', 'A2:4'],
    chords: ['D', 'A', 'Bm', 'F#m', 'G', 'D', 'G', 'A'], key: D,
  }),
  sliceBars(s06, 1, 4, 'ex-m11-l02-a'),
  sliceBars(s06, 5, 8, 'ex-m11-l03-a'),
  chordDemo('ex-m11-l04-a', 'The same ground in C', ['C', 'G', 'Am', 'Em', 'F', 'C', 'F', 'G']),
  ex({ id: 'ex-m11-l04-b', title: 'Two bars of Ground and Wings moved to C', bars: ['E4:1 G4:1 E4:1 D4:1', 'D4:1 B3:1 D4:2'], chords: ['C', 'G'] }),

  /* Module 12 */
  ex({
    id: 'ex-m12-l01-a', title: 'A fresh four-bar phrase',
    bars: ['C4:1 D4:1 E4:1 G4:1', 'F4:1 E4:1 D4:2', 'C4:1 D4:1 E4:1 G4:1', 'D4:1 E4:1 C4:2'],
    chords: ['C', 'F', 'G', 'C'],
  }),
  ex({
    id: 'ex-m12-l01-b', title: 'A second fresh phrase in G',
    bars: ['G4:1 A4:1 B4:1 D5:1', 'C5:1 B4:1 A4:2', 'G4:1 A4:1 B4:1 D5:1', 'A4:1 B4:1 G4:2'],
    chords: ['G', 'C', 'D', 'G'], key: G,
  }),
  ex({
    id: 'ex-m12-l03-a', title: 'A complete miniature',
    bars: [
      'r:2 G3:1 C4:1', 'C4:1 D4:1 E4:2', 'G4:2 E4:2', 'D4:1 E4:1 D4:1 C4:1', 'D4:4',
      'C4:1 D4:1 E4:2', 'G4:2 A4:2', 'G4:1 F4:1 E4:1 D4:1', 'C4:4',
    ],
    chords: ['C', 'C', 'Am', 'F', 'G', 'C', 'Am', 'G', 'C'],
  }),
];

/** Every playable score the app can reference by ID. */
export const SCORE_LIBRARY = new Map<string, Score>();
for (const score of [...STUDY_SCORES, ...EXAMPLES]) {
  if (SCORE_LIBRARY.has(score.id)) {
    throw new Error(`Duplicate score id "${score.id}"`);
  }
  SCORE_LIBRARY.set(score.id, score);
}
for (const study of STUDIES) {
  for (const variant of study.variants ?? []) {
    if (!SCORE_LIBRARY.has(variant.score.id)) SCORE_LIBRARY.set(variant.score.id, variant.score);
  }
}

export function scoreById(id: string): Score | undefined {
  return SCORE_LIBRARY.get(id);
}

export function requireScore(id: string): Score {
  const found = SCORE_LIBRARY.get(id);
  if (!found) throw new Error(`Unknown score "${id}"`);
  return found;
}

export const EXAMPLE_SCORES = EXAMPLES;
export { F, D, G, C, Am };
