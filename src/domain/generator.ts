import { chordContainsPitch, diatonicTriad } from './harmony';
import { MusicError, midiFor, pitchForDegree, scalePitchClasses } from './pitch';
import { buildScore, majorKey } from './score';
import { notesText } from './rhythm';
import type { KeySpec, Score } from './types';

export const GENERATOR_VERSION = 1;

/** Small deterministic PRNG (mulberry32). Same seed, same phrase, always. */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type GeneratorLevel = 'A' | 'B' | 'C' | 'D';

export interface LevelSpec {
  id: GeneratorLevel;
  label: string;
  description: string;
  keys: KeySpec[];
  /** Degrees available, as degree strings. */
  degrees: string[];
  bars: number;
  maxLeapSemitones: number;
  tempoQuarterBpm: number;
}

export const LEVELS: Record<GeneratorLevel, LevelSpec> = {
  A: {
    id: 'A',
    label: 'Level A — three notes, degrees 1–3',
    description: 'C major. Three notes starting on 1, quarter notes with a final half note.',
    keys: [majorKey('C')],
    degrees: ['1', '2', '3'],
    bars: 1,
    maxLeapSemitones: 4,
    tempoQuarterBpm: 60,
  },
  B: {
    id: 'B',
    label: 'Level B — four notes, degrees 1–5',
    description: 'C major and G major. Four quarter notes, mostly steps with an occasional third.',
    keys: [majorKey('C'), majorKey('G')],
    degrees: ['1', '2', '3', '4', '5'],
    bars: 1,
    maxLeapSemitones: 4,
    tempoQuarterBpm: 60,
  },
  C: {
    id: 'C',
    label: 'Level C — two bars, full major scale',
    description: 'C, G or F major across one octave. A motif and a varied ending, no leap beyond a fifth.',
    keys: [majorKey('C'), majorKey('G'), majorKey('F')],
    degrees: ['1', '2', '3', '4', '5', '6', '7', "1'"],
    bars: 2,
    maxLeapSemitones: 7,
    tempoQuarterBpm: 60,
  },
  D: {
    id: 'D',
    label: 'Level D — four bars with an answer',
    description: 'Four bars in one key: a two-bar motif and a related answer ending on the tonic.',
    keys: [majorKey('C'), majorKey('G'), majorKey('F')],
    degrees: ['1', '2', '3', '4', '5', '6', '7', "1'"],
    bars: 4,
    maxLeapSemitones: 7,
    tempoQuarterBpm: 60,
  },
};

/* ---------- Authored seed prompts ---------- */

export interface SeedPrompt {
  id: string;
  level: GeneratorLevel;
  key: KeySpec;
  /** degree:duration pairs, "r" allowed for a rest. */
  degrees: string;
  harmony?: string[];
}

const C_MAJOR = majorKey('C');
const G_MAJOR = majorKey('G');
const F_MAJOR = majorKey('F');

