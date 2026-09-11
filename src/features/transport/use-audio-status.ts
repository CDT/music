import { useEffect, useState } from 'react';
import { audioEngine } from '../../services/audio/context';
import type { AudioStatus } from '../../services/audio/context';

/** Live Web Audio status, refreshed when the tab regains focus. */
export function useAudioStatus(): AudioStatus {
  const [status, setStatus] = useState<AudioStatus>(audioEngine.status);
  useEffect(() => audioEngine.subscribe(setStatus), []);
  useEffect(() => {
    const refresh = () => audioEngine.refreshStatus();
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, []);
  return status;
}
