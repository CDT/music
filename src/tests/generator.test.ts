import { describe, expect, it } from 'vitest';
import {
  AUTHORED_PROMPT_COUNT, GENERATOR_VERSION, LEVELS, LEVEL_D_AUTHORED, SEED_PROMPTS,
  createRandom, generateLevelD, seedPromptToScore,
} from '../domain/generator';
import { validateScore } from '../domain/score';
import { validateBars } from '../domain/rhythm';
import { studyById } from '../content/studies';
import { pitchClassOf } from '../domain/pitch';
import { midiFor } from '../domain/pitch';

describe('deterministic phrase generation', () => {
  it('provides at least 24 authored starter prompts', () => {
    expect(AUTHORED_PROMPT_COUNT).toBeGreaterThanOrEqual(24);
    expect(new Set(SEED_PROMPTS.map((p) => p.id)).size).toBe(SEED_PROMPTS.length);
    for (const authored of LEVEL_D_AUTHORED) {
      expect(studyById(authored.scoreId), authored.id).toBeDefined();
    }
  });

  it('builds valid scores from every authored seed', () => {
    for (const prompt of SEED_PROMPTS) {
      const score = seedPromptToScore(prompt);
      expect(validateScore(score), prompt.id).toEqual([]);
      for (const bar of validateBars(score)) expect(bar.ok, `${prompt.id} bar ${bar.barIndex}`).toBe(true);
      const level = LEVELS[prompt.level];
      const midis = score.notes.filter((n) => n.pitch).map((n) => n.pitch!.midi);
      for (let i = 1; i < midis.length; i += 1) {
        expect(Math.abs(midis[i] - midis[i - 1]), prompt.id).toBeLessThanOrEqual(level.maxLeapSemitones);
      }
    }
  });

  it('does not overwrite a seed that starts above degree 1', () => {
    const seed = SEED_PROMPTS.find((p) => p.id === 'gen-a4')!;
    expect(seed.degrees.startsWith('3:')).toBe(true);
    const score = seedPromptToScore(seed);
    expect(score.notes[0].pitch!.midi).toBe(midiFor('E', 0, 4));
  });

  it('is deterministic: the same seed always gives the same phrase', () => {
    for (const seed of [1, 7, 42, 100, 9999]) {
      const a = generateLevelD(seed);
      const b = generateLevelD(seed);
      expect(a.score.notes.map((n) => `${n.startBeat}:${n.pitch?.midi ?? 'r'}:${n.durationBeats}`))
        .toEqual(b.score.notes.map((n) => `${n.startBeat}:${n.pitch?.midi ?? 'r'}:${n.durationBeats}`));
      expect(a.generatorVersion).toBe(GENERATOR_VERSION);
    }
  });

  it('terminates and stays within bounds across many seeds', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const prompt = generateLevelD(seed);
      expect(validateScore(prompt.score), `seed ${seed}`).toEqual([]);
      for (const bar of validateBars(prompt.score)) {
        expect(bar.ok, `seed ${seed} bar ${bar.barIndex}`).toBe(true);
      }
      const midis = prompt.score.notes.filter((n) => n.pitch).map((n) => n.pitch!.midi);
      for (const midi of midis) {
        expect(midi, `seed ${seed}`).toBeGreaterThanOrEqual(48);
        expect(midi, `seed ${seed}`).toBeLessThanOrEqual(84);
      }
      for (let i = 1; i < midis.length; i += 1) {
        expect(Math.abs(midis[i] - midis[i - 1]), `seed ${seed} leap`).toBeLessThanOrEqual(7);
      }
    }
  });

  it('ends generated four-bar prompts on the tonic', () => {
    for (let seed = 0; seed < 60; seed += 1) {
      const prompt = generateLevelD(seed);
      if (prompt.id.includes('fallback')) continue;
      const sounding = prompt.score.notes.filter((n) => n.pitch);
      const last = sounding[sounding.length - 1].pitch!;
      const tonicPc = pitchClassOf(
        midiFor(prompt.score.key.tonic.letter, prompt.score.key.tonic.accidental, 4),
      );
      expect(pitchClassOf(last.midi), `seed ${seed}`).toBe(tonicPc);
    }
  });

  it('spells generated notes inside the chosen key', () => {
    for (let seed = 0; seed < 40; seed += 1) {
      const prompt = generateLevelD(seed);
      for (const note of prompt.score.notes) {
        if (!note.pitch) continue;
        expect(midiFor(note.pitch.letter, note.pitch.accidental, note.pitch.octave)).toBe(note.pitch.midi);
      }
    }
  });

  it('produces a reproducible random stream', () => {
    const a = createRandom(5);
    const b = createRandom(5);
    const first = [a(), a(), a()];
    const second = [b(), b(), b()];
    expect(first).toEqual(second);
    for (const value of first) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
