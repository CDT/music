import { describe, expect, it } from 'vitest';
import {
  SAMPLE_FILES, SAMPLE_PACK_BYTES, nearestSample,
} from '../services/audio/samples';
import { DEFAULT_SETTINGS, emptyData, validatePersisted } from '../services/storage/schema';
import { frequencyOf } from '../domain/pitch';

describe('the optional recorded-piano pack', () => {
  it('is sampled in minor thirds, so no note shifts by more than a semitone', () => {
    const midis = SAMPLE_FILES.map((file) => file.midi);
    expect(midis).toEqual([...midis].sort((a, b) => a - b));
    for (let i = 1; i < midis.length; i += 1) {
      expect(midis[i] - midis[i - 1]).toBe(3);
    }
    for (let midi = midis[0]; midi <= midis[midis.length - 1]; midi += 1) {
      expect(Math.abs(nearestSample(midi).semitones)).toBeLessThanOrEqual(1);
    }
  });

  it('covers every pitch the course plays, including transposed bass notes', () => {
    const lowest = SAMPLE_FILES[0].midi;
    const highest = SAMPLE_FILES[SAMPLE_FILES.length - 1].midi;
    expect(lowest).toBeLessThanOrEqual(36);
    expect(highest).toBeGreaterThanOrEqual(84);
  });

  it('reports a download size small enough to state honestly in the interface', () => {
    expect(SAMPLE_PACK_BYTES).toBe(SAMPLE_FILES.reduce((sum, f) => sum + f.bytes, 0));
    expect(SAMPLE_PACK_BYTES / 1048576).toBeLessThan(2);
  });

  it('shifts a note from the nearest sample rather than the nearest name', () => {
    // C#4 is one semitone above C4 and two below D#4.
    const { file, semitones } = nearestSample(61);
    expect(file.name).toBe('C4');
    expect(semitones).toBe(1);
    // The playback rate that shift implies matches the pitch it should sound.
    expect(frequencyOf(60) * Math.pow(2, semitones / 12)).toBeCloseTo(frequencyOf(61), 6);
  });
});

describe('the piano tone setting', () => {
  it('defaults to the synthesized piano, so nothing downloads unasked', () => {
    expect(DEFAULT_SETTINGS.pianoTone).toBe('synthesized');
    expect(emptyData('test').settings.pianoTone).toBe('synthesized');
  });

  it('keeps a stored choice and rejects an unknown one', () => {
    const data = emptyData('test');
    const recorded = validatePersisted(
      JSON.parse(JSON.stringify({ ...data, settings: { ...data.settings, pianoTone: 'recorded' } })),
      'test',
    );
    expect(recorded.data.settings.pianoTone).toBe('recorded');
    expect(() => validatePersisted(
      JSON.parse(JSON.stringify({ ...data, settings: { ...data.settings, pianoTone: 'vinyl' } })),
      'test',
    )).toThrow();
  });

  it('falls back to the synthesized piano for data saved before the choice existed', () => {
    const data = emptyData('test') as unknown as { settings: Record<string, unknown> };
    delete data.settings.pianoTone;
    expect(validatePersisted(JSON.parse(JSON.stringify(data)), 'test').data.settings.pianoTone)
      .toBe('synthesized');
  });
});
