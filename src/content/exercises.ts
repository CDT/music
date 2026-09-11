import { majorKey, minorKey } from '../domain/score';
import type {
  ChoiceOption, ChordQualityExercise, ContourExercise, DegreeExercise, Exercise,
  FreeEchoExercise, FunctionExercise, KeySpec, LessonId, Meter, PhraseExercise,
  RhythmExercise, SkillId,
} from '../domain/types';
import { parseNotes } from '../domain/rhythm';

const FOUR_FOUR: Meter = { numerator: 4, denominator: 4 };
const THREE_FOUR: Meter = { numerator: 3, denominator: 4 };
const C = majorKey('C');
const G = majorKey('G');
const F = majorKey('F');
const D = majorKey('D');
const Am = minorKey('A');

const CONTOUR_OPTIONS: ChoiceOption[] = [
  { id: 'up', label: 'The second note was higher' },
  { id: 'same', label: 'The two notes were the same' },
  { id: 'down', label: 'The second note was lower' },
];

const SHAPE_OPTIONS: ChoiceOption[] = [
  { id: 'up-down', label: 'Up then down' },
  { id: 'down-up', label: 'Down then up' },
  { id: 'up-up', label: 'Up then up again' },
  { id: 'down-down', label: 'Down then down again' },
];

const QUALITY_OPTIONS: ChoiceOption[] = [
  { id: 'major', label: 'Major' },
  { id: 'minor', label: 'Minor' },
];

function degreeOptions(degrees: string[]): ChoiceOption[] {
  return degrees.map((d) => ({ id: d, label: `Degree ${d}` }));
}

interface Common {
  key?: KeySpec;
  meter?: Meter;
  tempo?: number;
  skills: SkillId[];
  hints?: string[];
}

function base(id: string, title: string, instructions: string, common: Common) {
  return {
    id,
    title,
    instructions,
    hints: common.hints ?? [],
    key: common.key ?? C,
    meter: common.meter ?? FOUR_FOUR,
    tempoQuarterBpm: common.tempo ?? 60,
    skills: common.skills,
  };
}

function contour(
  id: string, title: string, instructions: string, promptNotes: string,
  options: ChoiceOption[], answerId: string, common: Common,
): ContourExercise {
  return { ...base(id, title, instructions, common), mode: 'contour', promptNotes, options, answerId };
}

function degree(
  id: string, title: string, instructions: string, establishChords: string[],
  promptNotes: string, answerDegree: string, options: string[], common: Common,
): DegreeExercise {
  return {
    ...base(id, title, instructions, common),
    mode: 'degree', establishChords, promptNotes, answerDegree, options: degreeOptions(options),
  };
}

function phrase(
  id: string, title: string, instructions: string, promptNotes: string, common: Common,
  extras: { octaveEquivalent?: boolean; showRhythmFirst?: boolean } = {},
): PhraseExercise {
  const answerMidi = parseNotes(promptNotes)
    .filter((n) => n.pitch)
    .map((n) => n.pitch!.midi);
  return {
    ...base(id, title, instructions, common),
    mode: 'phrase',
    promptNotes,
    answerMidi,
    octaveEquivalent: extras.octaveEquivalent ?? false,
    showRhythmFirst: extras.showRhythmFirst ?? true,
  };
}

function rhythm(
  id: string, title: string, instructions: string, promptNotes: string, common: Common,
): RhythmExercise {
  const events = parseNotes(promptNotes);
  return {
    ...base(id, title, instructions, common),
    mode: 'rhythm',
    promptNotes,
    onsetBeats: events.filter((e) => e.pitch).map((e) => e.startBeat),
  };
}

function chordQuality(
  id: string, title: string, instructions: string, chordText: string,
  answerId: string, common: Common,
): ChordQualityExercise {
  return {
    ...base(id, title, instructions, common),
    mode: 'chord-quality', chordText, options: QUALITY_OPTIONS, answerId,
  };
}

