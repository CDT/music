import { barBeats, beatsToSeconds, pulsePositions } from '../../domain/rhythm';
import type { Meter } from '../../domain/types';
import { audioEngine } from './context';
import { playClick } from './synth';

const LOOKAHEAD_SECONDS = 0.1;
const TICK_MS = 25;

export interface MetronomeOptions {
  meter: Meter;
  tempoQuarterBpm: number;
  subdivision: boolean;
  accentFirstBeat: boolean;
  countInBars: 0 | 1 | 2;
  onBeat?: (beatInBar: number, bar: number) => void;
  /** Called once the count-in finishes, with the audio time of the first body beat. */
  onCountInComplete?: (startTime: number) => void;
}

class Metronome {
  private generation = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private frame: number | null = null;
  private runningValue = false;
  private listeners = new Set<(running: boolean) => void>();

  get running(): boolean { return this.runningValue; }

  subscribe(listener: (running: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.runningValue);
    return () => { this.listeners.delete(listener); };
  }

  private setRunning(value: boolean) {
    if (this.runningValue === value) return;
    this.runningValue = value;
    for (const listener of this.listeners) listener(value);
  }

  stop() {
    this.generation += 1;
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
    if (this.frame !== null) { cancelAnimationFrame(this.frame); this.frame = null; }
    this.setRunning(false);
  }

  async start(options: MetronomeOptions): Promise<boolean> {
    this.stop();
    const ok = await audioEngine.enable();
    const context = audioEngine.ctx;
    if (!ok || !context) return false;

    const generation = this.generation;
    const length = barBeats(options.meter);
    const pulses = pulsePositions(options.meter);
    const startTime = context.currentTime + 0.12;
    const countInBeats = options.countInBars * length;
    let announced = options.countInBars === 0;
    if (announced) options.onCountInComplete?.(startTime);

    let nextIndex = 0;
    const beatAt = (index: number): { beat: number; kind: 'strong' | 'weak' | 'subdivision' } => {
      const perBar = options.subdivision ? Math.round(length * 2) : pulses.length;
      const bar = Math.floor(index / perBar);
      const slot = index % perBar;
      if (options.subdivision) {
        const beat = bar * length + slot * 0.5;
        const pulseIndex = pulses.findIndex((p) => Math.abs(p - slot * 0.5) < 1e-9);
        if (pulseIndex === 0) return { beat, kind: options.accentFirstBeat ? 'strong' : 'weak' };
        if (pulseIndex > 0) return { beat, kind: 'weak' };
        return { beat, kind: 'subdivision' };
      }
      const beat = bar * length + pulses[slot];
      return { beat, kind: slot === 0 && options.accentFirstBeat ? 'strong' : 'weak' };
    };

    const tick = () => {
      if (generation !== this.generation) return;
      const horizon = context.currentTime + LOOKAHEAD_SECONDS;
      for (;;) {
        const { beat, kind } = beatAt(nextIndex);
        const time = startTime + beatsToSeconds(beat, options.tempoQuarterBpm);
        if (time > horizon) break;
        playClick(time, kind);
        nextIndex += 1;
        if (!announced && beat >= countInBeats - 1e-9) {
          announced = true;
          options.onCountInComplete?.(time);
        }
      }
    };

    const follow = () => {
      if (generation !== this.generation) return;
      const beats = ((context.currentTime - startTime) * options.tempoQuarterBpm) / 60;
      const bar = Math.floor(beats / length);
      options.onBeat?.(Math.max(0, beats - bar * length), bar);
      this.frame = requestAnimationFrame(follow);
    };

    this.setRunning(true);
    tick();
    this.timer = setInterval(tick, TICK_MS);
    this.frame = requestAnimationFrame(follow);
    return true;
  }
}

export const metronome = new Metronome();
