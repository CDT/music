import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CONTENT_VERSION } from '../content/course';
import { LearnerStore } from '../services/storage/store';
import { audioEngine } from '../services/audio/context';
import { StoreContext } from './store-context-value';

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useMemo(
    () => new LearnerStore(import.meta.env.BASE_URL ?? '/', CONTENT_VERSION),
    [],
  );
  const [snapshot, setSnapshot] = useState(() => ({
    data: store.data,
    status: store.status,
    warnings: store.warnings,
  }));

  useEffect(() => store.subscribe(setSnapshot), [store]);

  useEffect(() => {
    const flush = () => store.flush();
    window.addEventListener('beforeunload', flush);
    return () => {
      window.removeEventListener('beforeunload', flush);
      store.dispose();
    };
  }, [store]);

  useEffect(() => {
    audioEngine.setMasterVolume(snapshot.data.settings.masterVolume);
  }, [snapshot.data.settings.masterVolume]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.textScale = snapshot.data.settings.textScale;
    root.dataset.reducedMotion = snapshot.data.settings.reducedMotion;
  }, [snapshot.data.settings.textScale, snapshot.data.settings.reducedMotion]);

  const value = useMemo(
    () => ({ store, ...snapshot }),
    [store, snapshot],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
