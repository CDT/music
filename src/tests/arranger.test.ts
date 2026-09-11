import { describe, expect, it } from 'vitest';
import { PatternMeterError, melodyNotes, realiseAccompaniment } from '../services/audio/arranger';
import { patternById, patternsForMeter, patternSupportsMeter } from '../content/patterns';
import { STUDIES } from '../content/studies';
import { barBeats } from '../domain/rhythm';

const s01 = STUDIES.find((s) => s.id === 's01')!.score;
const s02 = STUDIES.find((s) => s.id === 's02')!.score;
const s04 = STUDIES.find((s) => s.id === 's04')!.score;

describe('accompaniment realisation', () => {
  it('keeps every event inside the score and its chord region', () => {
    for (const pattern of patternsForMeter(s01.meter)) {
      const events = realiseAccompaniment(s01, pattern);
      expect(events.length, pattern.id).toBeGreaterThan(0);
      for (const event of events) {
        expect(event.startBeat, pattern.id).toBeGreaterThanOrEqual(0);
        expect(event.startBeat + event.durationBeats, pattern.id)
          .toBeLessThanOrEqual(s01.totalBeats + 1e-6);
        const chord = s01.chords.find(
          (c) => event.startBeat >= c.startBeat - 1e-9
            && event.startBeat < c.startBeat + c.durationBeats - 1e-9,
        );
        expect(chord, `${pattern.id} event at ${event.startBeat}`).toBeDefined();
        // Sustained harmony is cut at the next change rather than spilling over.
        expect(event.startBeat + event.durationBeats, `${pattern.id} at ${event.startBeat}`)
          .toBeLessThanOrEqual(chord!.startBeat + chord!.durationBeats + 1e-6);
      }
    }
  });

  it('does not restart a four-beat pattern mid-bar or spill over the bar line', () => {
    const events = realiseAccompaniment(s02, patternById('bass-chord'));
    const length = barBeats(s02.meter);
    for (const event of events) {
      const barIndex = Math.floor(event.startBeat / length);
      expect(event.startBeat + event.durationBeats)
        .toBeLessThanOrEqual((barIndex + 1) * length + 1e-6);
    }
  });

  it('sounds the mid-bar chord change in S02 bar 7', () => {
    for (const pattern of patternsForMeter(s02.meter)) {
      const events = realiseAccompaniment(s02, pattern);
      const atChange = events.filter((e) => Math.abs(e.startBeat - 26) < 1e-6);
      expect(atChange.length, `${pattern.id} must sound the change at beat 26`).toBeGreaterThan(0);
      // Nothing sustained across the change from the F harmony.
      const spilling = events.filter(
        (e) => e.startBeat < 26 - 1e-9 && e.startBeat + e.durationBeats > 26 + 1e-6,
      );
      expect(spilling, `${pattern.id} sustains across the change`).toEqual([]);
    }
  });

  it('refuses to squeeze a 4/4 pattern into 3/4', () => {
    expect(patternSupportsMeter(patternById('block'), s04.meter)).toBe(false);
    expect(() => realiseAccompaniment(s04, patternById('block'))).toThrow(PatternMeterError);
    expect(() => realiseAccompaniment(s04, patternById('alberti'))).toThrow(/3\/4/);
    // The waltz pattern is the compatible alternative and is offered instead.
    expect(patternsForMeter(s04.meter).map((p) => p.id)).toContain('waltz');
    expect(realiseAccompaniment(s04, patternById('waltz')).length).toBeGreaterThan(0);
  });

  it('refuses to use the waltz pattern in 4/4', () => {
    expect(() => realiseAccompaniment(s01, patternById('waltz'))).toThrow(PatternMeterError);
  });

  it('retriggers the held pattern at every chord change', () => {
    const events = realiseAccompaniment(s02, patternById('held'));
    const onsets = new Set(events.map((e) => e.startBeat));
    for (const chord of s02.chords) {
      expect(onsets, `held at ${chord.startBeat}`).toContain(chord.startBeat);
    }
  });

  it('reads the melody straight from the score', () => {
    const melody = melodyNotes(s01).filter((n) => n.voice === 'melody');
    const written = s01.notes.filter((n) => n.voice === 'melody' && n.pitch);
    expect(melody).toHaveLength(written.length);
    expect(melody[0].midi).toBe(written[0].pitch!.midi);
    expect(melody[0].startBeat).toBe(written[0].startBeat);
  });

  it('keeps bass roots inside MIDI 36 to 55', () => {
    for (const study of STUDIES) {
      for (const pattern of patternsForMeter(study.score.meter)) {
        for (const event of realiseAccompaniment(study.score, pattern)) {
          if (event.voice !== 'bass') continue;
          expect(event.midi, `${study.id} ${pattern.id}`).toBeGreaterThanOrEqual(36);
          expect(event.midi, `${study.id} ${pattern.id}`).toBeLessThanOrEqual(55);
        }
      }
    }
  });
});
