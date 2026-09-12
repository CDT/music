export type LessonId = `m${string}-l${string}`;
export type Readiness = 'not-yet' | 'with-help' | 'comfortable';
export type InputMode = 'manual-piano' | 'screen' | 'midi';
export type SkillId =
  | 'inner-hearing' | 'pitch-mapping' | 'tonal-center' | 'rhythm'
  | 'phrase-memory' | 'chord-hearing' | 'harmonization' | 'accompaniment'
  | 'coordination' | 'improvisation' | 'transposition' | 'arranging';

export const SKILL_IDS: SkillId[] = [
  'inner-hearing', 'pitch-mapping', 'tonal-center', 'rhythm',
  'phrase-memory', 'chord-hearing', 'harmonization', 'accompaniment',
  'coordination', 'improvisation', 'transposition', 'arranging',
];

export const SKILL_LABELS: Record<SkillId, string> = {
  'inner-hearing': 'Inner hearing',
  'pitch-mapping': 'Finding pitches',
  'tonal-center': 'Tonal centre',
  rhythm: 'Rhythm',
  'phrase-memory': 'Phrase memory',
  'chord-hearing': 'Hearing chords',
  harmonization: 'Harmonizing',
  accompaniment: 'Accompaniment',
  coordination: 'Coordination',
  improvisation: 'Improvising',
  transposition: 'Transposing',
  arranging: 'Arranging',
};

export type Letter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
export type Accidental = -2 | -1 | 0 | 1 | 2;

export interface Pitch {
  midi: number;                       // integer 0..127; C4 = 60
  letter: Letter;
  accidental: Accidental;
  octave: number;
}

export type PitchClassSpec = Pick<Pitch, 'letter' | 'accidental'>;

export interface KeySpec {
  tonic: PitchClassSpec;
  mode: 'major' | 'minor';            // alterations live on individual notes
}

export interface Meter { numerator: number; denominator: 4 | 8; }

export type Voice = 'melody' | 'bass' | 'chord';

export interface NoteEvent {
  id: string;
  startBeat: number;                  // quarter beats from score start
  durationBeats: number;
  pitch: Pitch | null;                // null = explicit rest
  velocity?: number;                  // normalized 0..1
  voice: Voice;
}

export type ChordQuality = 'major' | 'minor' | 'diminished' | 'dominant7' | 'add9';

export interface ChordSymbol {
  root: PitchClassSpec;
  quality: ChordQuality;
  bass?: PitchClassSpec;
}

export interface ChordEvent {
  startBeat: number;
  durationBeats: number;
  symbol: ChordSymbol;
  romanLabel: string;
  voicing?: Pitch[];
}

export interface Score {
  id: string;
  title: string;
  key: KeySpec;
  meter: Meter;
  tempoQuarterBpm: number;
  pickupBeats?: number;               // omitted unless deliberately authored
  totalBeats: number;
  notes: NoteEvent[];
  chords: ChordEvent[];
  origin: 'guide-original' | 'learner';
}

export type LessonBlock =
  | { type: 'prose'; heading?: string; paragraphs: string[] }
  | { type: 'example'; scoreId: string; prompt: string; hideAnswer: boolean }
  | { type: 'exercise'; exerciseId: string }
  | { type: 'piano-task'; steps: string[]; easier: string; stretch: string }
  | { type: 'reflection'; prompt: string };

export interface Lesson {
  id: LessonId;
  moduleId: string;
  title: string;
  objective: string;
  prerequisites: LessonId[];
  skills: SkillId[];
  blocks: LessonBlock[];
  readinessCheck: string;
  takeaway: string;
  reviewExerciseId: string;
  /** Extra structured sections required by the lesson template (section 5). */
  beforeYouStart: string;
  ifDifficult: string[];
  makeItYours: string;
  reviewTask: string;
  glossary: string[];
}

export interface CourseModule {
  id: string;
  index: number;
  title: string;
  summary: string;
  lessons: Lesson[];
}

/* ---------- Exercises ---------- */

export type ExerciseMode =
  | 'contour'
  | 'degree'
  | 'phrase'
  | 'rhythm'
  | 'chord-quality'
  | 'function'
  | 'free-echo';

export interface ExerciseBase {
  id: string;
  mode: ExerciseMode;
  title: string;
  instructions: string;
  hints: string[];
  key: KeySpec;
  meter: Meter;
  tempoQuarterBpm: number;
  skills: SkillId[];
}

