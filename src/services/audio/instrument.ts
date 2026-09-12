import { frequencyOf } from '../../domain/pitch';

/**
 * A physically informed piano model built from native Web Audio nodes.
 *
 * Real piano tone comes from a handful of measurable behaviours, all of which
 * are cheap to imitate without a recorded sample library:
 *
 * - the hammer strikes about an eighth of the way along the string, which
 *   notches out every eighth partial;
 * - two or three unison strings per note drift a couple of cents apart, which
 *   gives the slow beating that makes a piano sound alive rather than flat;
 * - stiff strings stretch their upper partials sharp (inharmonicity), strongly
 *   in the treble and mildly in the bass;
 * - high partials die away far faster than the fundamental, so a note starts
 *   bright and settles into a warm hum;
 * - the whole note decays from the moment of the strike, quickly at first and
 *   then along a long tail, and a bass note rings many times longer than a
 *   treble note;
 * - the damper takes real time to stop the string, longer for heavy bass
 *   strings than for short treble ones.
 *
 * This is still synthesis, not an acoustic-piano recording, and nothing in the
 * interface claims otherwise.
 */

const LOWEST_MIDI = 21;
const HIGHEST_MIDI = 108;
const GROUP_SIZE = 11;
const GROUP_COUNT = Math.ceil((HIGHEST_MIDI - LOWEST_MIDI + 1) / GROUP_SIZE);

