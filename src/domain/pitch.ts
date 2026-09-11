import type { Accidental, KeySpec, Letter, Pitch, PitchClassSpec } from './types';

export const LETTERS: Letter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/** Semitone offset of each natural letter above C. */
const LETTER_SEMITONES: Record<Letter, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

/** Diatonic index (0..6) of each letter, C = 0. */
const LETTER_STEPS: Record<Letter, number> = {
  C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6,
};

export const MAJOR_OFFSETS = [0, 2, 4, 5, 7, 9, 11] as const;
export const NATURAL_MINOR_OFFSETS = [0, 2, 3, 5, 7, 8, 10] as const;
export const HARMONIC_MINOR_OFFSETS = [0, 2, 3, 5, 7, 8, 11] as const;

export const INTERVAL_NAMES = [
  'unison', 'minor second', 'major second', 'minor third', 'major third',
  'perfect fourth', 'tritone', 'perfect fifth', 'minor sixth', 'major sixth',
  'minor seventh', 'major seventh', 'octave',
];

export class MusicError extends Error {}

export function accidentalToText(accidental: Accidental): string {
  switch (accidental) {
    case -2: return 'bb';
    case -1: return 'b';
    case 0: return '';
    case 1: return '#';
    case 2: return '##';
  }
}

export function pitchClassName(pc: PitchClassSpec): string {
  return pc.letter + accidentalToText(pc.accidental);
}

export function pitchName(pitch: Pitch): string {
  return pitchClassName(pitch) + String(pitch.octave);
}

/** MIDI number a spelled pitch must have. C4 = 60. */
export function midiFor(letter: Letter, accidental: Accidental, octave: number): number {
  return (octave + 1) * 12 + LETTER_SEMITONES[letter] + accidental;
}

export function makePitch(letter: Letter, accidental: Accidental, octave: number): Pitch {
  const midi = midiFor(letter, accidental, octave);
  if (!Number.isInteger(midi) || midi < 0 || midi > 127) {
    throw new MusicError(`Pitch ${letter}${accidentalToText(accidental)}${octave} is outside MIDI 0..127`);
  }
  return { midi, letter, accidental, octave };
}

/** True when the pitch's stored MIDI agrees with its spelling. */
export function pitchIsConsistent(pitch: Pitch): boolean {
  return midiFor(pitch.letter, pitch.accidental, pitch.octave) === pitch.midi;
}

