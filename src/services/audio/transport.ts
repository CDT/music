import { barBeats, beatsToSeconds, pulsePositions } from '../../domain/rhythm';
import type { Meter, Score } from '../../domain/types';
import { audioEngine } from './context';
import { playClick, playNote, stopAllVoices } from './synth';
import {
  FULL_MIX, applyMix, melodyNotes, realiseAccompaniment,
} from './arranger';
import type { MixSettings, ScheduledNote } from './arranger';
import type { AccompanimentPattern } from '../../content/patterns';

const LOOKAHEAD_SECONDS = 0.1;
const TICK_MS = 25;

export interface PlayOptions {
  score: Score;
  pattern?: AccompanimentPattern | null;
  mix?: MixSettings;
  tempoQuarterBpm?: number;
  /** Inclusive 1-based bar range. */
  firstBar?: number;
  lastBar?: number;
  loop?: boolean;
  countInBars?: 0 | 1 | 2;
  metronome?: boolean;
  subdivision?: boolean;
  onBeat?: (beat: number) => void;
  onNote?: (note: ScheduledNote) => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
}

export interface TransportState {
  playing: boolean;
  scoreId: string | null;
  beat: number;
  generation: number;
}

type Listener = (state: TransportState) => void;

class Transport {
  private generation = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private frame: number | null = null;
  private listeners = new Set<Listener>();
  private state: TransportState = { playing: false, scoreId: null, beat: 0, generation: 0 };

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => { this.listeners.delete(listener); };
  }

  private emit(next: Partial<TransportState>) {
    this.state = { ...this.state, ...next };
    for (const listener of this.listeners) listener(this.state);
  }

  get playing(): boolean {
    return this.state.playing;
  }

  /** Stop everything: scheduling, sounding voices, highlights and callbacks. */
  stop() {
    this.generation += 1;
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
    if (this.frame !== null) { cancelAnimationFrame(this.frame); this.frame = null; }
    stopAllVoices();
    this.emit({ playing: false, beat: 0, generation: this.generation });
  }

  async play(options: PlayOptions): Promise<void> {
    this.stop();
    const ok = await audioEngine.enable();
    const context = audioEngine.ctx;
    if (!ok || !context) {
      options.onError?.('Sound is not available yet. Use Enable sound, then try again.');
      return;
    }

    const generation = this.generation;
    const score = options.score;
    const tempo = options.tempoQuarterBpm ?? score.tempoQuarterBpm;
    const length = barBeats(score.meter);
    const pickup = score.pickupBeats ?? 0;
    const totalBars = Math.ceil((score.totalBeats - pickup) / length - 1e-9);
    const firstBar = Math.min(Math.max(options.firstBar ?? 1, 1), totalBars);
    const lastBar = Math.min(Math.max(options.lastBar ?? totalBars, firstBar), totalBars);
    const rangeStart = firstBar === 1 ? 0 : pickup + (firstBar - 1) * length;
    const rangeEnd = pickup + lastBar * length;

    let notes: ScheduledNote[] = melodyNotes(score);
    if (options.pattern) {
      try {
        notes = notes.concat(realiseAccompaniment(score, options.pattern));
      } catch (error) {
        options.onError?.(error instanceof Error ? error.message : String(error));
        return;
      }
    }
    notes = applyMix(notes, options.mix ?? FULL_MIX)
      .filter((n) => n.startBeat >= rangeStart - 1e-9 && n.startBeat < rangeEnd - 1e-9)
      .map((n) => ({
        ...n,
        startBeat: n.startBeat - rangeStart,
        durationBeats: Math.min(n.durationBeats, rangeEnd - n.startBeat),
      }))
      .sort((a, b) => a.startBeat - b.startBeat);

    const bodyBeats = rangeEnd - rangeStart;
    const countInBars = options.countInBars ?? 0;
    const countInBeats = countInBars * length;
    const startTime = context.currentTime + 0.12;

    this.emit({ playing: true, scoreId: score.id, beat: 0, generation });

    let cycle = 0;
    let noteCursor = 0;
    let clickCursor = 0;
    const clicks = buildClicks(score.meter, countInBeats, bodyBeats, options.metronome ?? false, options.subdivision ?? false);

    const cycleBeats = countInBeats + bodyBeats;

    const tick = () => {
      if (generation !== this.generation) return;
      const horizon = context.currentTime + LOOKAHEAD_SECONDS;

      const scheduleCycle = (cycleIndex: number) => {
        const cycleOrigin = startTime + beatsToSeconds(
          cycleIndex === 0 ? 0 : countInBeats + (cycleIndex - 1) * bodyBeats + (cycleIndex >= 1 ? 0 : 0),
          tempo,
        );
        return cycleOrigin;
      };
      void scheduleCycle;

      // Origin of the current cycle's body (count-in only precedes cycle 0).
      const bodyOrigin = startTime + beatsToSeconds(countInBeats + cycle * bodyBeats, tempo);

      while (clickCursor < clicks.length) {
        const click = clicks[clickCursor];
        const time = cycle === 0
          ? startTime + beatsToSeconds(click.beat, tempo)
          : bodyOrigin + beatsToSeconds(click.beat - countInBeats, tempo);
        if (click.beat < countInBeats && cycle > 0) { clickCursor += 1; continue; }
        if (time > horizon) break;
        playClick(time, click.kind);
        clickCursor += 1;
      }

      while (noteCursor < notes.length) {
        const note = notes[noteCursor];
        const time = bodyOrigin + beatsToSeconds(note.startBeat, tempo);
        if (time > horizon) break;
        playNote({
          midi: note.midi,
          when: time,
          duration: beatsToSeconds(note.durationBeats, tempo),
          velocity: note.velocity,
          voice: note.voice,
          accent: note.accent,
        });
        options.onNote?.(note);
        noteCursor += 1;
      }

      const cycleEnd = bodyOrigin + beatsToSeconds(bodyBeats, tempo);
      if (noteCursor >= notes.length && context.currentTime >= cycleEnd - LOOKAHEAD_SECONDS) {
        if (options.loop) {
          cycle += 1;
          noteCursor = 0;
          clickCursor = clicks.findIndex((c) => c.beat >= countInBeats);
          if (clickCursor < 0) clickCursor = clicks.length;
        } else if (context.currentTime >= cycleEnd + 0.15) {
          this.stop();
          options.onEnd?.();
        }
      }
    };

    const follow = () => {
      if (generation !== this.generation) return;
      const elapsed = context.currentTime - startTime;
      const beats = (elapsed * tempo) / 60;
      const positionInCycle = beats < countInBeats
        ? beats - countInBeats
        : ((beats - countInBeats) % (cycleBeats - countInBeats || 1));
      this.emit({ beat: positionInCycle });
      options.onBeat?.(positionInCycle);
      this.frame = requestAnimationFrame(follow);
    };

    tick();
    this.timer = setInterval(tick, TICK_MS);
    this.frame = requestAnimationFrame(follow);
  }
}