export type WaveKind = 'core' | 'bright';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 0 at the bottom of the keyboard, 1 at the top. */
function registerOf(midi: number): number {
  return clamp((midi - LOWEST_MIDI) / (HIGHEST_MIDI - LOWEST_MIDI), 0, 1);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const waveCache = new WeakMap<BaseAudioContext, Map<string, PeriodicWave>>();
const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();

/**
 * Partial amplitudes for one register. `core` keeps the fundamental and the
 * first few partials that carry the body of the tone; `bright` holds the upper
 * partials that only sound during the attack.
 */
function buildWave(context: BaseAudioContext, centreMidi: number, kind: WaveKind): PeriodicWave {
  const fundamental = frequencyOf(centreMidi);
  const register = registerOf(centreMidi);
  const affordable = Math.max(4, Math.floor(15000 / fundamental));
  const count = Math.min(affordable, Math.round(lerp(26, 7, register)));
  const rolloff = lerp(0.95, 1.75, register);
  // Hammer strike point along the string: roughly an eighth, a little closer to
  // the end in the treble. Partials at multiples of 1/position are notched out.
  const strikePoint = lerp(0.125, 0.1, register);

  const real = new Float32Array(count + 1);
  const imag = new Float32Array(count + 1);
  let energy = 0;
  for (let n = 1; n <= count; n += 1) {
    const notch = Math.abs(Math.sin(Math.PI * n * strikePoint));
    let amplitude = notch / Math.pow(n, rolloff);
    if (kind === 'core') {
      // Body of the tone: fundamental plus the partials that survive longest.
      amplitude *= n <= 5 ? 1 : Math.exp(-(n - 5) * 0.45);
    } else {
      // Attack colour: upper partials only, so the strike sparkles and fades.
      amplitude *= n <= 2 ? 0.05 : 1;
    }
    // Spread the phases so the partials do not all peak together; this keeps the
    // crest factor low without changing the perceived timbre.
    const phase = (n * n * 0.7) % (Math.PI * 2);
    real[n] = amplitude * Math.cos(phase);
    imag[n] = amplitude * Math.sin(phase);
    energy += amplitude * amplitude;
  }

  const scale = energy > 0 ? 1 / (Math.sqrt(energy) * 2.2) : 1;
  for (let n = 1; n <= count; n += 1) {
    real[n] *= scale;
    imag[n] *= scale;
  }
  return context.createPeriodicWave(real, imag, { disableNormalization: true });
}

function waveFor(context: BaseAudioContext, midi: number, kind: WaveKind): PeriodicWave {
  let cache = waveCache.get(context);
  if (!cache) {
    cache = new Map();
    waveCache.set(context, cache);
  }
  const group = clamp(Math.floor((midi - LOWEST_MIDI) / GROUP_SIZE), 0, GROUP_COUNT - 1);
  const key = `${kind}:${group}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const centre = LOWEST_MIDI + group * GROUP_SIZE + GROUP_SIZE / 2;
  const wave = buildWave(context, centre, kind);
  cache.set(key, wave);
  return wave;
}

/** A short mono noise burst, reused for every hammer and damper sound. */
export function noiseBuffer(context: BaseAudioContext): AudioBuffer {
  const cached = noiseCache.get(context);
  if (cached) return cached;
  const length = Math.max(1, Math.floor(context.sampleRate * 0.25));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let previous = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    // Mild smoothing: felt-covered hammers are duller than white noise.
    previous = previous * 0.35 + white * 0.65;
    data[i] = previous;
  }
  noiseCache.set(context, buffer);
  return buffer;
}

export interface PianoVoiceSpec {
  frequency: number;
  core: PeriodicWave;
  bright: PeriodicWave;
  /** Unison detune between the two string layers, in cents. */
  unisonCents: number;
  /** How sharp the upper partials sit, in cents (string stiffness). */
  stretchCents: number;
  attack: number;
  peak: number;
  /** Level the note falls to during the fast first part of the decay. */
  earlyLevel: number;
  earlyTau: number;
  lateTau: number;
  /** Level and decay of the upper-partial layer. */
  brightLevel: number;
  brightTau: number;
  /** Opening and closing of the tone filter. */
  cutoff: number;
  cutoffFloor: number;
  cutoffTau: number;
  /** Hammer thump at the moment of the strike. */
  hammerLevel: number;
  hammerFrequency: number;
  /** Time the damper needs to stop the string once the key is released. */
  damp: number;
  /** How long the note stays audible if it is never released. */
  ring: number;
}

/**
 * Note and touch parameters. Velocity changes brightness as well as level,
 * the way hammer speed does on a real instrument: a soft note is not just a
 * quiet loud note, it is a darker one.
 */
export function pianoVoiceSpec(
  context: BaseAudioContext,
  midi: number,
  velocity: number,
  accent = false,
): PianoVoiceSpec {
  const register = registerOf(midi);
  const frequency = frequencyOf(midi);
  const touch = clamp(velocity, 0.05, 1);
  const brightness = Math.pow(touch, 0.7) * (accent ? 1.18 : 1);

  // Bass notes ring for many seconds; the top octave dies away in about one.
  const decaySixty = lerp(13, 1.1, Math.pow(register, 0.85));
  const lateTau = decaySixty / 6.9;
  const earlyTau = lerp(0.42, 0.1, register);

  return {
    frequency,
    core: waveFor(context, midi, 'core'),
    bright: waveFor(context, midi, 'bright'),
    unisonCents: lerp(0.9, 3.2, register),
    stretchCents: lerp(2, 13, Math.pow(register, 1.4)),
    attack: lerp(0.009, 0.003, register) * (1.25 - 0.35 * touch),
    // A little less weight in the bass keeps chords clear through the limiter.
    peak: lerp(0.2, 0.3, register) * (0.35 + 0.65 * touch),
    earlyLevel: lerp(0.52, 0.34, register),
    earlyTau,
    lateTau,
    brightLevel: lerp(0.5, 0.34, register) * Math.pow(brightness, 1.6),
    brightTau: lerp(0.3, 0.09, register),
    cutoff: clamp(frequency * lerp(6, 12, brightness) + 700 * brightness, 900, 15000),
    cutoffFloor: clamp(frequency * 3.2, 400, 9000),
    cutoffTau: lerp(0.45, 0.14, register),
    hammerLevel: lerp(0.05, 0.028, register) * Math.pow(touch, 1.8),
    hammerFrequency: clamp(frequency * 5, 500, 6500),
    damp: lerp(0.34, 0.07, Math.pow(register, 0.8)),
    ring: Math.min(decaySixty * 1.15, 14),
  };
}
