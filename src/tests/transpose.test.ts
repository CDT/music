import { describe, expect, it } from 'vitest';
import { STUDIES } from '../content/studies';
import { majorKey, minorKey, transposeScore, validateScore } from '../domain/score';
import { chordSymbolText } from '../domain/harmony';
import { pitchName } from '../domain/pitch';

const s01 = STUDIES.find((s) => s.id === 's01')!.score;
const s03 = STUDIES.find((s) => s.id === 's03')!.score;
const s06 = STUDIES.find((s) => s.id === 's06')!.score;

const melody = (score: typeof s01) => score.notes.filter((n) => n.voice === 'melody');

describe('transposition', () => {
  it('restores the original pitches and rhythm after C → G → C', () => {
    const toG = transposeScore(s01, majorKey('G')).score;
    const back = transposeScore(toG, majorKey('C')).score;
    expect(melody(back).map((n) => n.pitch?.midi)).toEqual(melody(s01).map((n) => n.pitch?.midi));
    expect(melody(back).map((n) => pitchName(n.pitch!))).toEqual(melody(s01).map((n) => pitchName(n.pitch!)));
    expect(back.notes.map((n) => n.durationBeats)).toEqual(s01.notes.map((n) => n.durationBeats));
    expect(back.notes.map((n) => n.startBeat)).toEqual(s01.notes.map((n) => n.startBeat));
  });

  it('spells F sharp in G major wherever degree 7 appears', () => {
    const toG = transposeScore(s01, majorKey('G')).score;
    expect(toG.key.tonic.letter).toBe('G');
    const seventh = melody(toG).filter((n) => n.pitch?.letter === 'F');
    expect(seventh.length).toBeGreaterThan(0);
    for (const note of seventh) expect(note.pitch!.accidental).toBe(1);
    // C major transposes down a perfect fourth to G, so B4 becomes F#4.
    expect(pitchName(melody(toG)[melody(s01).findIndex((n) => pitchName(n.pitch!) === 'B4')].pitch!)).toBe('F#4');
    expect(validateScore(toG)).toEqual([]);
  });

  it('moves chords as well as notes when S06 goes from D to C', () => {
    const toC = transposeScore(s06, majorKey('C')).score;
    expect(toC.chords.map((c) => chordSymbolText(c.symbol)))
      .toEqual(['C', 'G', 'Am', 'Em', 'F', 'C', 'F', 'G']);
    expect(toC.chords.map((c) => c.romanLabel))
      .toEqual(['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V']);
    expect(toC.chords.map((c) => c.startBeat)).toEqual(s06.chords.map((c) => c.startBeat));
    expect(validateScore(toC)).toEqual([]);
  });

  it('carries a deliberate alteration into the new key', () => {
    const toEm = transposeScore(s03, minorKey('E')).score;
    // A minor's raised seventh G sharp becomes E minor's raised seventh D sharp,
    // while E minor's own F sharp is part of the key signature rather than an alteration.
    const raised = melody(toEm).filter((n) => n.pitch?.letter === 'D');
    expect(raised.length).toBe(melody(s03).filter((n) => n.pitch?.accidental === 1).length);
    for (const note of raised) expect(note.pitch!.accidental).toBe(1);
    expect(melody(toEm).some((n) => n.pitch?.letter === 'F' && n.pitch.accidental === 1)).toBe(true);
    expect(chordSymbolText(toEm.chords[2].symbol)).toBe('B');
  });

  it('preserves the F major key signature spelling', () => {
    const toF = transposeScore(s01, majorKey('F')).score;
    const flats = melody(toF).filter((n) => n.pitch?.accidental === -1);
    for (const note of flats) expect(note.pitch!.letter).toBe('B');
    expect(toF.chords.map((c) => chordSymbolText(c.symbol))).toContain('Bb');
  });

  it('reports out-of-range melody notes instead of clamping them', () => {
    const high = transposeScore(s01, majorKey('G'), 3);
    const moved = melody(high.score).map((n) => n.pitch!.midi);
    expect(Math.max(...moved)).toBeGreaterThan(96);
    expect(high.warnings.join(' ')).toContain('octave');
    // Nothing was clamped: the interval between the first two notes is unchanged.
    expect(moved[1] - moved[0]).toBe(
      melody(s01)[1].pitch!.midi - melody(s01)[0].pitch!.midi,
    );
  });
});
