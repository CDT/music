import { audioEngine } from './context';
import { noiseBuffer, pianoVoiceSpec } from './instrument';
import type { PianoVoiceSpec } from './instrument';
import { sampleLibrary } from './samples';
import type { Voice } from '../../domain/types';

/**
 * Voice allocation and note events for the synthesized piano.
 *
 * Each note is two slightly detuned string layers sharing a filter that closes
 * as the note settles, an upper-partial layer that fades within a fraction of a
 * second, and a hammer thump at the strike. The tone model itself lives in
 * `instrument.ts`. This is a synthesized instrument, not a piano recording.
 */

const MAX_VOICES = 32;

interface ActiveVoice {
  id: number;
  midi: number;
  startedAt: number;
  /** Audio time the note stops ringing on its own if it is never released. */
  silentAt: number;
  releaseAt: number;
  damp: number;
  sources: AudioScheduledSourceNode[];
  gain: GainNode;
  releasing: boolean;
  stopped: boolean;
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
  /** A firmer touch: brighter and a little louder, as a harder strike is. */
  accent?: boolean;
}

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
    const voice = active[i];
    const finished = voice.releasing
      ? voice.releaseAt + voice.damp + 0.05 < now
      : voice.silentAt < now;
    if (finished) {
      stopVoice(voice, now, true);
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
  if (!context || voice.stopped) return;
  const time = Math.max(when, context.currentTime);
  const fade = immediate ? 0.02 : voice.damp;
  try {
    voice.gain.gain.cancelScheduledValues(time);
    voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, 0.0001), time);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, time + fade);
    for (const source of voice.sources) {
      source.stop(time + fade + 0.02);
    }
  } catch {
    // A voice already stopped; nothing to do.
  }
  voice.stopped = true;
}

export interface VoiceGraph {
  gain: GainNode;
  sources: AudioScheduledSourceNode[];
  spec: PianoVoiceSpec;
  /** Seconds this note stays audible if it is never released. */
  ring: number;
}

/**
 * A note played from the recorded piano, when that optional pack is loaded.
 *
 * The pack holds one medium-strength layer every minor third, so a note is
 * shifted by at most a semitone. The recording carries its own decay; velocity
 * shapes level and, through the tone filter, colour, because a soft note on a
 * real piano is darker and not merely quieter.
 */
function createSampledVoice(
  context: BaseAudioContext,
  destination: AudioNode,
  options: NoteOptions,
  when: number,
  spec: PianoVoiceSpec,
  sampled: { buffer: AudioBuffer; semitones: number },
): VoiceGraph {
  const touch = Math.min(1, Math.max(0.05, options.velocity ?? 0.8));
  const brightness = options.accent ? Math.min(1, touch * 1.15) : touch;

  const source = context.createBufferSource();
  source.buffer = sampled.buffer;
  const rate = Math.pow(2, sampled.semitones / 12);
  source.playbackRate.setValueAtTime(rate, when);

  const tone = context.createBiquadFilter();
  tone.type = 'lowpass';
  tone.Q.setValueAtTime(0.4, when);
  tone.frequency.setValueAtTime(Math.min(1500 + 20000 * brightness * brightness, 18000), when);

  const gain = context.createGain();
  // Matched by ear and by measurement to the synthesized voice, so switching
  // instruments changes colour without changing how loud the app is.
  const peak = 1.6 * Math.pow(touch, 1.3);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.linearRampToValueAtTime(peak, when + 0.004);

  source.connect(tone).connect(gain).connect(destination);
  source.start(when);

  return { gain, sources: [source], spec, ring: sampled.buffer.duration / rate };
}

/**
 * Build one piano note into any audio graph. Kept separate from `playNote` so
 * the same voice can be rendered offline and measured.
 */
