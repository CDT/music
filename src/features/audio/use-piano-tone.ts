import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../app/use-store';
import { sampleLibrary } from '../../services/audio/samples';
import type { SampleState } from '../../services/audio/samples';
import { audioEngine } from '../../services/audio/context';

export interface PianoTone {
  tone: 'synthesized' | 'recorded';
  samples: SampleState;
  /** Switch instrument. Choosing 'recorded' downloads the pack if it is missing. */
  choose: (tone: 'synthesized' | 'recorded') => void;
  /** Delete the downloaded pack and go back to the synthesized piano. */
  remove: () => void;
}

export function usePianoTone(): PianoTone {
  const { data, store } = useStore();
  const [samples, setSamples] = useState<SampleState>(sampleLibrary.current);
  useEffect(() => sampleLibrary.subscribe(setSamples), []);

  const tone = data.settings.pianoTone;

  const choose = useCallback((next: 'synthesized' | 'recorded') => {
    store.update((draft) => { draft.settings.pianoTone = next; });
    if (next === 'recorded') void sampleLibrary.load();
    else sampleLibrary.unload();
  }, [store]);

  const remove = useCallback(() => {
    store.update((draft) => { draft.settings.pianoTone = 'synthesized'; });
    void sampleLibrary.remove();
  }, [store]);

  return { tone, samples, choose, remove };
}

/**
 * Bring a previously downloaded pack back once sound is running. Decoding needs
 * a live AudioContext, so this waits for the gesture that starts audio rather
 * than fetching anything on page load.
 */
export function useRestorePianoTone(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return undefined;
    // `load` joins a run already in flight and returns early once ready, so
    // repeated status changes cannot start a second download.
    return audioEngine.subscribe((status) => {
      if (status !== 'running' || sampleLibrary.ready) return;
      void sampleLibrary.load();
    });
  }, [enabled]);
}