function functionEar(
  id: string, title: string, instructions: string, establishChords: string[],
  promptNotes: string, promptChords: string[], options: ChoiceOption[],
  answerId: string, explanation: string, common: Common,
): FunctionExercise {
  return {
    ...base(id, title, instructions, common),
    mode: 'function', establishChords, promptNotes, promptChords, options, answerId, explanation,
  };
}

function freeEcho(
  id: string, title: string, instructions: string, promptNotes: string,
  revealText: string, common: Common,
): FreeEchoExercise {
  return { ...base(id, title, instructions, common), mode: 'free-echo', promptNotes, revealText };
}

const ENDING_OPTIONS: ChoiceOption[] = [
  { id: 'settled', label: 'It arrived home' },
  { id: 'open', label: 'It stayed open' },
];

const CHORD_CHOICE = (ids: string[]): ChoiceOption[] => ids.map((id) => ({ id, label: id }));

export const EXERCISES: Exercise[] = [
  /* ---- Module 1 ---- */
  contour('q-m01-l01', 'Was the middle note near or far?',
    'Listen to the short echo. Say whether its middle note was one step away or a bigger skip.',
    'C4:1 E4:1 C4:2', [
      { id: 'step', label: 'One step away (C–D–C)' },
      { id: 'skip', label: 'A bigger skip (C–E–C)' },
    ], 'skip', { skills: ['inner-hearing', 'pitch-mapping'], hints: ['The first and last notes are both C.', 'A step is the nearest scale note; a skip jumps over one.'] }),
  freeEcho('q-m01-l01-echo', 'Three echoes at your piano',
    'Listen, imagine the phrase, then find it on your piano. Reveal only after you have tried.',
    'C4:1 D4:1 C4:2', 'The phrase was C4, D4, C4 — a step up and back.',
    { skills: ['inner-hearing', 'pitch-mapping'] }),
  contour('q-m01-l02', 'Same, up, or down?',
    'Two notes sound. Choose what the second note did.',
    'C4:1 D4:1', CONTOUR_OPTIONS, 'up',
    { skills: ['pitch-mapping'], hints: ['Hum the first note and hold it while the second sounds.'] }),
  contour('q-m01-l02-shape', 'The shape of four notes',
    'Listen to the four-note phrase and choose its overall shape.',
    'C4:1 E4:1 G4:1 E4:1', SHAPE_OPTIONS, 'up-down',
    { skills: ['pitch-mapping', 'phrase-memory'], hints: ['Follow the phrase with your hand in the air.'] }),
  phrase('q-m01-l03', 'Hold the whole phrase',
    'Listen twice, wait one comfortable breath, then enter the phrase.',
    'C4:1 D4:1 E4:1 D4:1 C4:2',
    { skills: ['phrase-memory', 'inner-hearing'], hints: ['It starts and ends on the same note.', 'The shape is up, up, down, down.'] }),
  freeEcho('q-m01-l04', 'One phrase over one chord',
    'A soft C chord sounds, then a two-bar phrase using C, E and G. Find it at your piano.',
    'C4:1 E4:1 G4:1 E4:1 C4:4', 'The phrase was C4 E4 G4 E4, then C4 held for four beats.',
    { skills: ['inner-hearing', 'coordination'] }),

  /* ---- Module 2 ---- */
  functionEar('q-m02-l01', 'Which ending felt settled?',
    'A key is established, then a phrase plays. Decide whether it arrived home.',
    ['C', 'F', 'G', 'C'], 'E4:1 F4:1 E4:1 C4:1 D4:4', ['C', 'G'], ENDING_OPTIONS, 'open',
    'The phrase ends on D over G harmony, which leans forward rather than settling.',
    { skills: ['tonal-center'], hints: ['Sing the note that would feel finished, then compare with the last note you heard.'] }),
  degree('q-m02-l02', 'Anchor degrees 1, 3 and 5',
    'A tonic reference sounds, then one target note. Name its degree.',
    ['C'], 'E4:2', '3', ['1', '3', '5'],
    { skills: ['tonal-center', 'pitch-mapping'], hints: ['Sing from the tonic upward until you reach the target.'] }),
  degree('q-m02-l03', 'Hear 2 and 4 through resolution',
    'After the tonic reference, name the degree you hear.',
    ['C'], 'F4:2', '4', ['1', '2', '3', '4', '5'],
    { skills: ['tonal-center'], hints: ['Degree 2 leans towards 1 or 3; degree 4 leans towards 3.'] }),
  degree('q-m02-l04', 'Find 6 and 7',
    'After the tonic reference, name the degree you hear.',
    ['C'], 'B4:2', '7', ['5', '6', '7', "1'"],
    { skills: ['tonal-center'], hints: ['Degree 7 sits one step below the upper tonic.'] }),

  /* ---- Module 3 ---- */
  rhythm('q-m03-l01', 'Keep the pulse through a long note',
    'Hear the rhythm after a count-in, then tap or clap it back.',
    'C4:1 C4:1 C4:2', { skills: ['rhythm'], hints: ['The last note lasts two beats — keep counting through it.'] }),
  rhythm('q-m03-l02', 'A rest inside the bar',
    'Hear the rhythm and tap it back. One beat is silent.',
    'C4:1 r:1 C4:1 C4:1', { skills: ['rhythm'], hints: ['Do not fill the silence with a tap.'] }),
  phrase('q-m03-l03', 'Two bars of First Light',
    'Listen to the two-bar chunk and enter it.',
    'C4:1 D4:1 E4:1 G4:1 A4:2 G4:1 E4:1',
    { skills: ['phrase-memory'], hints: ['The first bar climbs; the second bar turns back down.'] }),
  freeEcho('q-m03-l04', 'Recover a four-bar melody',
    'Listen to four bars, sing them, then find them on your piano before revealing.',
    'C4:1 D4:1 E4:1 G4:1 A4:2 G4:1 E4:1 F4:1 E4:1 D4:1 C4:1 D4:2 G4:2',
    'These are bars 1–4 of First Light: C D E G / A G E / F E D C / D G.',
    { skills: ['phrase-memory', 'pitch-mapping'] }),

  /* ---- Module 4 ---- */
  chordQuality('q-m04-l01', 'Major or minor?',
    'One triad sounds. Choose its quality.', 'Am', 'minor',
    { skills: ['chord-hearing'], hints: ['Listen to the middle note: a minor third sits one semitone lower.'] }),
  functionEar('q-m04-l02', 'Choose the closing chord',
    'A phrase ends over V. Choose the chord that returns home.',
    ['C', 'G', 'C'], 'E5:1 D5:1 C5:2', ['G'], CHORD_CHOICE(['C', 'F', 'G']), 'C',
    'V (G) points back to I (C); the melody arrives on C at the same moment.',
    { skills: ['chord-hearing', 'harmonization'] }),
  functionEar('q-m04-l03', 'Which chord supports this A?',
    'A sustained A sounds. Two of the offered chords contain A.',
    ['C'], 'A4:4', ['F'], CHORD_CHOICE(['F', 'G', 'Am']), 'F',
    'F major is F–A–C and A minor is A–C–E; both contain A. G major does not.',
    { skills: ['chord-hearing', 'harmonization'], hints: ['Play each candidate under the note and listen for a rub.'] }),
  functionEar('q-m04-l04', 'Compare two harmonizations',
    'Bars 5–8 of First Light play twice with different first chords. Which one did you hear first?',
    ['C'], 'A4:1 A4:1 G4:2', ['F'], CHORD_CHOICE(['F', 'Am']), 'F',
    'Both contain A. F places A as its third; Am places A as its root. Either is a usable choice.',
    { skills: ['harmonization'] }),

  /* ---- Module 5 ---- */
  functionEar('q-m05-l01', 'Name the lowest note',
    'A C major chord sounds with one of two bass notes.',
    ['C'], 'r:4', ['C/E'], CHORD_CHOICE(['C in the bass', 'E in the bass', 'G in the bass']), 'E in the bass',
    'The chord is still C major. Its lowest note is E, so we write C/E.',
    { skills: ['chord-hearing', 'accompaniment'] }),
  rhythm('q-m05-l02', 'Hold a bass-and-chord pattern',
    'Tap the pattern of a bass-and-chord accompaniment for one bar: beats 1, 2, 3 and 4.',
    'C4:1 C4:1 C4:1 C4:1', { skills: ['accompaniment', 'rhythm'] }),
  phrase('q-m05-l03', 'A broken chord shape',
    'Enter the four notes of the compact broken pattern on C.',
    'C4:1 E4:1 G4:1 E4:1', { skills: ['accompaniment'], hints: ['The shape is 1–3–5–3 of the chord, not of the scale.'] }),
  freeEcho('q-m05-l04', 'Balance at your piano',
    'Play First Light bars 1–4 with one bass note per bar. Make the melody clearly stronger.',
    'C4:1 D4:1 E4:1 G4:1 A4:2 G4:1 E4:1',
    'There is no screen answer here. Listen for a melody that stays audible above the left hand.',
    { skills: ['coordination', 'accompaniment'] }),

  /* ---- Module 6 ---- */
  freeEcho('q-m06-l01', 'Sing a motif, then find it',
    'Over a held C chord, sing a three-to-five-note idea using C, D, E, G and A. Find and repeat it.',
    'C4:1 D4:1 E4:2', 'The demonstration motif was C–D–E, but your own idea is the point of this task.',
    { skills: ['improvisation', 'inner-hearing'] }),
  contour('q-m06-l02', 'Which one changed?',
    'The original idea plays, then a variation. Choose what changed.',
    'C4:0.5 C4:0.5 D4:1 E4:2', [
      { id: 'rhythm', label: 'The rhythm' },
      { id: 'ending', label: 'The final note' },
      { id: 'key', label: 'The key' },
    ], 'rhythm',
    { skills: ['improvisation', 'rhythm'], hints: ['The pitches are the same; count the attacks.'] }),
  freeEcho('q-m06-l03', 'Land on the target',
    'Over C–Am–F–G, aim for E, E, A and G on each downbeat. Play a slow loop and listen.',
    'E4:1 D4:1 E4:2 E4:2 r:2 A4:1 G4:1 A4:2 G4:2 r:2',
    'The demonstration lands on E, E, A and G at each chord change.',
    { skills: ['improvisation', 'harmonization'] }),
  freeEcho('q-m06-l04', 'Ask and answer',
    'Play a four-bar question ending over G, then a four-bar answer ending over C.',
    'C4:1 D4:1 E4:2 G4:2 E4:2 C4:1 D4:1 E4:2 D4:4',
    'The demonstration question ends on D over G. Its answer reuses the same opening and ends on C.',
    { skills: ['improvisation', 'phrase-memory'] }),

  /* ---- Module 7 ---- */
  functionEar('q-m07-l01', 'Where is home?',
    'Listen to the short progression and choose the note that feels like home.',
    ['Am', 'Dm', 'Em', 'Am'], 'r:4', ['Am'], CHORD_CHOICE(['A', 'C']), 'A',
    'The progression circles A minor, so A sounds settled even though the notes are shared with C major.',
    { key: Am, skills: ['tonal-center'] }),
  chordQuality('q-m07-l02', 'Em or E major?',
    'One chord sounds before A minor. Choose its quality.', 'E', 'major',
    { key: Am, skills: ['chord-hearing'], hints: ['Only one note differs: G natural or G#.'] }),
  functionEar('q-m07-l03', 'Which minor progression?',
    'Listen and choose which of the two loops you heard.',
    ['Am'], 'r:4', ['Am', 'F', 'C', 'G'],
    CHORD_CHOICE(['Am–F–C–G (i–VI–III–VII)', 'Am–Dm–E–Am (i–iv–V–i)']), 'Am–F–C–G (i–VI–III–VII)',
    'The first loop stays open and never uses the raised seventh; the second returns through E.',
    { key: Am, skills: ['chord-hearing', 'tonal-center'] }),
  phrase('q-m07-l04', 'Two bars of Evening Window',
    'Enter bars 3–4 of Evening Window, including the raised seventh.',
    'B4:1 G#4:1 E4:2 A4:3 r:1',
    { key: Am, tempo: 58, skills: ['pitch-mapping', 'phrase-memory'], hints: ['The second note is G#, one semitone below A.'] }),

  /* ---- Module 8 ---- */
  degree('q-m08-l01', 'Degrees in G major',
    'G is established as home. Name the degree you hear.',
    ['G'], 'B4:2', '3', ['1', '2', '3', '5'],
    { key: G, skills: ['transposition', 'tonal-center'] }),
  degree('q-m08-l02', 'Degree 7 in F major',
    'F is established as home. Name the degree you hear.',
    ['F'], 'E5:2', '7', ['5', '6', '7', "1'"],
    { key: F, skills: ['transposition'], hints: ['F major contains Bb; degree 7 is E.'] }),
  phrase('q-m08-l03', 'The same phrase, one octave higher',
    'Enter the phrase in the octave you heard.',
    'C5:1 D5:1 E5:1 G5:1 E5:2 C5:2',
    { skills: ['transposition'], hints: ['The shape is identical to the C4 version; only the register moved.'] }),
  phrase('q-m08-l04', 'First Light bars 5–8 in G',
    'Enter the transposed phrase.',
    'E5:1 E5:1 D5:2 B4:1 A4:1 G4:2',
    { key: G, skills: ['transposition'], hints: ['Degrees are 6–6–5, then 3–2–1.'] }),

  /* ---- Module 9 ---- */
  functionEar('q-m09-l01', 'Root or bass?',
    'A chord sounds with a bass-focused mix. Name the chord and its lowest note.',
    ['C'], 'r:4', ['C/G'], CHORD_CHOICE(['C with C in the bass', 'C with E in the bass', 'C with G in the bass']),
    'C with G in the bass',
    'The chord identity stays C major. Its lowest note is G, written C/G.',
    { skills: ['chord-hearing'] }),
  functionEar('q-m09-l02', 'Does this note need its own chord?',
    'E–F–G sounds over one held C chord, then again with a chord change on the F.',
    ['C'], 'E4:1 F4:1 G4:2', ['C'], CHORD_CHOICE(['One chord is enough', 'Every note needs its own chord']),
    'One chord is enough',
    'The brief F passes between E and G. A slower harmonic rhythm keeps the phrase calm.',
    { skills: ['harmonization'] }),
  chordQuality('q-m09-l03', 'Find the seventh',
    'G7 sounds. Choose the quality of its lower triad.', 'G7', 'major',
    { skills: ['chord-hearing'], hints: ['G7 is G–B–D plus F, a minor seventh above G.'] }),
  functionEar('q-m09-l04', 'Which arrangement did you hear?',
    'Bars 5–8 of First Light play with one of two progressions.',
    ['C'], 'A4:1 A4:1 G4:2', ['Dm'], CHORD_CHOICE(['F–C–G–C', 'Dm–Am–G7–C']), 'Dm–Am–G7–C',
    'Dm begins lower and the bass steps down; both progressions support the same melody.',
    { skills: ['harmonization', 'arranging'] }),

  /* ---- Module 10 ---- */
  rhythm('q-m10-l01', 'Three-beat grouping',
    'Tap the three beats of a waltz bar after the three-beat count-in.',
    'C4:1 C4:1 C4:1', { meter: THREE_FOUR, tempo: 72, skills: ['rhythm', 'accompaniment'] }),
  rhythm('q-m10-l02', 'Offbeat chords',
    'Tap only the offbeat chord attacks of the pop pattern: the "and" of each beat pair.',
    'r:0.5 C4:0.5 r:0.5 C4:0.5 r:0.5 C4:0.5 r:0.5 C4:0.5',
    { tempo: 68, skills: ['rhythm', 'accompaniment'], hints: ['Count 1 and 2 and; tap only on the "and".'] }),
  functionEar('q-m10-l03', 'Plain triad or added ninth?',
    'The final tonic sounds twice. Choose which version had the added D.',
    ['C'], 'r:4', ['Cadd9'], CHORD_CHOICE(['Plain C triad', 'Cadd9 with an added D']), 'Cadd9 with an added D',
    'Cadd9 is C–E–G–D. The added D sits above the triad; no seventh is implied.',
    { skills: ['chord-hearing', 'arranging'] }),
  freeEcho('q-m10-l04', 'Reduce a piece to its skeleton',
    'Play the melody and bass roots of Skyward Letter bars 1–4, leaving out everything else.',
    'A4:1 G4:1 F4:1 A4:1 B4:1 A4:1 G4:2',
    'The skeleton is melody plus F and G roots. Inner voices and ornaments were removed first.',
    { tempo: 64, skills: ['arranging'] }),

  /* ---- Module 11 ---- */
  degree('q-m11-l01', 'Degrees of the ground',
    'D major is established. Name the degree of the bass root you hear.',
    ['D'], 'F#3:2', '3', ['1', '3', '5', '6'],
    { key: D, skills: ['transposition', 'harmonization'] }),
  freeEcho('q-m11-l02', 'Your own melody on the ground',
    'Choose one target chord tone per bar, sing a new two-bar phrase, then find it.',
    'F#4:1 A4:1 F#4:1 E4:1 E4:1 C#4:1 E4:2',
    'The demonstration is Ground and Wings bars 1–2. Your own phrase is the point of this task.',
    { key: D, skills: ['improvisation', 'harmonization'] }),
  freeEcho('q-m11-l03', 'Two contrasting textures',
    'Play four bars with block chords, then the same four bars with broken chords.',
    'B4:1 A4:1 G4:2 F#4:1 E4:1 D4:2',
    'The harmony is unchanged. Only density and register moved.',
    { key: D, skills: ['arranging', 'accompaniment'] }),
  degree('q-m11-l04', 'The ground moved to C',
    'C major is established. Name the degree of the bass root you hear.',
    ['C'], 'A3:2', '6', ['1', '4', '5', '6'],
    { skills: ['transposition'], hints: ['I–V–vi–iii–IV–I–IV–V. The third chord is vi.'] }),

  /* ---- Module 12 ---- */
  phrase('q-m12-l01', 'Recover a fresh phrase',
    'Listen to the four-bar phrase and enter what you can. Then say where you were unsure.',
    'C4:1 D4:1 E4:1 G4:1 F4:1 E4:1 D4:2 C4:1 D4:1 E4:1 G4:1 D4:1 E4:1 C4:2',
    { skills: ['pitch-mapping', 'phrase-memory'], hints: ['Bars 1 and 3 are identical.', 'The phrase ends on the tonic.'] }),
  freeEcho('q-m12-l02', 'Harmonize without a chart',
    'The melody plays with no chord symbols. Apply the eight-step checklist and choose an accompaniment.',
    'A4:1 A4:1 G4:2 E4:1 D4:1 C4:2',
    'One worked solution is F–C. Am–C is another. The app records your choice and your reason, not a verdict.',
    { skills: ['harmonization'] }),
  freeEcho('q-m12-l03', 'A complete miniature',
    'Play a short piece with an introduction, a question, an answer, one variation and an ending.',
    'C4:1 D4:1 E4:2 G4:2 E4:2 D4:1 E4:1 D4:1 C4:1 D4:4',
    'The demonstration uses one key, one accompaniment pattern and one chord per bar.',
    { skills: ['improvisation', 'arranging'] }),
  freeEcho('q-m12-l04', 'Transfer and plan',
    'Replay an early ear task, harmonize a familiar phrase, then move it to another key.',
    'C4:1 D4:1 C4:2',
    'This is the first phrase of the course. Compare how it feels now with your earliest notes.',
    { skills: ['transposition', 'inner-hearing'] }),
];

export const EXERCISE_MAP = new Map<string, Exercise>();
for (const exercise of EXERCISES) {
  if (EXERCISE_MAP.has(exercise.id)) throw new Error(`Duplicate exercise id "${exercise.id}"`);
  EXERCISE_MAP.set(exercise.id, exercise);
}

export function exerciseById(id: string): Exercise | undefined {
  return EXERCISE_MAP.get(id);
}

export function exercisesForLesson(lessonId: LessonId): Exercise[] {
  return EXERCISES.filter((e) => e.id.startsWith(`q-${lessonId}`));
}