export function createVoiceGraph(
  context: BaseAudioContext,
  destination: AudioNode,
  options: NoteOptions,
  when: number,
): VoiceGraph {
  const spec = pianoVoiceSpec(context, options.midi, options.velocity ?? 0.8, options.accent);
  const sampled = sampleLibrary.bufferFor(options.midi);
  if (sampled) return createSampledVoice(context, destination, options, when, spec, sampled);

  const sources: AudioScheduledSourceNode[] = [];

  // Shared tone filter: bright at the strike, closing as the note settles.
  const tone = context.createBiquadFilter();
  tone.type = 'lowpass';
  tone.Q.setValueAtTime(0.6, when);
  tone.frequency.setValueAtTime(spec.cutoff, when);
  tone.frequency.setTargetAtTime(spec.cutoffFloor, when + spec.attack, spec.cutoffTau);

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.linearRampToValueAtTime(spec.peak, when + spec.attack);
  // Two-stage decay: a quick drop from the strike, then the long string tail.
  gain.gain.setTargetAtTime(spec.peak * spec.earlyLevel, when + spec.attack, spec.earlyTau);
  gain.gain.setTargetAtTime(0, when + spec.attack + spec.earlyTau * 2.5, spec.lateTau);
  tone.connect(gain).connect(destination);

  // Two unison string layers a couple of cents apart, so the note beats gently.
  for (const [detune, level] of [[-spec.unisonCents, 1], [spec.unisonCents, 0.85]] as const) {
    const string = context.createOscillator();
    string.setPeriodicWave(spec.core);
    string.frequency.setValueAtTime(spec.frequency, when);
    string.detune.setValueAtTime(detune, when);
    const stringGain = context.createGain();
    stringGain.gain.setValueAtTime(level, when);
    string.connect(stringGain).connect(tone);
    string.start(when);
    sources.push(string);
  }

  // Upper partials: stretched sharp by string stiffness, gone within a moment.
  const bright = context.createOscillator();
  bright.setPeriodicWave(spec.bright);
  bright.frequency.setValueAtTime(spec.frequency, when);
  bright.detune.setValueAtTime(spec.stretchCents, when);
  const brightGain = context.createGain();
  brightGain.gain.setValueAtTime(spec.brightLevel, when);
  brightGain.gain.setTargetAtTime(0, when + spec.attack, spec.brightTau);
  bright.connect(brightGain).connect(tone);
  bright.start(when);
  sources.push(bright);

  // Hammer felt hitting the string: a very short filtered thump.
  if (spec.hammerLevel > 0.001) {
    const hammer = context.createBufferSource();
    hammer.buffer = noiseBuffer(context);
    const hammerFilter = context.createBiquadFilter();
    hammerFilter.type = 'bandpass';
    hammerFilter.frequency.setValueAtTime(spec.hammerFrequency, when);
    hammerFilter.Q.setValueAtTime(0.8, when);
    const hammerGain = context.createGain();
    hammerGain.gain.setValueAtTime(spec.hammerLevel, when);
    hammerGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.045);
    hammer.connect(hammerFilter).connect(hammerGain).connect(gain);
    hammer.start(when);
    hammer.stop(when + 0.08);
    sources.push(hammer);
  }

  return { gain, sources, spec, ring: spec.ring };
}

/** Play one note. Returns a handle that can release a held note. */
export function playNote(options: NoteOptions): { release: (when?: number) => void } | null {
  const context = audioEngine.ctx;
  const bus = busFor(options.voice);
  if (!context || !bus) return null;

  const now = context.currentTime;
  const when = Math.max(options.when ?? now, now);
  reclaimVoices(now);

  const { gain, sources, spec, ring } = createVoiceGraph(context, bus, options, when);

  voiceCounter += 1;
  const voice: ActiveVoice = {
    id: voiceCounter,
    midi: options.midi,
    startedAt: when,
    silentAt: when + ring,
    releaseAt: options.duration ? when + options.duration : Number.POSITIVE_INFINITY,
    damp: spec.damp,
    sources,
    gain,
    releasing: false,
    stopped: false,
  };
  active.push(voice);

  if (options.duration !== undefined) {
    // The key is let go at the end of the note; the damper takes real time to
    // stop the string, longer in the bass than in the treble.
    const end = when + options.duration;
    gain.gain.setTargetAtTime(0, end, spec.damp / 3.5);
    for (const source of sources) {
      try { source.stop(end + spec.damp + 0.08); } catch { /* already stopped */ }
    }
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

/**
 * A short metronome click. A quick pitch drop through a narrow band reads as a
 * wooden tick rather than an electronic beep, and the first beat sits higher.
 */
export function playClick(when: number, kind: 'strong' | 'weak' | 'subdivision') {
  const context = audioEngine.ctx;
  const buses = audioEngine.bus;
  if (!context || !buses) return;
  const time = Math.max(when, context.currentTime);

  const frequency = kind === 'strong' ? 1500 : kind === 'weak' ? 1080 : 880;
  const peak = kind === 'strong' ? 0.4 : kind === 'weak' ? 0.26 : 0.12;
  const length = kind === 'subdivision' ? 0.035 : 0.055;

  const body = context.createGain();
  body.gain.setValueAtTime(0.0001, time);
  body.gain.linearRampToValueAtTime(peak, time + 0.002);
  body.gain.exponentialRampToValueAtTime(0.0001, time + length);
  body.connect(buses.metronome);

  const osc = context.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency * 1.6, time);
  osc.frequency.exponentialRampToValueAtTime(frequency, time + 0.02);
  osc.connect(body);
  osc.start(time);
  osc.stop(time + length + 0.03);

  // A trace of noise at the onset gives the click its wooden edge.
  const tap = context.createBufferSource();
  tap.buffer = noiseBuffer(context);
  const tapFilter = context.createBiquadFilter();
  tapFilter.type = 'bandpass';
  tapFilter.frequency.setValueAtTime(frequency * 2.2, time);
  tapFilter.Q.setValueAtTime(1.2, time);
  const tapGain = context.createGain();
  tapGain.gain.setValueAtTime(peak * 0.5, time);
  tapGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.02);
  tap.connect(tapFilter).connect(tapGain).connect(buses.metronome);
  tap.start(time);
  tap.stop(time + 0.05);
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