export const SEED_PROMPTS: SeedPrompt[] = [
  // Level A — six seed contours.
  { id: 'gen-a1', level: 'A', key: C_MAJOR, degrees: '1:1 2:1 1:2', harmony: ['C'] },
  { id: 'gen-a2', level: 'A', key: C_MAJOR, degrees: '1:1 3:1 1:2', harmony: ['C'] },
  { id: 'gen-a3', level: 'A', key: C_MAJOR, degrees: '1:1 2:1 3:2', harmony: ['C'] },
  { id: 'gen-a4', level: 'A', key: C_MAJOR, degrees: '3:1 2:1 1:2', harmony: ['C'] },
  { id: 'gen-a5', level: 'A', key: C_MAJOR, degrees: '1:1 1:1 2:2', harmony: ['C'] },
  { id: 'gen-a6', level: 'A', key: C_MAJOR, degrees: '2:1 3:1 2:2', harmony: ['C'] },
  // Level B — six seed phrases, in C and then G.
  { id: 'gen-b1', level: 'B', key: C_MAJOR, degrees: '1:1 2:1 3:1 2:1', harmony: ['C'] },
  { id: 'gen-b2', level: 'B', key: C_MAJOR, degrees: '3:1 2:1 1:1 1:1', harmony: ['C'] },
  { id: 'gen-b3', level: 'B', key: C_MAJOR, degrees: '1:1 3:1 5:1 3:1', harmony: ['C'] },
  { id: 'gen-b4', level: 'B', key: G_MAJOR, degrees: '5:1 4:1 3:1 2:1', harmony: ['G'] },
  { id: 'gen-b5', level: 'B', key: G_MAJOR, degrees: '2:1 3:1 4:1 3:1', harmony: ['G'] },
  { id: 'gen-b6', level: 'B', key: G_MAJOR, degrees: '5:1 3:1 2:1 1:1', harmony: ['G'] },
  // Level C — six two-bar seeds.
  { id: 'gen-c1', level: 'C', key: C_MAJOR, degrees: '1:1 2:1 3:1 5:1 6:1 5:1 3:2', harmony: ['C', 'C'] },
  { id: 'gen-c2', level: 'C', key: C_MAJOR, degrees: '3:1 4:1 5:2 2:1 7,:1 1:2', harmony: ['C', 'G'] },
  { id: 'gen-c3', level: 'C', key: G_MAJOR, degrees: '5:1 6:1 5:1 3:1 4:1 2:1 1:2', harmony: ['G', 'G'] },
  { id: 'gen-c4', level: 'C', key: G_MAJOR, degrees: '1:1 3:1 2:1 4:1 3:1 2:1 1:2', harmony: ['G', 'G'] },
  { id: 'gen-c5', level: 'C', key: F_MAJOR, degrees: '3:1 5:1 6:1 5:1 4:1 3:1 2:2', harmony: ['F', 'F'] },
  { id: 'gen-c6', level: 'C', key: F_MAJOR, degrees: '5:1 3:1 4:1 2:1 3:1 2:1 1:2', harmony: ['F', 'C'] },
];

/** The six authored Level D prompts are study excerpts, referenced by score ID. */
export const LEVEL_D_AUTHORED = [
  { id: 'gen-d1', scoreId: 's01', firstBar: 1, lastBar: 4 },
  { id: 'gen-d2', scoreId: 's01', firstBar: 5, lastBar: 8 },
  { id: 'gen-d3', scoreId: 's02', firstBar: 1, lastBar: 4 },
  { id: 'gen-d4', scoreId: 's03', firstBar: 1, lastBar: 4 },
  { id: 'gen-d5', scoreId: 's04', firstBar: 1, lastBar: 4 },
  { id: 'gen-d6', scoreId: 's05', firstBar: 1, lastBar: 4 },
];

export const AUTHORED_PROMPT_COUNT = SEED_PROMPTS.length + LEVEL_D_AUTHORED.length;

/** Tonic MIDI used for generated phrases in each supported key. */
export function tonicMidiFor(key: KeySpec): number {
  const base = midiFor(key.tonic.letter, key.tonic.accidental, 4);
  // Keep generated melodies inside a comfortable C4–C6 region.
  return base >= 60 && base < 72 ? base : base < 60 ? base + 12 : base - 12;
}

export function seedPromptToScore(prompt: SeedPrompt): Score {
  const tonic = tonicMidiFor(prompt.key);
  const tokens = prompt.degrees.trim().split(/\s+/);
  const parts: string[] = [];
  for (const token of tokens) {
    const [degree, durationText] = token.split(':');
    if (degree === 'r') { parts.push(`r:${durationText}`); continue; }
    const pitch = pitchForDegree(degree, prompt.key, tonic);
    parts.push(`${pitch.letter}${accidentalText(pitch.accidental)}${pitch.octave}:${durationText}`);
  }
  const bars = chunkToBars(parts, 4);
  return buildScore({
    id: prompt.id,
    title: `Prompt ${prompt.id.toUpperCase()}`,
    key: prompt.key,
    meter: { numerator: 4, denominator: 4 },
    tempoQuarterBpm: LEVELS[prompt.level].tempoQuarterBpm,
    bars,
    chords: prompt.harmony,
  });
}

