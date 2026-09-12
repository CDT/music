/**
 * A single shared AudioContext, created or resumed only after a deliberate
 * user gesture. Nothing here claims to be an acoustic piano recording.
 */

export type AudioStatus = 'unavailable' | 'idle' | 'suspended' | 'running';

export interface AudioBuses {
  master: GainNode;
  /** Every pitched voice passes through here; the metronome does not. */
  instrument: GainNode;
  melody: GainNode;
  bass: GainNode;
  chord: GainNode;
  metronome: GainNode;
  limiter: DynamicsCompressorNode;
  /** Short room and soundboard resonance, absent if convolution is unavailable. */
  room: ConvolverNode | null;
}

type Listener = (status: AudioStatus) => void;

class AudioEngine {
  private context: AudioContext | null = null;
  private buses: AudioBuses | null = null;
  private listeners = new Set<Listener>();
  private statusValue: AudioStatus = 'idle';

  get status(): AudioStatus {
    return this.statusValue;
  }

  get supported(): boolean {
    return typeof window !== 'undefined'
      && (typeof window.AudioContext !== 'undefined'
        || typeof (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext !== 'undefined');
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.statusValue);
    return () => { this.listeners.delete(listener); };
  }

  private setStatus(status: AudioStatus) {
    if (this.statusValue === status) return;
    this.statusValue = status;
    for (const listener of this.listeners) listener(status);
  }

  /** Must be called from a user gesture handler. */
  async enable(): Promise<boolean> {
    if (!this.supported) {
      this.setStatus('unavailable');
      return false;
    }
    try {
      if (!this.context) {
        const Ctor = window.AudioContext
          ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.context = new Ctor();
        this.buses = createBuses(this.context);
      }
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }
      this.setStatus(this.context.state === 'running' ? 'running' : 'suspended');
      return this.context.state === 'running';
    } catch {
      this.setStatus('unavailable');
      return false;
    }
  }

  /** The live context, or null when audio has not been enabled yet. */
  get ctx(): AudioContext | null {
    return this.context;
  }

  get bus(): AudioBuses | null {
    return this.buses;
  }

  get currentTime(): number {
    return this.context?.currentTime ?? 0;
  }

  setMasterVolume(value: number) {
    if (!this.buses || !this.context) return;
    const clamped = Math.min(1, Math.max(0, value));
    this.buses.master.gain.setTargetAtTime(clamped, this.context.currentTime, 0.02);
  }

  /** Re-check the context's state, e.g. after the tab regains focus. */
  refreshStatus() {
    if (!this.context) return;
    this.setStatus(this.context.state === 'running' ? 'running' : 'suspended');
  }
}

/**
 * A short, dark impulse response generated on the spot: no asset download, and
 * enough early reflection to keep notes from sounding like bare oscillators in
 * a vacuum. Real pianos are heard through a soundboard and a room.
 */
function createRoomImpulse(context: AudioContext, seconds = 1.6): AudioBuffer {
  const length = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    let previous = 0;
    for (let i = 0; i < length; i += 1) {
      const progress = i / length;
      const decay = Math.pow(1 - progress, 2.8);
      const white = Math.random() * 2 - 1;
      // Low-pass the tail so the resonance stays warm rather than hissy.
      previous = previous * 0.62 + white * 0.38;
      data[i] = previous * decay;
    }
  }
  return buffer;
}

/** Wire a quiet resonance send, or nothing at all where convolution is missing. */
function connectRoom(context: AudioContext, source: AudioNode, destination: AudioNode): ConvolverNode | null {
  try {
    const room = context.createConvolver();
    room.buffer = createRoomImpulse(context);
    const send = context.createGain();
    send.gain.value = 0.16;
    source.connect(send).connect(room).connect(destination);
    return room;
  } catch {
    // Convolution is unavailable; the dry path alone still sounds correct.
    return null;
  }
}

function createBuses(context: AudioContext): AudioBuses {
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -10;
  limiter.knee.value = 12;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.2;
  limiter.connect(context.destination);

  const master = context.createGain();
  master.gain.value = 0.7;
  master.connect(limiter);

  // Soundboard colour: a little warmth in the lower middle, a gentle roll-off
  // on top so the upper partials never turn glassy.
  const soundboard = context.createBiquadFilter();
  soundboard.type = 'peaking';
  soundboard.frequency.value = 260;
  soundboard.Q.value = 0.8;
  soundboard.gain.value = 2.2;

  const air = context.createBiquadFilter();
  air.type = 'highshelf';
  air.frequency.value = 5200;
  air.gain.value = -3.5;

  const instrument = context.createGain();
  instrument.gain.value = 1;
  instrument.connect(soundboard).connect(air);
  air.connect(master);

  const room = connectRoom(context, air, master);

  const make = (gain: number, destination: AudioNode) => {
    const node = context.createGain();
    node.gain.value = gain;
    node.connect(destination);
    return node;
  };

  return {
    limiter,
    master,
    instrument,
    room,
    melody: make(0.85, instrument),
    bass: make(0.5, instrument),
    chord: make(0.42, instrument),
    metronome: make(0.35, master),
  };
}

export const audioEngine = new AudioEngine();
