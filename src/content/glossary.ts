import type { LessonId } from '../domain/types';

export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  /** A concrete example in C major or A minor. */
  example: string;
  /** Playable score id, when hearing it helps. */
  scoreId?: string;
  chordText?: string;
  lessons: LessonId[];
  tags: string[];
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    id: 'semitone', term: 'Semitone',
    definition: 'The distance to the next piano key, black keys included. Two semitones make a whole tone.',
    example: 'E to F is a semitone; C to D is a whole tone.',
    scoreId: 'ex-m01-l02-a', lessons: ['m01-l02', 'm02-l04'], tags: ['pitch', 'interval'],
  },
  {
    id: 'scale-degree', term: 'Scale degree',
    definition: 'A note described by its position in a key rather than by its letter name. Degree 1 is the tonic.',
    example: 'In C major, C is 1, E is 3 and G is 5. In A minor, C is the lowered third, written b3.',
    scoreId: 'ex-m02-l02-a', lessons: ['m02-l02', 'm02-l03', 'm08-l01'], tags: ['pitch', 'key'],
  },
  {
    id: 'major-scale', term: 'Major scale',
    definition: 'A seven-note collection whose semitone offsets above the tonic are 0, 2, 4, 5, 7, 9, 11.',
    example: 'C major: C D E F G A B.',
    scoreId: 'ex-m02-l04-a', lessons: ['m02-l04', 'm08-l01'], tags: ['key'],
  },
  {
    id: 'natural-minor', term: 'Natural minor',
    definition: 'A seven-note collection with offsets 0, 2, 3, 5, 7, 8, 10 above the tonic.',
    example: 'A natural minor: A B C D E F G.',
    scoreId: 'ex-m07-l01-c', lessons: ['m07-l01'], tags: ['key'],
  },
  {
    id: 'harmonic-minor', term: 'Harmonic minor',
    definition: 'Natural minor with a raised seventh degree, giving a leading note a semitone below the tonic. Real minor-key music moves between these collections.',
    example: 'A harmonic minor raises G to G#, so E major (E–G#–B) becomes available as V.',
    scoreId: 'ex-m07-l02-b', lessons: ['m07-l02'], tags: ['key', 'harmony'],
  },
  {
    id: 'interval', term: 'Interval',
    definition: 'The distance between two notes. Learn direction and key context first; names come later.',
    example: 'C to E is four semitones, a major third. C to G is seven semitones, a perfect fifth.',
    scoreId: 'ex-m01-l02-b', lessons: ['m01-l02'], tags: ['pitch', 'interval'],
  },
  {
    id: 'triad', term: 'Triad',
    definition: 'A three-note chord built from a root, third and fifth. Major is 0–4–7 semitones, minor 0–3–7, diminished 0–3–6.',
    example: 'C major is C–E–G; A minor is A–C–E.',
    chordText: 'C', lessons: ['m04-l01'], tags: ['harmony'],
  },
  {
    id: 'roman-numeral', term: 'Roman numeral',
    definition: 'A label for a chord root relative to the key. Uppercase means major, lowercase minor, ° diminished. It describes the root, not the bass note.',
    example: 'In C major: I, ii, iii, IV, V, vi, vii°.',
    chordText: 'G', lessons: ['m04-l02', 'm07-l03'], tags: ['harmony'],
  },
  {
    id: 'root-and-bass', term: 'Root and bass',
    definition: 'The root names the chord; the bass is its lowest sounding note. They are often, but not always, the same.',
    example: 'C/E is a C major chord with E in the bass. It is not an E major chord.',
    chordText: 'C/E', lessons: ['m05-l01', 'm09-l01'], tags: ['harmony'],
  },
  {
    id: 'inversion', term: 'Inversion',
    definition: 'Root position, first inversion and second inversion put the root, third and fifth in the bass respectively.',
    example: 'C–E–G, E–G–C and G–C–E are the three positions of a C major triad.',
    chordText: 'C/G', lessons: ['m05-l01'], tags: ['harmony', 'voicing'],
  },
  {
    id: 'dominant-seventh', term: 'Dominant seventh (V7)',
    definition: 'A major triad plus a minor seventh above its root. It often creates a strong return to I, though not every seventh chord is a dominant seventh.',
    example: 'In C major, G7 is G–B–D–F.',
    chordText: 'G7', lessons: ['m09-l03'], tags: ['harmony'],
  },
  {
    id: 'cadence', term: 'Cadence',
    definition: 'A phrase-ending gesture. V–I is a strong return; ending on V stays open; IV–I is another closing sound. Exact classical labels also depend on voicing and melody.',
    example: 'G–C at the end of First Light sounds settled.',
    scoreId: 'ex-m04-l02-b', lessons: ['m02-l01', 'm04-l02'], tags: ['harmony', 'phrase'],
  },
  {
    id: 'harmonic-rhythm', term: 'Harmonic rhythm',
    definition: 'How often the chords change. A melody may contain many notes over a single chord.',
    example: 'First Light changes chord once per bar while the melody moves in quarter notes.',
    scoreId: 'ex-m09-l02-a', lessons: ['m09-l02'], tags: ['harmony', 'rhythm'],
  },
  {
    id: 'non-chord-tone', term: 'Passing and neighbour tones',
    definition: 'Melody notes that connect chord tones. A melody note does not force a chord change, and not every accented note must be a chord tone.',
    example: 'In E–F–G over C major, the F passes between two chord tones.',
    scoreId: 'ex-m09-l02-a', lessons: ['m09-l02'], tags: ['harmony', 'melody'],
  },
  {
    id: 'transposition', term: 'Transposition',
    definition: 'Moving music to another key while preserving its relationships. Moving the same white-key shape does not reliably transpose a melody.',
    example: 'C–D–E in C becomes G–A–B in G, which needs F# elsewhere in the key.',
    scoreId: 'ex-m08-l01-a', lessons: ['m08-l01', 'm08-l02', 'm11-l04'], tags: ['key'],
  },
  {
    id: 'audiation', term: 'Audiation / inner hearing',
    definition: 'Imagining musical sound when it is not currently sounding.',
    example: 'Hear C–D–E once, imagine it in silence, then compare it with the piano.',
    scoreId: 'ex-m01-l01-a', lessons: ['m01-l01', 'm01-l03'], tags: ['ear'],
  },
  {
    id: 'contour', term: 'Contour',
    definition: 'The pattern of rising, falling and repeated pitches in a phrase.',
    example: 'C–E–G–E rises then falls.',
    scoreId: 'ex-m01-l02-b', lessons: ['m01-l02'], tags: ['melody'],
  },
  {
    id: 'motif', term: 'Motif',
    definition: 'A short musical idea that can be repeated and varied.',
    example: 'C–D–E is a three-note motif you can move, re-rhythm or re-end.',
    scoreId: 'ex-m06-l02-a', lessons: ['m06-l01', 'm06-l02'], tags: ['melody'],
  },
  {
    id: 'phrase', term: 'Phrase',
    definition: 'A musical thought with a perceived grouping or ending. It need not have a fixed number of bars.',
    example: 'Bars 1–4 of First Light form a question; bars 5–8 answer it.',
    scoreId: 'ex-m03-l03-q', lessons: ['m03-l03', 'm06-l04'], tags: ['melody', 'phrase'],
  },
  {
    id: 'arpeggio', term: 'Arpeggio / broken chord',
    definition: 'Chord notes sounded one after another instead of together.',
    example: 'C–E–G–E played one note per beat.',
    scoreId: 'ex-m05-l03-a', lessons: ['m05-l03'], tags: ['accompaniment'],
  },
  {
    id: 'voicing', term: 'Voicing',
    definition: 'The register, spacing and order of a chord’s tones, including any omissions or doublings.',
    example: 'C3–E3–G3 and E3–G3–C4 are two voicings of the same C major chord.',
    chordText: 'C', lessons: ['m05-l01'], tags: ['harmony', 'voicing'],
  },
  {
    id: 'lead-sheet', term: 'Lead sheet',
    definition: 'A compact representation of melody and chord symbols, sometimes with lyrics. This app’s studies use melody and chords.',
    example: 'First Light: melody plus C | Am | F | G | F | C | G | C.',
    scoreId: 's01', lessons: ['m10-l04'], tags: ['notation'],
  },
  {
    id: 'syncopation', term: 'Syncopation',
    definition: 'Rhythmic emphasis that interacts with the expected beat, often through offbeat attacks or notes sustained across strong beats.',
    example: 'The pop offbeat pattern places chords on each "and".',
    scoreId: 'ex-m10-l02-a', lessons: ['m10-l02'], tags: ['rhythm'],
  },
  {
    id: 'compound-meter', term: 'Compound meter',
    definition: 'Beats divided into three. The 6/8 tool groups six eighth notes as two larger pulses.',
    example: 'In 6/8 at 60 quarter BPM, the dotted-quarter pulse is 40 per minute.',
    lessons: ['m03-l01'], tags: ['rhythm', 'meter'],
  },
  {
    id: 'add9', term: 'Add9 versus sus2',
    definition: 'Cadd9 includes E along with C, G and D. Csus2 replaces the third with D. The required course uses add9 only.',
    example: 'Cadd9 = C–E–G–D.',
    chordText: 'Cadd9', lessons: ['m10-l03'], tags: ['harmony'],
  },
  {
    id: 'relative-parallel', term: 'Relative versus parallel minor',
    definition: 'C major and A minor share a key signature and are relative. C major and C minor share a tonic and are parallel.',
    example: 'A natural minor uses the same seven notes as C major but centres on A.',
    scoreId: 'ex-m07-l01-c', lessons: ['m07-l01'], tags: ['key'],
  },
  {
    id: 'pickup', term: 'Pickup (anacrusis)',
    definition: 'One or more notes before the first complete bar. It is modelled separately, never padded into an unexplained full bar.',
    example: 'A single G4 leading into C5–B4–A4.',
    scoreId: 'ex-m03-l02-c', lessons: ['m03-l02'], tags: ['rhythm'],
  },
  {
    id: 'tonic-predominant-dominant', term: 'Tonic, predominant, dominant',
    definition: 'Common harmonic roles. I and often vi give tonic-related stability; ii and IV tend to lead away; V often points home. These are tendencies, not fixed emotional laws.',
    example: 'C (I) → F (IV) → G (V) → C (I).',
    scoreId: 'ex-m04-l03-a', lessons: ['m04-l02', 'm04-l03'], tags: ['harmony'],
  },
  {
    id: 'improvisation', term: 'Improvising',
    definition: 'Choosing rhythm, repetition, silence, phrase endings and variation in the moment. It is not playing random scale notes.',
    example: 'Repeat a two-bar idea, then change only its ending.',
    scoreId: 'ex-m06-l04-a', lessons: ['m06-l01', 'm06-l04'], tags: ['melody'],
  },
  {
    id: 'diatonic-sequence', term: 'Diatonic sequence',
    definition: 'Repeating an idea a step higher or lower inside the key, so its exact intervals adjust. Chromatic transposition instead preserves semitone distances.',
    example: 'C–D–E becomes D–E–F in C major, where the last step is a semitone.',
    scoreId: 'ex-m06-l02-d', lessons: ['m06-l02'], tags: ['melody'],
  },
  {
    id: 'pentatonic', term: 'Major pentatonic',
    definition: 'A five-note collection: degrees 1, 2, 3, 5 and 6. It is a useful starting set, not a promise that every note suits every chord.',
    example: 'In C: C, D, E, G and A.',
    scoreId: 'ex-m06-l01-a', lessons: ['m06-l01'], tags: ['melody'],
  },
  {
    id: 'texture', term: 'Texture',
    definition: 'How many layers sound and how they are spaced — here, melody plus an accompaniment pattern.',
    example: 'Waltz texture: bass on beat 1, chords on beats 2 and 3.',
    scoreId: 'ex-m10-l01-a', lessons: ['m10-l01', 'm10-l02'], tags: ['accompaniment'],
  },
  {
    id: 'target-tone', term: 'Target tone',
    definition: 'A note chosen in advance to arrive on, usually at a chord change. Strong-beat chord tones make a useful scaffold.',
    example: 'Over C–Am–F–G, aim for E, E, A and G on each downbeat.',
    scoreId: 'ex-m06-l03-a', lessons: ['m06-l03', 'm11-l02'], tags: ['melody', 'improvisation'],
  },
];

export const GLOSSARY_MAP = new Map(GLOSSARY.map((entry) => [entry.id, entry]));

export function glossaryEntry(id: string): GlossaryEntry | undefined {
  return GLOSSARY_MAP.get(id);
}

export const REFERENCE_CHORDS = [
  'C', 'F', 'G', 'Am', 'Dm', 'Em', 'G7', 'D', 'A', 'Bm', 'F#m', 'E', 'Bb', 'Cadd9',
];