function accidentalText(accidental: number): string {
  if (accidental === 0) return '';
  return accidental > 0 ? '#'.repeat(accidental) : 'b'.repeat(-accidental);
}

function chunkToBars(tokens: string[], barLength: number): string[] {
  const bars: string[] = [];
  let current: string[] = [];
  let total = 0;
  for (const token of tokens) {
    const duration = Number(token.split(':')[1]);
    current.push(token);
    total += duration;
    if (Math.abs(total - barLength) < 1e-9) {
      bars.push(current.join(' '));
      current = [];
      total = 0;
    } else if (total > barLength + 1e-9) {
      throw new MusicError(`Generated tokens overflow a bar: ${current.join(' ')}`);
    }
  }
  if (current.length > 0) {
    const remaining = barLength - total;
    current.push(`r:${remaining}`);
    bars.push(current.join(' '));
  }
  return bars;
}

/* ---------- Bounded deterministic generation ---------- */

const RHYTHM_TEMPLATES: number[][] = [
  [1, 1, 1, 1],
  [1, 1, 2],
  [2, 1, 1],
  [0.5, 0.5, 1, 2],
];

const PROGRESSIONS: number[][] = [
  [1, 4, 5, 1],
  [1, 6, 5, 1],
];

export interface GeneratedPrompt {
  id: string;
  seed: number;
  generatorVersion: number;
  level: GeneratorLevel;
  score: Score;
  degreeText: string;
}

const MAX_ATTEMPTS = 40;

/**
 * Deterministic Level D generation. Validates beat totals, pitch bounds,
 * leap limits and the tonic ending; falls back to an authored seed after
 * a bounded number of attempts.
 */
export function generateLevelD(seed: number): GeneratedPrompt {
  const spec = LEVELS.D;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const random = createRandom(seed + attempt * 7919);
    const key = spec.keys[Math.floor(random() * spec.keys.length)];
    const progression = PROGRESSIONS[Math.floor(random() * PROGRESSIONS.length)];
    const built = tryBuildPhrase(random, key, progression, spec, seed, attempt);
    if (built) return built;
  }
  // Bounded fallback to a known-valid authored prompt.
  const fallback = SEED_PROMPTS.filter((p) => p.level === 'C')[seed % 6];
  return {
    id: `gen-d-fallback-${fallback.id}`,
    seed,
    generatorVersion: GENERATOR_VERSION,
    level: 'D',
    score: seedPromptToScore(fallback),
    degreeText: fallback.degrees,
  };
}

