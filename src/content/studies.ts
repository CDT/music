import { buildScore, majorKey, minorKey } from '../domain/score';
import type { Score } from '../domain/types';

export interface Study {
  id: string;
  title: string;
  subtitle: string;
  score: Score;
  teaching: string;
  notes: string[];
  /** Patterns that suit this study's meter and texture. */
  suggestedPatterns: string[];
  alternateChords?: { label: string; bars: string[]; comment: string };
  variants?: Array<{ id: string; title: string; description: string; score: Score }>;
  countInBars: 1 | 2;
}

const S01 = buildScore({
  id: 's01',
  title: 'First Light',
  key: majorKey('C'),
  meter: { numerator: 4, denominator: 4 },
  tempoQuarterBpm: 60,
  bars: [
    'C4:1 D4:1 E4:1 G4:1',
    'A4:2 G4:1 E4:1',
    'F4:1 E4:1 D4:1 C4:1',
    'D4:2 G4:2',
    'A4:1 A4:1 G4:2',
    'E4:1 D4:1 C4:2',
    'D4:1 G4:1 B4:1 G4:1',
    'E4:1 D4:1 C4:2',
  ],
  chords: ['C', 'Am', 'F', 'G', 'F', 'C', 'G', 'C'],
});

const S02 = buildScore({
  id: 's02',
  title: 'Small Steps',
  key: majorKey('C'),
  meter: { numerator: 4, denominator: 4 },
  tempoQuarterBpm: 68,
  bars: [
    'E4:1 E4:0.5 G4:0.5 G4:1 E4:1',
    'A4:1 G4:1 E4:2',
    'F4:1 A4:1 G4:1 F4:1',
    'D4:2 r:1 G4:1',
    'E4:1 G4:1 C5:1 B4:1',
    'A4:2 E4:1 G4:1',
    'A4:1 F4:1 D4:1 B4:1',
    'C5:3 r:1',
  ],
  chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'F G', 'C'],
});

const S03 = buildScore({
  id: 's03',
  title: 'Evening Window',
  key: minorKey('A'),
  meter: { numerator: 4, denominator: 4 },
  tempoQuarterBpm: 58,
  bars: [
    'A4:1 C5:1 B4:1 A4:1',
    'F4:1 A4:1 D5:2',
    'B4:1 G#4:1 E4:2',
    'A4:3 r:1',
    'C5:1 A4:1 F4:2',
    'A4:1 F4:1 D4:2',
    'E4:1 G#4:1 B4:1 G#4:1',
    'A4:4',
  ],
  chords: ['Am', 'Dm', 'E', 'Am', 'F', 'Dm', 'E', 'Am'],
});

const S04 = buildScore({
  id: 's04',
  title: 'Little Waltz',
  key: majorKey('C'),
  meter: { numerator: 3, denominator: 4 },
  tempoQuarterBpm: 72,
  bars: [
    'E4:1 G4:1 C5:1',
    'B4:2 G4:1',
    'E4:1 G4:1 E4:1',
    'D4:3',
    'F4:1 A4:1 C5:1',
    'G4:2 E4:1',
    'D4:1 G4:1 B4:1',
    'C5:3',
  ],
  chords: ['C', 'G', 'C', 'G', 'F', 'C', 'G', 'C'],
});

const S05 = buildScore({
  id: 's05',
  title: 'Skyward Letter',
  key: majorKey('C'),
  meter: { numerator: 4, denominator: 4 },
  tempoQuarterBpm: 64,
  bars: [
    'A4:1 G4:1 F4:1 A4:1',
    'B4:1 A4:1 G4:2',
    'G4:1 B4:1 E5:2',
    'C5:1 B4:1 A4:2',
    'F4:1 A4:1 D5:2',
    'B4:1 A4:1 G4:1 D5:1',
    'E5:2 D5:1 C5:1',
    'C5:3 r:1',
  ],
  chords: ['F', 'G', 'Em', 'Am', 'Dm', 'G', 'C', 'C'],
});

const S05_ADD9 = buildScore({
  id: 's05-add9',
  title: 'Skyward Letter (added ninth ending)',
  key: majorKey('C'),
  meter: { numerator: 4, denominator: 4 },
  tempoQuarterBpm: 64,
  bars: [
    'A4:1 G4:1 F4:1 A4:1',
    'B4:1 A4:1 G4:2',
    'G4:1 B4:1 E5:2',
    'C5:1 B4:1 A4:2',
    'F4:1 A4:1 D5:2',
    'B4:1 A4:1 G4:1 D5:1',
    'E5:2 D5:1 C5:1',
    'C5:3 r:1',
  ],
  chords: ['F', 'G', 'Em', 'Am', 'Dm', 'G', 'Cadd9', 'Cadd9'],
});

const S06 = buildScore({
  id: 's06',
  title: 'Ground and Wings',
  key: majorKey('D'),
  meter: { numerator: 4, denominator: 4 },
  tempoQuarterBpm: 60,
  bars: [
    'F#4:1 A4:1 F#4:1 E4:1',
    'E4:1 C#4:1 E4:2',
    'F#4:1 B4:1 A4:1 F#4:1',
    'A4:2 F#4:1 C#4:1',
    'B4:1 A4:1 G4:2',
    'F#4:1 E4:1 D4:2',
    'G4:1 B4:1 A4:1 G4:1',
    'E4:1 C#4:1 E4:2',
  ],
  chords: ['D', 'A', 'Bm', 'F#m', 'G', 'D', 'G', 'A'],
});

