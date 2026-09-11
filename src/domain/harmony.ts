import {
  LETTERS, MusicError, makePitch, midiFor, pitchClassName, pitchClassOf,
  scalePitchClasses, spellInKey,
} from './pitch';
import type {
  Accidental, ChordQuality, ChordSymbol, KeySpec, Letter, Pitch, PitchClassSpec,
} from './types';

export const QUALITY_OFFSETS: Record<ChordQuality, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  dominant7: [0, 4, 7, 10],
  add9: [0, 4, 7, 14],
};

export const QUALITY_SUFFIX: Record<ChordQuality, string> = {
  major: '',
  minor: 'm',
  diminished: '°',
  dominant7: '7',
  add9: 'add9',
};

export const QUALITY_LABEL: Record<ChordQuality, string> = {
  major: 'major triad',
  minor: 'minor triad',
  diminished: 'diminished triad',
  dominant7: 'dominant seventh',
  add9: 'added ninth',
};

/** Diatonic letter steps above a root, used to spell chord tones correctly. */
const QUALITY_LETTER_STEPS: Record<ChordQuality, number[]> = {
  major: [0, 2, 4],
  minor: [0, 2, 4],
  diminished: [0, 2, 4],
  dominant7: [0, 2, 4, 6],
  add9: [0, 2, 4, 1],
};

export function chordSymbolText(symbol: ChordSymbol): string {
  const base = pitchClassName(symbol.root) + QUALITY_SUFFIX[symbol.quality];
  return symbol.bass ? `${base}/${pitchClassName(symbol.bass)}` : base;
}

/** Spelled pitch classes of a chord, root first. */
export function chordPitchClasses(symbol: ChordSymbol): PitchClassSpec[] {
  const offsets = QUALITY_OFFSETS[symbol.quality];
  const steps = QUALITY_LETTER_STEPS[symbol.quality];
  const rootLetterIndex = LETTERS.indexOf(symbol.root.letter);
  const rootSemi = pitchClassOf(midiFor(symbol.root.letter, symbol.root.accidental, 4));
  return offsets.map((offset, i) => {
    const letter = LETTERS[(rootLetterIndex + steps[i]) % 7] as Letter;
    const naturalSemi = pitchClassOf(midiFor(letter, 0, 4));
    const target = pitchClassOf(rootSemi + offset);
    let accidental = target - naturalSemi;
    if (accidental > 6) accidental -= 12;
    if (accidental < -6) accidental += 12;
    if (accidental < -2 || accidental > 2) {
      throw new MusicError(`Chord ${chordSymbolText(symbol)} needs an unsupported accidental`);
    }
    return { letter, accidental: accidental as Accidental };
  });
}

export function chordPitchClassNumbers(symbol: ChordSymbol): number[] {
  return chordPitchClasses(symbol).map((pc) => pitchClassOf(midiFor(pc.letter, pc.accidental, 4)));
}

export function chordContainsPitch(symbol: ChordSymbol, midi: number): boolean {
  return chordPitchClassNumbers(symbol).includes(pitchClassOf(midi));
}

const CHORD_TONE_NAMES = ['root', 'third', 'fifth', 'seventh'];
const ADD9_TONE_NAMES = ['root', 'third', 'fifth', 'added ninth'];

/** Describe a melody pitch against a candidate chord, factually. */
export function describePitchAgainstChord(midi: number, symbol: ChordSymbol, key: KeySpec): string {
  const classes = chordPitchClassNumbers(symbol);
  const index = classes.indexOf(pitchClassOf(midi));
  const names = symbol.quality === 'add9' ? ADD9_TONE_NAMES : CHORD_TONE_NAMES;
  const spelled = pitchClassName(spellInKey(midi, key));
  if (index >= 0) {
    return `${spelled} is the ${names[index]} of ${chordSymbolText(symbol)}.`;
  }
  return `${spelled} is outside ${chordSymbolText(symbol)}. It can still work as a passing or neighbour tone.`;
}

/** Place a chord's tones as a compact voicing with its lowest note at or above `minMidi`. */
export function compactVoicing(symbol: ChordSymbol, minMidi = 48, key?: KeySpec): Pitch[] {
  const classes = chordPitchClasses(symbol);
  const pitches: Pitch[] = [];
  let previous = minMidi - 1;
  for (const pc of classes) {
    let octave = Math.floor(minMidi / 12) - 1;
    let midi = midiFor(pc.letter, pc.accidental, octave);
    while (midi <= previous) {
      octave += 1;
      midi = midiFor(pc.letter, pc.accidental, octave);
    }
    pitches.push(makePitch(pc.letter, pc.accidental, octave));
    previous = midi;
  }
  void key;
  return pitches;
}

/** Bass root selected into MIDI 36..55. */
export function bassPitch(symbol: ChordSymbol): Pitch {
  const spec = symbol.bass ?? symbol.root;
  let octave = 2;
  let midi = midiFor(spec.letter, spec.accidental, octave);
  while (midi < 36) { octave += 1; midi = midiFor(spec.letter, spec.accidental, octave); }
  while (midi > 55) { octave -= 1; midi = midiFor(spec.letter, spec.accidental, octave); }
  return makePitch(spec.letter, spec.accidental, octave);
}

/**
 * Voice a chord near a previous voicing to reduce travel, keeping the
 * compact three- or four-note set inside MIDI 48..67.
 */