function tryBuildPhrase(
  random: () => number,
  key: KeySpec,
  progression: number[],
  spec: LevelSpec,
  seed: number,
  attempt: number,
): GeneratedPrompt | null {
  const tonic = tonicMidiFor(key);
  const scale = scalePitchClasses(key);
  const scaleMidis: number[] = [];
  for (let octave = -1; octave <= 1; octave += 1) {
    for (let degree = 0; degree < 7; degree += 1) {
      const spelled = scale[degree];
      const pitch = pitchForDegree(String(degree + 1), key, tonic);
      void spelled;
      scaleMidis.push(pitch.midi + octave * 12);
    }
  }
  const usable = scaleMidis.filter((m) => m >= tonic && m <= tonic + 12).sort((a, b) => a - b);

  const barRhythms: number[][] = [];
  const barNotes: number[][] = [];
  let restUsed = false;

  for (let bar = 0; bar < 4; bar += 1) {
    const rhythm = bar === 1 || bar === 3
      ? barRhythms[bar - 1]
      : RHYTHM_TEMPLATES[Math.floor(random() * RHYTHM_TEMPLATES.length)];
    barRhythms.push(rhythm);
    const chord = diatonicTriad(key, progression[bar]);
    const anchors = usable.filter((m) => chordContainsPitch(chord, m));
    if (anchors.length === 0) return null;
    const notes: number[] = [];
    // The downbeat must also be reachable from the previous bar's last note.
    const previousNote = bar === 0 ? null : barNotes[bar - 1][barNotes[bar - 1].length - 1];
    const reachable = previousNote === null
      ? anchors
      : anchors.filter((m) => Math.abs(m - previousNote) <= spec.maxLeapSemitones);
    if (reachable.length === 0) return null;
    const downbeat = bar === 3
      ? (Math.abs(tonic - (previousNote ?? tonic)) <= spec.maxLeapSemitones ? tonic : null)
      : reachable[Math.floor(random() * reachable.length)];
    if (downbeat === null) return null;
    notes.push(downbeat);
    for (let i = 1; i < rhythm.length; i += 1) {
      const previous = notes[notes.length - 1];
      const index = usable.indexOf(previous);
      if (index < 0) return null;
      const step = [-2, -1, -1, 0, 1, 1, 2][Math.floor(random() * 7)];
      const next = usable[Math.min(usable.length - 1, Math.max(0, index + step))];
      if (Math.abs(next - previous) > spec.maxLeapSemitones) return null;
      notes.push(next);
    }
    if (bar === 3) {
      notes[notes.length - 1] = tonic;
      if (Math.abs(notes[notes.length - 1] - notes[Math.max(0, notes.length - 2)]) > spec.maxLeapSemitones) {
        return null;
      }
    }
    barNotes.push(notes);
  }

  // At most one non-final event may become a rest.
  const bars: string[] = [];
  for (let bar = 0; bar < 4; bar += 1) {
    const tokens: string[] = [];
    const rhythm = barRhythms[bar];
    let sum = 0;
    for (let i = 0; i < rhythm.length; i += 1) {
      const isFinal = bar === 3 && i === rhythm.length - 1;
      const makeRest = !isFinal && !restUsed && bar === 1 && i === rhythm.length - 1 && random() < 0.3;
      if (makeRest) {
        restUsed = true;
        tokens.push(`r:${rhythm[i]}`);
      } else {
        const midi = barNotes[bar][i];
        if (midi < 48 || midi > 84) return null;
        const pitch = spellMidiInKey(midi, key);
        tokens.push(`${pitch}:${rhythm[i]}`);
      }
      sum += rhythm[i];
    }
    if (Math.abs(sum - 4) > 1e-9) return null;
    bars.push(tokens.join(' '));
  }

  let score: Score;
  try {
    score = buildScore({
      id: `gen-d-${seed}-${attempt}`,
      title: 'Generated four-bar phrase',
      key,
      meter: { numerator: 4, denominator: 4 },
      tempoQuarterBpm: spec.tempoQuarterBpm,
      bars,
      chords: progression.map((degree) => chordText(diatonicTriad(key, degree))),
    });
  } catch {
    return null;
  }

  // Final check on what is actually heard: a rest can hide a leap that the
  // per-bar checks allowed, so validate the sounding notes end to end.
  const sounding = score.notes.filter((n) => n.pitch).map((n) => n.pitch!.midi);
  for (let i = 1; i < sounding.length; i += 1) {
    if (Math.abs(sounding[i] - sounding[i - 1]) > spec.maxLeapSemitones) return null;
  }

  return {
    id: `gen-d-${seed}`,
    seed,
    generatorVersion: GENERATOR_VERSION,
    level: 'D',
    score,
    degreeText: notesText(score.notes.filter((n) => n.voice === 'melody')),
  };
}

function chordText(symbol: ReturnType<typeof diatonicTriad>): string {
  const suffix = symbol.quality === 'minor' ? 'm' : symbol.quality === 'diminished' ? 'dim' : '';
  const accidental = symbol.root.accidental === 0 ? '' : symbol.root.accidental > 0 ? '#' : 'b';
  return `${symbol.root.letter}${accidental}${suffix}`;
}

function spellMidiInKey(midi: number, key: KeySpec): string {
  const scale = scalePitchClasses(key);
  for (const pc of scale) {
    for (let octave = 2; octave <= 7; octave += 1) {
      if (midiFor(pc.letter, pc.accidental, octave) === midi) {
        return `${pc.letter}${accidentalText(pc.accidental)}${octave}`;
      }
    }
  }
  throw new MusicError(`MIDI ${midi} is not diatonic in the generated key`);
}
