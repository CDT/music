import { describe, expect, it } from 'vitest';
import {
  chordPitchClasses, chordSymbolText, compactVoicing, describePitchAgainstChord,
  diatonicTriad, parseChordSymbol, romanFor,
} from '../domain/harmony';
import { pitchClassName, pitchName } from '../domain/pitch';
import { majorKey, minorKey } from '../domain/score';

const spell = (text: string) => chordPitchClasses(parseChordSymbol(text)).map(pitchClassName).join(' ');

describe('harmony', () => {
  it('spells the C major diatonic chords used by the course', () => {
    expect(spell('C')).toBe('C E G');
    expect(spell('F')).toBe('F A C');
    expect(spell('G')).toBe('G B D');
    expect(spell('Am')).toBe('A C E');
    expect(spell('Dm')).toBe('D F A');
    expect(spell('Em')).toBe('E G B');
    expect(spell('G7')).toBe('G B D F');
    expect(spell('Cadd9')).toBe('C E G D');
  });

  it('spells E major in A minor with G sharp, and the natural-minor v without it', () => {
    expect(spell('E')).toBe('E G# B');
    expect(spell('Em')).toBe('E G B');
    const naturalV = diatonicTriad(minorKey('A'), 5);
    expect(chordPitchClasses(naturalV).map(pitchClassName).join(' ')).toBe('E G B');
  });

  it('uses correct spellings in sharp and flat keys', () => {
    expect(spell('D')).toBe('D F# A');
    expect(spell('A')).toBe('A C# E');
    expect(spell('Bm')).toBe('B D F#');
    expect(spell('F#m')).toBe('F# A C#');
    expect(spell('Bb')).toBe('Bb D F');
  });

  it('labels Roman numerals by root, not by bass', () => {
    expect(romanFor(parseChordSymbol('G'), majorKey('C'))).toBe('V');
    expect(romanFor(parseChordSymbol('Am'), majorKey('C'))).toBe('vi');
    expect(romanFor(parseChordSymbol('Em'), majorKey('C'))).toBe('iii');
    expect(romanFor(parseChordSymbol('G7'), majorKey('C'))).toBe('V7');
    expect(romanFor(parseChordSymbol('E'), minorKey('A'))).toBe('V');
    expect(romanFor(parseChordSymbol('F'), minorKey('A'))).toBe('VI');
    // C/E is a C major chord in first inversion, never an E chord.
    const slash = parseChordSymbol('C/E');
    expect(chordSymbolText(slash)).toBe('C/E');
    expect(romanFor(slash, majorKey('C'))).toBe('I6');
  });

  it('describes a melody note against a chord factually', () => {
    const f = parseChordSymbol('F');
    expect(describePitchAgainstChord(69, f, majorKey('C'))).toContain('third of F');
    const c = parseChordSymbol('C');
    expect(describePitchAgainstChord(69, c, majorKey('C'))).toContain('outside C');
    expect(describePitchAgainstChord(69, c, majorKey('C'))).toContain('passing or neighbour');
  });

  it('builds compact voicings that ascend inside a comfortable register', () => {
    const voicing = compactVoicing(parseChordSymbol('C'), 48);
    expect(voicing.map(pitchName)).toEqual(['C3', 'E3', 'G3']);
    for (let i = 1; i < voicing.length; i += 1) {
      expect(voicing[i].midi).toBeGreaterThan(voicing[i - 1].midi);
    }
    expect(compactVoicing(parseChordSymbol('G7'), 48).map(pitchName)).toEqual(['G3', 'B3', 'D4', 'F4']);
  });
});