const S06_ENDING = buildScore({
  id: 's06-ending',
  title: 'Ground and Wings (nine-bar ending)',
  key: majorKey('D'),
  meter: { numerator: 4, denominator: 4 },
  tempoQuarterBpm: 60,
  bars: [
    'F#4:1 A4:1 F#4:1 E4:1',
    'E4:1 C#4:1 E4:2',
    'F#4:1 B4:1 A4:1 F#4:1',
    'A4:2 F#4:1 C#4:1',
    'B4:1 A4:1 G4:2',
    'F#4:1 E4:1 D4:2',
    'G4:1 B4:1 A4:1 G4:1',
    'E4:1 C#4:1 E4:2',
    'D5:4',
  ],
  chords: ['D', 'A', 'Bm', 'F#m', 'G', 'D', 'G', 'A', 'D'],
});

export const STUDIES: Study[] = [
  {
    id: 's01',
    title: 'First Light',
    subtitle: 'C major · 4/4 · 60 BPM · eight bars',
    score: S01,
    teaching: 'Contour, two-bar memory, question and answer, a first harmonization, and transposition.',
    notes: [
      "Bar 3's connecting tones show that one chord can support several melodic pitches.",
      'Bars 5–8 are the first harmony worksheet.',
      'Am–C–G–C is an acceptable comparison progression for bars 5–8.',
    ],
    suggestedPatterns: ['held', 'block', 'bass-chord', 'compact-broken', 'open-broken', 'alberti', 'pop-offbeat'],
    alternateChords: {
      label: 'Am–C–G–C for bars 5–8',
      bars: ['C', 'Am', 'F', 'G', 'Am', 'C', 'G', 'C'],
      comment: 'A minor also contains the sustained A of bar 5. Hear both before choosing.',
    },
    countInBars: 1,
  },
  {
    id: 's02',
    title: 'Small Steps',
    subtitle: 'C major · 4/4 · 68 BPM · eight bars',
    score: S02,
    teaching: 'Pop phrasing, an eighth-note pair, a rest, and a mid-bar chord change.',
    notes: [
      'In bar 7, F occupies beats 1–2 and G beats 3–4 — the change lands at quarter beat 26 from the score start.',
      'Keep the melody rhythm intact when you change accompaniment.',
      'Split sustained accompaniment at the mid-bar change rather than holding F across it.',
    ],
    suggestedPatterns: ['held', 'block', 'bass-chord', 'open-broken', 'pop-offbeat'],
    countInBars: 1,
  },
  {
    id: 's03',
    title: 'Evening Window',
    subtitle: 'A minor · 4/4 · 58 BPM · eight bars',
    score: S03,
    teaching: 'A minor tonic, iv–V–i, and the raised seventh.',
    notes: [
      'G# is spelled as G#, never Ab.',
      'The reference scale shows natural G; G# appears in the melody as an explicit alteration at the E chords.',
      'Compare the final E–Am with Em–Am and record what you hear rather than declaring a winner.',
    ],
    suggestedPatterns: ['held', 'block', 'bass-chord', 'compact-broken', 'open-broken'],
    countInBars: 1,
  },
  {
    id: 's04',
    title: 'Little Waltz',
    subtitle: 'C major · 3/4 · 72 BPM · eight bars',
    score: S04,
    teaching: 'Three-beat grouping, bass–chord–chord accompaniment, and phrase closure.',
    notes: [
      'Count one complete three-beat bar as the count-in; the default four-beat count-in does not belong here.',
      'Only the waltz and held patterns are compatible with 3/4.',
    ],
    suggestedPatterns: ['waltz', 'held'],
    countInBars: 1,
  },
  {
    id: 's05',
    title: 'Skyward Letter',
    subtitle: 'C major · 4/4 · 64 BPM · eight bars',
    score: S05,
    teaching: 'Lyrical contour, IV–V–iii–vi and ii–V–I, texture, and long-note phrasing.',
    notes: [
      'iii is Em in C major. add9 means an added D above a C triad, with no seventh implied.',
      'This is an original study. It is not a transcription of any soundtrack and the progression is not universal to any genre.',
    ],
    suggestedPatterns: ['held', 'block', 'bass-chord', 'compact-broken', 'open-broken', 'alberti'],
    variants: [
      {
        id: 's05-add9',
        title: 'Added ninth ending',
        description: 'The final tonic bars use Cadd9 = C–E–G–D. Audition it and decide whether the added colour helps.',
        score: S05_ADD9,
      },
    ],
    countInBars: 1,
  },
  {
    id: 's06',
    title: 'Ground and Wings',
    subtitle: 'D major · 4/4 · 60 BPM · eight bars',
    score: S06,
    teaching: 'A familiar harmonic ground, target tones, variation, and D-to-C transposition.',
    notes: [
      'The eight-bar loop ends on V (A). It has not closed on the tonic; that is deliberate.',
      'This melody is a new exercise written over the harmonic sequence. It is not a transcription of Canon in D or of any particular arrangement.',
      'The optional ninth-bar ending is stored as a named variant, not as a change to the canonical eight bars.',
    ],
    suggestedPatterns: ['held', 'block', 'bass-chord', 'compact-broken', 'open-broken', 'alberti'],
    variants: [
      {
        id: 's06-ending',
        title: 'Nine-bar standalone ending',
        description: 'Appends a ninth bar of D harmony with D5 held for four beats, so the phrase can close on its own.',
        score: S06_ENDING,
      },
    ],
    countInBars: 1,
  },
];

export const STUDY_SCORES: Score[] = [
  S01, S02, S03, S04, S05, S05_ADD9, S06, S06_ENDING,
];

export function studyById(id: string): Study | undefined {
  return STUDIES.find((s) => s.id === id);
}
