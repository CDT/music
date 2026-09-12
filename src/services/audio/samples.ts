import { audioEngine } from './context';

/**
 * The optional recorded-piano layer.
 *
 * The app's default instrument is synthesized and needs no download. If you ask
 * for recorded tone, the note files are fetched once, kept in the browser's
 * Cache Storage, and decoded on every later visit without touching the network.
 * Nothing is downloaded until you choose it, and deleting the pack is one
 * button away.
 *
 * Samples: Salamander Grand Piano (Yamaha C5) by Alexander Holm, CC-BY 3.0.
 */

export const SAMPLE_PACK_ID = 'salamander-minor-thirds-v1';
const CACHE_NAME = `inner-melody-piano:${SAMPLE_PACK_ID}`;

export interface SampleFile {
  /** File name under `public/piano`, without its extension. */
  name: string;
  midi: number;
  bytes: number;
}

/**
 * One medium-strength layer every minor third, so no note is ever pitch-shifted
 * by more than a semitone. F#1 to C7 covers every pitch the course plays,
 * including transposed studies and the accompaniment's bass register.
 */
export const SAMPLE_FILES: readonly SampleFile[] = [
  { name: 'Fs1', midi: 30, bytes: 115010 },
  { name: 'A1', midi: 33, bytes: 115061 },
  { name: 'C2', midi: 36, bytes: 110357 },
  { name: 'Ds2', midi: 39, bytes: 110796 },
  { name: 'Fs2', midi: 42, bytes: 102320 },
  { name: 'A2', midi: 45, bytes: 81678 },
  { name: 'C3', midi: 48, bytes: 78036 },
  { name: 'Ds3', midi: 51, bytes: 78717 },
  { name: 'Fs3', midi: 54, bytes: 77933 },
  { name: 'A3', midi: 57, bytes: 74526 },
  { name: 'C4', midi: 60, bytes: 78718 },
  { name: 'Ds4', midi: 63, bytes: 73519 },
  { name: 'Fs4', midi: 66, bytes: 68219 },
  { name: 'A4', midi: 69, bytes: 61148 },
  { name: 'C5', midi: 72, bytes: 68920 },
  { name: 'Ds5', midi: 75, bytes: 58179 },
  { name: 'Fs5', midi: 78, bytes: 51597 },
  { name: 'A5', midi: 81, bytes: 45747 },
  { name: 'C6', midi: 84, bytes: 28065 },
  { name: 'Ds6', midi: 87, bytes: 31395 },
  { name: 'Fs6', midi: 90, bytes: 26478 },
  { name: 'A6', midi: 93, bytes: 30013 },
  { name: 'C7', midi: 96, bytes: 18963 },
];

export const SAMPLE_PACK_BYTES = SAMPLE_FILES.reduce((sum, file) => sum + file.bytes, 0);

export const SAMPLE_ATTRIBUTION = 'Salamander Grand Piano (Yamaha C5) by Alexander Holm, CC-BY 3.0.';

export type SampleStatus =
  /** Never downloaded, or deleted again. */
  | 'absent'
  /** Files are in Cache Storage but not decoded into this page yet. */
  | 'stored'
  | 'downloading'
  | 'decoding'
  | 'ready'
  | 'failed';

export interface SampleState {
  status: SampleStatus;
  /** 0 to 1 while downloading. */
  progress: number;
  message: string | null;
}

/** Nearest sampled note, and how far the player must shift it. */
export function nearestSample(midi: number): { file: SampleFile; semitones: number } {
  let best = SAMPLE_FILES[0];
  for (const file of SAMPLE_FILES) {
    if (Math.abs(file.midi - midi) < Math.abs(best.midi - midi)) best = file;
  }
  return { file: best, semitones: midi - best.midi };
}

