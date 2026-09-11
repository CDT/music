import { describe, expect, it } from 'vitest';
import { compareChoice, comparePitchSequence, compareRhythm, isAssisted } from '../domain/assessment';

describe('pitch sequence comparison', () => {
  it('scores an exact match', () => {
    const result = comparePitchSequence([60, 62, 60], [60, 62, 60]);
    expect(result.correct).toBe(3);
    expect(result.total).toBe(3);
    expect(result.comparisons.every((c) => c.status === 'correct')).toBe(true);
  });

  it('says whether a wrong note was higher or lower', () => {
    const result = comparePitchSequence([60, 62, 60], [60, 64, 60]);
    expect(result.correct).toBe(2);
    expect(result.comparisons[1].status).toBe('too-high');
    expect(result.comparisons[1].distanceSemitones).toBe(2);
    expect(result.summary).toContain('second note was higher');
  });

  it('reports missing and extra notes explicitly', () => {
    const missing = comparePitchSequence([60, 62, 64], [60, 62]);
    expect(missing.comparisons[2].status).toBe('missing');
    expect(missing.summary).toContain('not played');

    const extra = comparePitchSequence([60, 62], [60, 62, 64]);
    expect(extra.comparisons[2].status).toBe('extra');
    expect(extra.total).toBe(2);
    expect(extra.summary).toContain('extra note');
  });

  it('rejects octave errors by default and accepts them only in the explicit mode', () => {
    const strict = comparePitchSequence([60, 64], [72, 76]);
    expect(strict.correct).toBe(0);
    expect(strict.octaveEquivalent).toBe(false);

    const lenient = comparePitchSequence([60, 64], [72, 76], true);
    expect(lenient.correct).toBe(2);
    expect(lenient.octaveEquivalent).toBe(true);
    expect(lenient.summary).toContain('pitch class');
  });
});

describe('rhythm comparison', () => {
  const options = { tempoQuarterBpm: 60 } as const;

  it('matches evenly spaced taps in spacing mode', () => {
    const result = compareRhythm([0, 1, 2, 4], [1000, 2000, 3000, 5000], options);
    expect(result.scored).toBe(true);
    expect(result.metric).toBe('rhythm-spacing');
    expect(result.correct).toBe(4);
    expect(result.missedOnsets).toBe(0);
    expect(result.unmatchedTaps).toBe(0);
  });

  it('produces no score for a prompt with fewer than two onsets', () => {
    const result = compareRhythm([0], [1000], options);
    expect(result.scored).toBe(false);
    expect(result.summary).toContain('cannot be measured');
  });

  it('handles missing and extra taps one-to-one', () => {
    const missing = compareRhythm([0, 1, 2, 3], [1000, 2000, 4000], options);
    expect(missing.missedOnsets).toBeGreaterThan(0);
    expect(missing.correct).toBeLessThan(4);

    const extra = compareRhythm([0, 1], [1000, 1500, 2000], options);
    expect(extra.unmatchedTaps).toBeGreaterThan(0);
  });

  it('keeps the beat-aligned mode separate, with its own latency setting', () => {
    const result = compareRhythm([0, 1, 2], [500, 1500, 2500], {
      tempoQuarterBpm: 60,
      mode: 'beat-aligned',
      timelineStartMs: 500,
      latencyOffsetMs: 0,
    });
    expect(result.metric).toBe('beat-aligned');
    expect(result.correct).toBe(3);

    const withLatency = compareRhythm([0, 1, 2], [600, 1600, 2600], {
      tempoQuarterBpm: 60,
      mode: 'beat-aligned',
      timelineStartMs: 500,
      latencyOffsetMs: 100,
    });
    expect(withLatency.correct).toBe(3);
  });

  it('describes tiny samples rather than claiming a proficiency level', () => {
    const result = compareRhythm([0, 1], [1000, 2000], options);
    expect(result.summary).toContain('very short sample');
  });
});

describe('choices and assistance', () => {
  it('marks a correct and an incorrect choice with useful text', () => {
    const right = compareChoice('up', 'up');
    expect(right.isCorrect).toBe(true);
    expect(right.correct).toBe(1);

    const wrong = compareChoice('down', 'up', 'The second note rose by a whole tone.');
    expect(wrong.isCorrect).toBe(false);
    expect(wrong.summary).toContain('whole tone');
    expect(wrong.summary).toContain('Listen again');
  });

  it('treats any hint as assistance', () => {
    expect(isAssisted([])).toBe(false);
    expect(isAssisted(['answer-revealed'])).toBe(true);
  });
});
