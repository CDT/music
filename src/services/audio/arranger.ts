import { bassPitch, compactVoicing, voiceNear } from '../../domain/harmony';
import { barBeats } from '../../domain/rhythm';
import type { AccompanimentPattern, PatternEvent } from '../../content/patterns';
import { patternSupportsMeter } from '../../content/patterns';
import { transposePitchByOctaves } from '../../domain/harmony';
import type { ChordEvent, Pitch, Score, Voice } from '../../domain/types';

export interface ScheduledNote {
  startBeat: number;
  durationBeats: number;
  midi: number;
  voice: Voice;
  velocity: number;
  accent?: boolean;
  /** Source note id, when this came from the written melody. */
  noteId?: string;
}

export class PatternMeterError extends Error {}

/**
 * Realise a chord chart with an accompaniment pattern.
 *
 * The bar-relative rhythmic grid is retained; the active chord is selected at
 * each event onset, sustained harmony is cut at a change, and a quiet bass
 * onset is added at any change that has no pattern event of its own.
 */
export function realiseAccompaniment(
  score: Score,
  pattern: AccompanimentPattern,
): ScheduledNote[] {
  if (!patternSupportsMeter(pattern, score.meter)) {
    throw new PatternMeterError(
      `The ${pattern.label} pattern is written for ${pattern.meters.join(' or ')} and cannot be used in ${score.meter.numerator}/${score.meter.denominator}. Choose a compatible pattern instead.`,
    );
  }
  if (score.chords.length === 0) return [];

  const length = barBeats(score.meter);
  const pickup = score.pickupBeats ?? 0;
  const out: ScheduledNote[] = [];
  const changes = score.chords.map((c) => c.startBeat);

  let previousVoicing: Pitch[] | null = null;
  const voicingFor = (chord: ChordEvent): Pitch[] => {
    const voicing = chord.voicing ?? voiceNear(chord.symbol, previousVoicing);
    previousVoicing = voicing;
    return voicing;
  };
  const voicings = new Map<number, Pitch[]>();
  for (const chord of score.chords) voicings.set(chord.startBeat, voicingFor(chord));

  const chordAtBeat = (beat: number): ChordEvent | null =>
    score.chords.find((c) => beat >= c.startBeat - 1e-9 && beat < c.startBeat + c.durationBeats - 1e-9) ?? null;

  const nextChangeAfter = (beat: number): number => {
    const next = changes.find((b) => b > beat + 1e-9);
    return next ?? score.totalBeats;
  };

  if (pattern.sustained) {
    for (const chord of score.chords) {
      const voicing = voicings.get(chord.startBeat)!;
      for (const pitch of voicing) {
        out.push({
          startBeat: chord.startBeat,
          durationBeats: chord.durationBeats,
          midi: pitch.midi,
          voice: 'chord',
          velocity: 0.5,
        });
      }
      out.push({
        startBeat: chord.startBeat,
        durationBeats: chord.durationBeats,
        midi: bassPitch(chord.symbol).midi,
        voice: 'bass',
        velocity: 0.6,
      });
    }
    return out;
  }

  const barCount = Math.ceil((score.totalBeats - pickup) / length - 1e-9);
  const covered = new Set<number>();

  for (let bar = 0; bar < barCount; bar += 1) {
    const barStart = pickup + bar * length;
    for (const event of pattern.events) {
      const beat = barStart + event.offset;
      if (beat >= score.totalBeats - 1e-9) continue;
      const chord = chordAtBeat(beat);
      if (!chord) continue;
      const voicing = voicings.get(chord.startBeat)!;
      const limit = Math.min(nextChangeAfter(beat), barStart + length, score.totalBeats);
      const duration = Math.max(0.1, Math.min(event.durationBeats, limit - beat));
      covered.add(round(chord.startBeat));
      for (const note of resolveTarget(event, voicing, chord)) {
        out.push({
          startBeat: beat,
          durationBeats: duration,
          midi: note.midi,
          voice: note.voice,
          velocity: event.accent ? 0.72 : 0.58,
          accent: event.accent,
        });
      }
    }
  }

  // A chord change with no pattern event at its onset still needs to be heard.
  for (const chord of score.chords) {
    if (covered.has(round(chord.startBeat))) continue;
    const limit = Math.min(chord.startBeat + chord.durationBeats, score.totalBeats);
    out.push({
      startBeat: chord.startBeat,
      durationBeats: Math.max(0.3, Math.min(0.9, limit - chord.startBeat)),
      midi: bassPitch(chord.symbol).midi,
      voice: 'bass',
      velocity: 0.45,
    });
  }

  return out.sort((a, b) => a.startBeat - b.startBeat);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function resolveTarget(
  event: PatternEvent, voicing: Pitch[], chord: ChordEvent,
): Array<{ midi: number; voice: Voice }> {
  switch (event.target.kind) {
    case 'chord':
      return voicing.map((p) => ({ midi: p.midi, voice: 'chord' as Voice }));
    case 'bass':
      return [{ midi: bassPitch(chord.symbol).midi, voice: 'bass' }];
    case 'fifth': {
      const tones = chord.voicing ?? compactVoicing(chord.symbol, 48);
      const fifth = tones[2] ?? tones[tones.length - 1];
      return [{ midi: fifth.midi, voice: 'chord' }];
    }
    case 'upper-root': {
      const tones = chord.voicing ?? compactVoicing(chord.symbol, 48);
      return [{ midi: transposePitchByOctaves(tones[0], 1).midi, voice: 'chord' }];
    }
    case 'index': {
      const pitch = voicing[Math.min(event.target.index, voicing.length - 1)];
      return [{ midi: pitch.midi, voice: 'chord' }];
    }
  }
}

/** The written melody and any authored bass/chord notes of a score. */
export function melodyNotes(score: Score): ScheduledNote[] {
  return score.notes
    .filter((note) => note.pitch !== null)
    .map((note) => ({
      startBeat: note.startBeat,
      durationBeats: note.durationBeats,
      midi: note.pitch!.midi,
      voice: note.voice,
      velocity: note.velocity ?? (note.voice === 'melody' ? 0.85 : 0.6),
      noteId: note.id,
    }));
}

export interface MixSettings {
  melody: boolean;
  bass: boolean;
  chord: boolean;
}

export const FULL_MIX: MixSettings = { melody: true, bass: true, chord: true };

export function applyMix(notes: ScheduledNote[], mix: MixSettings): ScheduledNote[] {
  return notes.filter((note) => mix[note.voice]);
}