export interface ChoiceOption { id: string; label: string; }

export interface ContourExercise extends ExerciseBase {
  mode: 'contour';
  promptNotes: string;                // pitch:duration tokens
  options: ChoiceOption[];
  answerId: string;
}

export interface DegreeExercise extends ExerciseBase {
  mode: 'degree';
  establishChords: string[];          // chord symbol text, e.g. "C", "G"
  promptNotes: string;
  answerDegree: string;               // e.g. "3", "b3", "1'"
  options: ChoiceOption[];
}

export interface PhraseExercise extends ExerciseBase {
  mode: 'phrase';
  promptNotes: string;
  answerMidi: number[];
  octaveEquivalent: boolean;
  showRhythmFirst: boolean;
}

export interface RhythmExercise extends ExerciseBase {
  mode: 'rhythm';
  promptNotes: string;                // single-pitch tokens carrying the rhythm
  onsetBeats: number[];
}

export interface ChordQualityExercise extends ExerciseBase {
  mode: 'chord-quality';
  chordText: string;                  // e.g. "C major" spelled symbol text
  options: ChoiceOption[];
  answerId: string;
}

export interface FunctionExercise extends ExerciseBase {
  mode: 'function';
  establishChords: string[];
  promptNotes: string;
  promptChords: string[];
  options: ChoiceOption[];
  answerId: string;
  explanation: string;
}

export interface FreeEchoExercise extends ExerciseBase {
  mode: 'free-echo';
  promptNotes: string;
  revealText: string;
}

export type Exercise =
  | ContourExercise | DegreeExercise | PhraseExercise | RhythmExercise
  | ChordQualityExercise | FunctionExercise | FreeEchoExercise;

/* ---------- Learner data ---------- */

export interface Attempt {
  id: string;
  exerciseId: string;
  lessonId?: LessonId;
  seed?: number;
  generatorVersion?: number;
  inputMode: InputMode;
  startedAt: string;                  // UTC ISO timestamp
  completedAt: string;
  hints: string[];
  replayCount: number;
  readiness?: Readiness;
  screenResult?: {
    correct: number;
    total: number;
    metric: 'pitch-sequence' | 'choice' | 'rhythm-spacing' | 'beat-aligned';
  };
}

export interface LessonProgress {
  lessonId: LessonId;
  status: 'not-started' | 'in-progress' | 'completed';
  blockIndex: number;
  readiness?: Readiness;
  completedAt?: string;
  updatedAt: string;
}

export interface ReviewItem {
  id: string;
  lessonId: LessonId;
  exerciseId: string;
  stage: number;
  dueDate: string;                    // local YYYY-MM-DD calendar date
  lastReviewedAt?: string;
}

export interface Arrangement {
  id: string;
  title: string;
  chords: ChordEvent[];
  patternId: string;
  comment: string;
}

export interface NotebookEntry {
  id: string;
  title: string;
  kind: 'journal' | 'melody';
  text: string;
  tags: string[];
  lessonId?: LessonId;
  score?: Score;
  draft: boolean;
  arrangements: Arrangement[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionSummary {
  id: string;
  startedAt: string;
  activeSeconds: number;
  lessonIds: LessonId[];
  completed: boolean;
}

export interface ResumeState {
  budgetMinutes: 5 | 15 | 30 | null;
  taskIds: string[];
  taskIndex: number;
  activeSeconds: number;
  startedAt: string;
}

export interface AppSettings {
  labelMode: 'notes' | 'degrees' | 'both' | 'hidden';
  defaultSessionMinutes: 5 | 15 | 30 | null;
  masterVolume: number;
  reducedMotion: 'system' | 'on';
  textScale: 'normal' | 'large';
  metronomeLatencyMs: number;
  onboarded: boolean;
  comfortableRange: 'low' | 'middle' | 'high';
  /**
   * Which piano to play. 'synthesized' needs no download; 'recorded' uses the
   * optional sample pack, downloaded once and kept in the browser cache.
   */
  pianoTone: 'synthesized' | 'recorded';
}

export interface PersistedData {
  schemaVersion: number;
  contentVersion: string;
  revision: number;
  savedAt: string;
  settings: AppSettings;
  lessons: Record<string, LessonProgress>;
  reviews: ReviewItem[];
  attempts: Attempt[];
  notebook: NotebookEntry[];
  sessions: SessionSummary[];
  resume: ResumeState | null;
}
