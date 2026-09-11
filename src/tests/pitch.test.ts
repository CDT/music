import { describe, expect, it } from 'vitest';
import {
  degreeLabel, frequencyOf, keySignature, makePitch, midiFor, parsePitch, pitchClassOf,
  pitchForDegree, pitchIsConsistent, pitchName, scalePitchClasses, spellInKey,
} from '../domain/pitch';
import { majorKey, minorKey } from '../domain/score';

describe('pitch', () => {
  it('maps C4 to MIDI 60 and A4 to 69 at 440 Hz', () => {
    expect(midiFor('C', 0, 4)).toBe(60);
    expect(midiFor('A', 0, 4)).toBe(69);
    expect(frequencyOf(69)).toBeCloseTo(440, 6);
    expect(frequencyOf(60)).toBeCloseTo(261.6256, 3);
  });

  it('keeps F sharp and G flat sounding alike while preserving their spelling', () => {
    const fSharp = makePitch('F', 1, 4);
    const gFlat = makePitch('G', -1, 4);
    expect(fSharp.midi).toBe(gFlat.midi);
    expect(pitchName(fSharp)).toBe('F#4');
    expect(pitchName(gFlat)).toBe('Gb4');
    expect(pitchIsConsistent(fSharp)).toBe(true);
    expect(pitchIsConsistent(gFlat)).toBe(true);
  });

  it('parses pitch tokens and rests', () => {
    expect(parsePitch('C4')?.midi).toBe(60);
    expect(parsePitch('Bb3')?.midi).toBe(58);
    expect(parsePitch('G#4')?.midi).toBe(68);
    expect(parsePitch('r')).toBeNull();
    expect(() => parsePitch('H4')).toThrow();
  });

  it('spells notes according to the destination key', () => {
    expect(pitchName(spellInKey(66, majorKey('D')))).toBe('F#4');
    expect(pitchName(spellInKey(70, majorKey('F')))).toBe('Bb4');
    expect(pitchName(spellInKey(68, minorKey('A')))).toBe('G#4');
  });

  it('builds correct scales and key signatures', () => {
    expect(scalePitchClasses(majorKey('C')).map((p) => p.letter).join('')).toBe('CDEFGAB');
    expect(scalePitchClasses(majorKey('G')).map((p) => p.accidental).join(',')).toBe('0,0,0,0,0,0,1');
    expect(scalePitchClasses(majorKey('F')).map((p) => p.accidental).join(',')).toBe('0,0,0,-1,0,0,0');
    expect(keySignature(majorKey('D'))).toBe(2);
    expect(keySignature(majorKey('F'))).toBe(-1);
    expect(keySignature(minorKey('A'))).toBe(0);
  });

  it('labels degrees with alterations rather than assuming major', () => {
    const key = minorKey('A');
    expect(degreeLabel(makePitch('C', 0, 5), key)).toBe('b3');
    expect(degreeLabel(makePitch('G', 0, 4), key)).toBe('b7');
    expect(degreeLabel(makePitch('G', 1, 4), key)).toBe('7');
    expect(degreeLabel(makePitch('A', 0, 4), key)).toBe('1');
    expect(degreeLabel(makePitch('F', 1, 4), majorKey('C'))).toBe('#4');
  });

  it('marks octave displacement in degree labels', () => {
    const key = majorKey('C');
    expect(degreeLabel(makePitch('C', 0, 5), key, 60)).toBe("1'");
    expect(degreeLabel(makePitch('B', 0, 3), key, 60)).toBe('7,');
  });

  it('resolves degrees back to pitches', () => {
    expect(pitchForDegree('1', majorKey('C'), 60).midi).toBe(60);
    expect(pitchForDegree('3', majorKey('C'), 60).midi).toBe(64);
    expect(pitchName(pitchForDegree('7', majorKey('G'), 67))).toBe('F#5');
    expect(pitchName(pitchForDegree('b3', majorKey('C'), 60))).toBe('Eb4');
    expect(pitchClassOf(pitchForDegree("1'", majorKey('C'), 60).midi)).toBe(0);
    expect(pitchForDegree("1'", majorKey('C'), 60).midi).toBe(72);
  });
});
