import { frequencyOf } from '../../domain/pitch';
import { audioEngine } from './context';
import type { Voice } from '../../domain/types';

/**
 * A gentle synthesized keyboard tone: a triangle fundamental plus a quieter
 * sine harmonic. This is a synthesized sound, not a recorded piano.
 */

const MAX_VOICES = 32;

interface ActiveVoice {
  id: number;
  startedAt: number;
  releaseAt: number;
  oscillators: OscillatorNode[];
  gain: GainNode;
  releasing: boolean;
}

let voiceCounter = 0;
const active: ActiveVoice[] = [];

export interface NoteOptions {
  midi: number;
  /** Audio-context time to start. Defaults to now. */
  when?: number;
  /** Seconds. Omit for a held note released manually. */
  duration?: number;
  velocity?: number;
  voice?: Voice | 'metronome';
  /** Slightly brighter tone for accents. */
  accent?: boolean;
}

const ATTACK = 0.008;
const DECAY = 0.22;
const SUSTAIN = 0.55;
const RELEASE = 0.12;

function busFor(voice: NoteOptions['voice']): GainNode | null {
  const buses = audioEngine.bus;
  if (!buses) return null;
  switch (voice) {
    case 'bass': return buses.bass;
    case 'chord': return buses.chord;
    case 'metronome': return buses.metronome;
    default: return buses.melody;
  }
}

function reclaimVoices(now: number) {
  for (let i = active.length - 1; i >= 0; i -= 1) {
    if (active[i].releaseAt + RELEASE + 0.05 < now) {
      stopVoice(active[i], now, true);
      active.splice(i, 1);
    }
  }
  if (active.length >= MAX_VOICES) {
    // Release the oldest releasing voice first, then the oldest voice.
    const index = active.findIndex((v) => v.releasing);
    const victim = index >= 0 ? index : 0;
    stopVoice(active[victim], now, true);
    active.splice(victim, 1);
  }
}

function stopVoice(voice: ActiveVoice, when: number, immediate = false) {
  const context = audioEngine.ctx;
  if (!context) return;
  const time = Math.max(when, context.currentTime);
  try {
    voice.gain.gain.cancelScheduledValues(time);
    voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, 0.0001), time);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, time + (immediate ? 0.02 : RELEASE));
    for (const osc of voice.oscillators) {
      osc.stop(time + (immediate ? 0.04 : RELEASE + 0.02));
    }
  } catch {
    // A voice already stopped; nothing to do.
  }
}

/** Play one note. Returns a handle that can release a held note. */
export function playNote(options: NoteOptions): { release: (when?: number) => void } | null {
  const context = audioEngine.ctx;
  const bus = busFor(options.voice);
  if (!context || !bus) return null;

  const now = context.currentTime;
  const when = Math.max(options.when ?? now, now);
  reclaimVoices(now);

  const frequency = frequencyOf(options.midi);
  const velocity = Math.min(1, Math.max(0.05, options.velocity ?? 0.8));
  const peak = 0.32 * velocity;

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.linearRampToValueAtTime(peak, when + ATTACK);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak * SUSTAIN, 0.0002), when + ATTACK + DECAY);
  gain.connect(bus);

  const fundamental = context.createOscillator();
  fundamental.type = 'triangle';
  fundamental.frequency.setValueAtTime(frequency, when);

  const harmonic = context.createOscillator();
  harmonic.type = 'sine';
  harmonic.frequency.setValueAtTime(frequency * 2, when);
  const harmonicGain = context.createGain();
  harmonicGain.gain.setValueAtTime(options.accent ? 0.28 : 0.18, when);
  harmonic.connect(harmonicGain).connect(gain);

  fundamental.connect(gain);
  fundamental.start(when);
  harmonic.start(when);

  voiceCounter += 1;
  const voice: ActiveVoice = {
    id: voiceCounter,
    startedAt: when,
    releaseAt: options.duration ? when + options.duration : Number.POSITIVE_INFINITY,
    oscillators: [fundamental, harmonic],
    gain,
    releasing: false,
  };
  active.push(voice);

  if (options.duration !== undefined) {
    const end = when + options.duration;
    gain.gain.setTargetAtTime(0.0001, end, RELEASE / 3);
    fundamental.stop(end + RELEASE + 0.05);
    harmonic.stop(end + RELEASE + 0.05);
    voice.releasing = true;
  }

  return {
    release: (at?: number) => {
      const time = at ?? context.currentTime;
      voice.releaseAt = time;
      voice.releasing = true;
      stopVoice(voice, time);
    },
  };
}

/** A short metronome click. The first beat uses a higher, brighter tone. */
export function playClick(when: number, kind: 'strong' | 'weak' | 'subdivision') {
  const context = audioEngine.ctx;
  const buses = audioEngine.bus;
  if (!context || !buses) return;
  const time = Math.max(when, context.currentTime);
  const osc = context.createOscillator();
  const gain = context.createGain();
  const frequency = kind === 'strong' ? 1760 : kind === 'weak' ? 1320 : 990;
  const peak = kind === 'strong' ? 0.5 : kind === 'weak' ? 0.32 : 0.16;
  osc.type = 'square';
  osc.frequency.setValueAtTime(frequency, time);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(peak, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
  osc.connect(gain).connect(buses.metronome);
  osc.start(time);
  osc.stop(time + 0.08);
}

/** Immediately silence every sounding voice. */
export function stopAllVoices() {
  const context = audioEngine.ctx;
  if (!context) {
    active.length = 0;
    return;
  }
  const now = context.currentTime;
  for (const voice of active) stopVoice(voice, now, true);
  active.length = 0;
}

export function activeVoiceCount(): number {
  return active.length;
}
