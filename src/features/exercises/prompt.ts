import { buildScore } from '../../domain/score';
import { barBeats, parseNotes } from '../../domain/rhythm';
import { notesText } from '../../domain/rhythm';
import type { Exercise, Score } from '../../domain/types';

/** A silent bar carrying only a chord, used to establish a key before a prompt. */
function silentBars(count: number, beats: number): string[] {
  return Array.from({ length: count }, () => `r:${beats}`);
}

/**
 * Build the score that establishes the key for an exercise, played before the
 * prompt itself. Prompts never sound a different pitch from their answer.
 */
export function buildEstablishScore(exercise: Exercise): Score | null {
  const chords = 'establishChords' in exercise ? exercise.establishChords : null;
  if (!chords || chords.length === 0) return null;
  const beats = barBeats(exercise.meter);
  return buildScore({
    id: `${exercise.id}-establish`,
    title: 'Key reference',
    key: exercise.key,
    meter: exercise.meter,
    tempoQuarterBpm: exercise.tempoQuarterBpm,
    bars: silentBars(chords.length, beats),
    chords,
  });
}

/** Build the sounding prompt for an exercise. */
export function buildPromptScore(exercise: Exercise): Score {
  const beats = barBeats(exercise.meter);
  if (exercise.mode === 'chord-quality') {
    return buildScore({
      id: `${exercise.id}-prompt`,
      title: exercise.title,
      key: exercise.key,
      meter: exercise.meter,
      tempoQuarterBpm: exercise.tempoQuarterBpm,
      bars: [`r:${beats}`],
      chords: [exercise.chordText],
    });
  }

  const promptNotes = 'promptNotes' in exercise ? exercise.promptNotes : `r:${beats}`;
  const events = parseNotes(promptNotes);
  const bars: string[] = [];
  let current: string[] = [];
  let total = 0;
  for (const event of events) {
    const token = notesText([event]);
    if (total + event.durationBeats > beats + 1e-9) {
      current.push(`r:${beats - total}`);
      bars.push(current.join(' '));
      current = [];
      total = 0;
    }
    current.push(token);
    total += event.durationBeats;
    if (Math.abs(total - beats) < 1e-9) {
      bars.push(current.join(' '));
      current = [];
      total = 0;
    }
  }
  if (current.length > 0) {
    if (beats - total > 1e-9) current.push(`r:${beats - total}`);
    bars.push(current.join(' '));
  }
  if (bars.length === 0) bars.push(`r:${beats}`);

  const chords = 'promptChords' in exercise && exercise.promptChords.length > 0
    ? padChords(exercise.promptChords, bars.length)
    : undefined;

  return buildScore({
    id: `${exercise.id}-prompt`,
    title: exercise.title,
    key: exercise.key,
    meter: exercise.meter,
    tempoQuarterBpm: exercise.tempoQuarterBpm,
    bars,
    chords,
  });
}

function padChords(chords: string[], barCount: number): string[] {
  if (chords.length >= barCount) return chords.slice(0, barCount);
  const out = [...chords];
  while (out.length < barCount) out.push(chords[chords.length - 1]);
  return out;
}

export function promptAnswerMidis(exercise: Exercise): number[] {
  if (exercise.mode !== 'phrase') return [];
  return exercise.answerMidi;
}