function fileUrl(file: SampleFile): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}piano/${file.name}.mp3`;
}

async function openCache(): Promise<Cache | null> {
  // Cache Storage needs a secure context, and private windows may refuse it.
  if (typeof caches === 'undefined') return null;
  try {
    return await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

type Listener = (state: SampleState) => void;

class SampleLibrary {
  private buffers = new Map<number, AudioBuffer>();
  private listeners = new Set<Listener>();
  private state: SampleState = { status: 'absent', progress: 0, message: null };
  private inFlight: Promise<boolean> | null = null;

  get current(): SampleState {
    return this.state;
  }

  /** True once every note is decoded and playable. */
  get ready(): boolean {
    return this.state.status === 'ready';
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => { this.listeners.delete(listener); };
  }

  private setState(next: Partial<SampleState>) {
    this.state = { ...this.state, ...next };
    for (const listener of this.listeners) listener(this.state);
  }

  bufferFor(midi: number): { buffer: AudioBuffer; semitones: number } | null {
    if (!this.ready) return null;
    const { file, semitones } = nearestSample(midi);
    const buffer = this.buffers.get(file.midi);
    return buffer ? { buffer, semitones } : null;
  }

  /** Report whether a previous visit already stored the pack, without fetching it. */
  async checkStored(): Promise<boolean> {
    if (this.state.status === 'ready' || this.state.status === 'downloading') return true;
    const cache = await openCache();
    if (!cache) return false;
    for (const file of SAMPLE_FILES) {
      if (!(await cache.match(fileUrl(file)))) return false;
    }
    if (this.state.status === 'absent') this.setState({ status: 'stored', progress: 1 });
    return true;
  }

  /**
   * Download anything missing, then decode. Calling this again while it runs
   * joins the run in progress rather than starting a second one.
   */
  async load(): Promise<boolean> {
    if (this.ready) return true;
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.run().finally(() => { this.inFlight = null; });
    return this.inFlight;
  }

  private async run(): Promise<boolean> {
    // Decoding needs a running context, which needs a user gesture first.
    const enabled = await audioEngine.enable();
    const context = audioEngine.ctx;
    if (!enabled || !context) {
      this.setState({ status: 'failed', message: 'Sound is not available yet. Use Enable sound, then try again.' });
      return false;
    }

    const cache = await openCache();
    this.setState({ status: 'downloading', progress: 0, message: null });

    const decoded = new Map<number, AudioBuffer>();
    let loadedBytes = 0;
    try {
      for (const file of SAMPLE_FILES) {
        const url = fileUrl(file);
        let response = cache ? await cache.match(url) : undefined;
        if (!response) {
          const fresh = await fetch(url);
          if (!fresh.ok) throw new Error(`${file.name} could not be downloaded (${fresh.status})`);
          if (cache) await cache.put(url, fresh.clone());
          response = fresh;
        }
        const data = await response.arrayBuffer();
        loadedBytes += file.bytes;
        this.setState({ progress: Math.min(1, loadedBytes / SAMPLE_PACK_BYTES) });
        decoded.set(file.midi, await context.decodeAudioData(data));
      }
    } catch (error) {
      this.setState({
        status: 'failed',
        message: error instanceof Error ? error.message : 'The piano samples could not be loaded.',
      });
      return false;
    }

    this.buffers = decoded;
    this.setState({ status: 'ready', progress: 1, message: null });
    return true;
  }

  /** Forget the decoded notes and delete the stored files. */
  async remove(): Promise<void> {
    this.buffers.clear();
    this.setState({ status: 'absent', progress: 0, message: null });
    if (typeof caches === 'undefined') return;
    try {
      await caches.delete(CACHE_NAME);
    } catch {
      // Nothing stored, or storage is unavailable; the synthesized piano plays either way.
    }
  }

  /** Stop using the samples for new notes, but keep the download. */
  unload(): void {
    if (this.buffers.size === 0 && this.state.status !== 'ready') return;
    this.buffers.clear();
    this.setState({ status: 'stored', progress: 1, message: null });
  }
}

export const sampleLibrary = new SampleLibrary();
