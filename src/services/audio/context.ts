/**
 * A single shared AudioContext, created or resumed only after a deliberate
 * user gesture. Nothing here claims to be an acoustic piano recording.
 */

export type AudioStatus = 'unavailable' | 'idle' | 'suspended' | 'running';

export interface AudioBuses {
  master: GainNode;
  melody: GainNode;
  bass: GainNode;
  chord: GainNode;
  metronome: GainNode;
  limiter: DynamicsCompressorNode;
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

  const make = (gain: number) => {
    const node = context.createGain();
    node.gain.value = gain;
    node.connect(master);
    return node;
  };

  return {
    limiter,
    master,
    melody: make(0.85),
    bass: make(0.5),
    chord: make(0.42),
    metronome: make(0.35),
  };
}

export const audioEngine = new AudioEngine();