interface Click { beat: number; kind: 'strong' | 'weak' | 'subdivision'; }

function buildClicks(
  meter: Meter, countInBeats: number, bodyBeats: number, metronome: boolean, subdivision: boolean,
): Click[] {
  const length = barBeats(meter);
  const pulses = pulsePositions(meter);
  const clicks: Click[] = [];
  const emitBar = (origin: number) => {
    pulses.forEach((offset, index) => {
      clicks.push({ beat: origin + offset, kind: index === 0 ? 'strong' : 'weak' });
    });
    if (subdivision) {
      for (let beat = 0.5; beat < length; beat += 0.5) {
        if (!pulses.some((p) => Math.abs(p - beat) < 1e-9)) {
          clicks.push({ beat: origin + beat, kind: 'subdivision' });
        }
      }
    }
  };
  for (let origin = 0; origin < countInBeats - 1e-9; origin += length) emitBar(origin);
  if (metronome) {
    for (let origin = countInBeats; origin < countInBeats + bodyBeats - 1e-9; origin += length) emitBar(origin);
  }
  return clicks.sort((a, b) => a.beat - b.beat);
}

export const transport = new Transport();

/** Play a single chord or note immediately (previews, piano monitoring). */
export async function previewPitches(
  midis: number[], durationSeconds = 1.2, voice: 'melody' | 'chord' = 'chord',
): Promise<boolean> {
  const ok = await audioEngine.enable();
  if (!ok) return false;
  const now = audioEngine.currentTime;
  midis.forEach((midi, index) => {
    playNote({
      midi,
      when: now + index * 0.004,
      duration: durationSeconds,
      velocity: voice === 'melody' ? 0.85 : 0.55,
      voice,
    });
  });
  return true;
}