export function voiceNear(symbol: ChordSymbol, previous: Pitch[] | null): Pitch[] {
  const base = compactVoicing(symbol, 48);
  if (!previous || previous.length === 0) return base;
  const target = previous.reduce((sum, p) => sum + p.midi, 0) / previous.length;
  const candidates: Pitch[][] = [];
  for (let rotation = 0; rotation < base.length; rotation += 1) {
    const rotated = rotateVoicing(base, rotation);
    for (const shift of [-12, 0, 12]) {
      const moved = rotated.map((p) => transposePitchByOctaves(p, shift / 12));
      if (moved[0].midi >= 43 && moved[moved.length - 1].midi <= 72) candidates.push(moved);
    }
  }
  if (candidates.length === 0) return base;
  candidates.sort((a, b) => voicingDistance(a, target) - voicingDistance(b, target));
  return candidates[0];
}

function voicingDistance(voicing: Pitch[], target: number): number {
  const centre = voicing.reduce((sum, p) => sum + p.midi, 0) / voicing.length;
  return Math.abs(centre - target);
}

function rotateVoicing(voicing: Pitch[], rotation: number): Pitch[] {
  if (rotation === 0) return voicing;
  const out = voicing.slice(rotation).concat(
    voicing.slice(0, rotation).map((p) => transposePitchByOctaves(p, 1)),
  );
  return out;
}

export function transposePitchByOctaves(pitch: Pitch, octaves: number): Pitch {
  return makePitch(pitch.letter, pitch.accidental, pitch.octave + octaves);
}

/* ---------- Roman numerals ---------- */

const MAJOR_TRIAD_QUALITIES: ChordQuality[] = [
  'major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished',
];
const MINOR_TRIAD_QUALITIES: ChordQuality[] = [
  'minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major',
];
const UPPER_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/** Diatonic triad on a scale degree (1-based). Minor uses natural minor. */
export function diatonicTriad(key: KeySpec, degree: number): ChordSymbol {
  const scale = scalePitchClasses(key);
  const root = scale[degree - 1];
  const quality = (key.mode === 'major' ? MAJOR_TRIAD_QUALITIES : MINOR_TRIAD_QUALITIES)[degree - 1];
  return { root, quality };
}

/** Roman label for a chord in a key, describing the root's position. */
export function romanFor(symbol: ChordSymbol, key: KeySpec): string {
  const scale = scalePitchClasses(key);
  const rootPc = pitchClassOf(midiFor(symbol.root.letter, symbol.root.accidental, 4));
  let index = scale.findIndex((pc) => pitchClassOf(midiFor(pc.letter, pc.accidental, 4)) === rootPc);
  let prefix = '';
  if (index < 0) {
    // Chromatic root: label by nearest scale letter with an accidental prefix.
    const letterIndex = LETTERS.indexOf(symbol.root.letter);
    const tonicLetterIndex = LETTERS.indexOf(key.tonic.letter);
    index = ((letterIndex - tonicLetterIndex) % 7 + 7) % 7;
    const expected = scale[index];
    const expectedPc = pitchClassOf(midiFor(expected.letter, expected.accidental, 4));
    let alter = rootPc - expectedPc;
    if (alter > 6) alter -= 12;
    if (alter < -6) alter += 12;
    prefix = alter > 0 ? '#'.repeat(alter) : 'b'.repeat(-alter);
  }
  const numeral = UPPER_NUMERALS[index];
  const isLower = symbol.quality === 'minor' || symbol.quality === 'diminished';
  let label = prefix + (isLower ? numeral.toLowerCase() : numeral);
  if (symbol.quality === 'diminished') label += '°';
  if (symbol.quality === 'dominant7') label += '7';
  if (symbol.quality === 'add9') label += 'add9';
  if (symbol.bass) {
    const bassPc = pitchClassOf(midiFor(symbol.bass.letter, symbol.bass.accidental, 4));
    const tones = chordPitchClassNumbers(symbol);
    const position = tones.indexOf(bassPc);
    if (position === 1) label += '6';
    else if (position === 2) label += '64';
    else label += `/${pitchClassName(symbol.bass)}`;
  }
  return label;
}

/* ---------- Parsing chord text ---------- */

const QUALITY_PATTERNS: Array<[RegExp, ChordQuality]> = [
  [/^add9$/i, 'add9'],
  [/^7$/, 'dominant7'],
  [/^dim$|^o$|^°$/i, 'diminished'],
  [/^m$|^min$/, 'minor'],
  [/^$|^maj$/i, 'major'],
];

/** Parse "C", "Am", "G7", "F#m", "Cadd9", "C/E", "Bb". */
export function parseChordSymbol(text: string): ChordSymbol {
  const trimmed = text.trim();
  const [main, bassText] = trimmed.split('/');
  const match = /^([A-G])(bb|##|[b#]?)(.*)$/.exec(main.trim());
  if (!match) throw new MusicError(`Cannot parse chord "${text}"`);
  const root: PitchClassSpec = {
    letter: match[1] as Letter,
    accidental: ({ '': 0, '#': 1, '##': 2, b: -1, bb: -2 } as Record<string, Accidental>)[match[2]],
  };
  const qualityText = match[3].trim();
  const found = QUALITY_PATTERNS.find(([pattern]) => pattern.test(qualityText));
  if (!found) throw new MusicError(`Unsupported chord quality in "${text}"`);
  const symbol: ChordSymbol = { root, quality: found[1] };
  if (bassText) {
    const bassMatch = /^([A-G])(bb|##|[b#]?)$/.exec(bassText.trim());
    if (!bassMatch) throw new MusicError(`Cannot parse bass note in "${text}"`);
    symbol.bass = {
      letter: bassMatch[1] as Letter,
      accidental: ({ '': 0, '#': 1, '##': 2, b: -1, bb: -2 } as Record<string, Accidental>)[bassMatch[2]],
    };
  }
  return symbol;
}

/** Which of the course's candidate chords contain a given pitch class. */
export function chordsContaining(midi: number, candidates: ChordSymbol[]): ChordSymbol[] {
  return candidates.filter((symbol) => chordContainsPitch(symbol, midi));
}