export function pitchClassOf(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

export function frequencyOf(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const SHARP_SPELLING: Array<[Letter, Accidental]> = [
  ['C', 0], ['C', 1], ['D', 0], ['D', 1], ['E', 0], ['F', 0],
  ['F', 1], ['G', 0], ['G', 1], ['A', 0], ['A', 1], ['B', 0],
];
const FLAT_SPELLING: Array<[Letter, Accidental]> = [
  ['C', 0], ['D', -1], ['D', 0], ['E', -1], ['E', 0], ['F', 0],
  ['G', -1], ['G', 0], ['A', -1], ['A', 0], ['B', -1], ['B', 0],
];

/**
 * Parse "C4", "F#3", "Bb5", "G#4" into a spelled Pitch. Returns null for "r".
 */
export function parsePitch(token: string): Pitch | null {
  const text = token.trim();
  if (text === 'r' || text === 'R') return null;
  const match = /^([A-Ga-g])(bb|##|[b#x]?)(-?\d+)$/.exec(text);
  if (!match) throw new MusicError(`Cannot parse pitch token "${token}"`);
  const letter = match[1].toUpperCase() as Letter;
  const accidental = ({ '': 0, '#': 1, x: 2, '##': 2, b: -1, bb: -2 } as Record<string, Accidental>)[match[2]];
  const octave = Number(match[3]);
  return makePitch(letter, accidental, octave);
}

/** Spell a MIDI number inside a key, preferring the key's own accidental direction. */
export function spellInKey(midi: number, key: KeySpec): Pitch {
  const scale = scalePitchClasses(key);
  const pc = pitchClassOf(midi);
  const inScale = scale.find((s) => pitchClassOf(midiFor(s.letter, s.accidental, 4)) === pc);
  if (inScale) {
    const octave = octaveForLetterAndMidi(inScale.letter, inScale.accidental, midi);
    return makePitch(inScale.letter, inScale.accidental, octave);
  }
  const table = keyPrefersFlats(key) ? FLAT_SPELLING : SHARP_SPELLING;
  const [letter, accidental] = table[pc];
  const octave = octaveForLetterAndMidi(letter, accidental, midi);
  return makePitch(letter, accidental, octave);
}

function octaveForLetterAndMidi(letter: Letter, accidental: Accidental, midi: number): number {
  const base = LETTER_SEMITONES[letter] + accidental;
  // (octave + 1) * 12 + base === midi
  return Math.round((midi - base) / 12) - 1;
}

const FLAT_KEY_TONICS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb']);
const FLAT_MINOR_TONICS = new Set(['D', 'G', 'C', 'F', 'Bb', 'Eb', 'Ab']);

export function keyPrefersFlats(key: KeySpec): boolean {
  const name = pitchClassName(key.tonic);
  if (key.tonic.accidental < 0) return true;
  if (key.tonic.accidental > 0) return false;
  return key.mode === 'major' ? FLAT_KEY_TONICS.has(name) : FLAT_MINOR_TONICS.has(name);
}

/**
 * The seven spelled pitch classes of a key's reference scale.
 * Minor uses natural minor; raised sevenths are explicit alterations on notes.
 */
export function scalePitchClasses(key: KeySpec): PitchClassSpec[] {
  const offsets = key.mode === 'major' ? MAJOR_OFFSETS : NATURAL_MINOR_OFFSETS;
  const tonicStep = LETTER_STEPS[key.tonic.letter];
  const tonicSemi = LETTER_SEMITONES[key.tonic.letter] + key.tonic.accidental;
  return offsets.map((offset, degreeIndex) => {
    const letter = LETTERS[(tonicStep + degreeIndex) % 7];
    const naturalSemi = LETTER_SEMITONES[letter];
    const targetSemi = ((tonicSemi + offset) % 12 + 12) % 12;
    let accidental = targetSemi - naturalSemi;
    if (accidental > 6) accidental -= 12;
    if (accidental < -6) accidental += 12;
    if (accidental < -2 || accidental > 2) {
      throw new MusicError(`Key ${pitchClassName(key.tonic)} ${key.mode} needs an unsupported accidental`);
    }
    return { letter, accidental: accidental as Accidental };
  });
}

export function keyName(key: KeySpec): string {
  return `${pitchClassName(key.tonic)} ${key.mode}`;
}

/** Sharps (positive) or flats (negative) in the key signature. */
export function keySignature(key: KeySpec): number {
  const scale = scalePitchClasses(key);
  return scale.reduce((sum, pc) => sum + pc.accidental, 0);
}

export function accidentalsOfKey(key: KeySpec): PitchClassSpec[] {
  return scalePitchClasses(key).filter((pc) => pc.accidental !== 0);
}

/**
 * Degree label of a pitch inside a key: "1", "b3", "#4", "1'", "7,".
 * Octave marks are relative to the octave containing the tonic below the pitch.
 */
export function degreeLabel(pitch: Pitch, key: KeySpec, tonicMidi?: number): string {
  const scale = scalePitchClasses(key);
  const majorScale = scalePitchClasses({ tonic: key.tonic, mode: 'major' });
  const tonicStep = LETTER_STEPS[key.tonic.letter];
  const degreeIndex = ((LETTER_STEPS[pitch.letter] - tonicStep) % 7 + 7) % 7;
  const reference = majorScale[degreeIndex];
  const expectedSemi = pitchClassOf(midiFor(reference.letter, reference.accidental, 4));
  const actualSemi = pitchClassOf(pitch.midi);
  let alter = actualSemi - expectedSemi;
  if (alter > 6) alter -= 12;
  if (alter < -6) alter += 12;
  const prefix = alter === 0 ? '' : alter > 0 ? '#'.repeat(alter) : 'b'.repeat(-alter);
  void scale;
  let mark = '';
  if (tonicMidi !== undefined) {
    const relative = Math.floor((pitch.midi - tonicMidi) / 12);
    if (relative > 0) mark = "'".repeat(relative);
    else if (relative < 0) mark = ','.repeat(-relative);
  }
  return `${prefix}${degreeIndex + 1}${mark}`;
}

/** Pitch for a degree string within a key, in the octave of `tonicMidi`. */
export function pitchForDegree(degree: string, key: KeySpec, tonicMidi: number): Pitch {
  const match = /^([b#]*)(\d)(['`,]*)$/.exec(degree.trim());
  if (!match) throw new MusicError(`Cannot parse degree "${degree}"`);
  const alter = (match[1].match(/#/g)?.length ?? 0) - (match[1].match(/b/g)?.length ?? 0);
  const degreeNumber = Number(match[2]);
  if (degreeNumber < 1 || degreeNumber > 7) throw new MusicError(`Degree ${degree} out of range`);
  const marks = match[3];
  const up = (marks.match(/['`]/g)?.length ?? 0);
  const down = (marks.match(/,/g)?.length ?? 0);

  const scale = scalePitchClasses(key);
  const spec = scale[degreeNumber - 1];
  const letter = spec.letter;
  const accidental = (spec.accidental + alter) as Accidental;
  if (accidental < -2 || accidental > 2) throw new MusicError(`Degree ${degree} needs an unsupported accidental`);

  // Place it in the octave starting at tonicMidi.
  const tonicPc = pitchClassOf(tonicMidi);
  const rawPc = pitchClassOf(midiFor(letter, accidental, 4));
  let above = rawPc - tonicPc;
  if (above < 0) above += 12;
  // Degree 1 with no alteration sits exactly on the tonic.
  const midi = tonicMidi + above + 12 * (up - down);
  const octave = octaveForLetterAndMidi(letter, accidental, midi);
  return makePitch(letter, accidental, octave);
}

export function intervalName(semitones: number): string {
  const abs = Math.abs(semitones);
  if (abs <= 12) return INTERVAL_NAMES[abs];
  const octaves = Math.floor(abs / 12);
  const rest = abs % 12;
  return rest === 0 ? `${octaves} octaves` : `${octaves} octave${octaves > 1 ? 's' : ''} + ${INTERVAL_NAMES[rest]}`;
}

export function contourBetween(a: number, b: number): 'same' | 'up' | 'down' {
  if (a === b) return 'same';
  return b > a ? 'up' : 'down';
}

export function isBlackKey(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(pitchClassOf(midi));
}
