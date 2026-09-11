import { useContext } from 'react';
import { StoreContext } from './store-context-value';
import type { StoreContextValue } from './store-context-value';
import type { AppSettings } from '../domain/types';

export function useStore(): StoreContextValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used inside StoreProvider');
  return value;
}

export function useSettings() {
  const { data, store } = useStore();
  return {
    settings: data.settings,
    update: (patch: Partial<AppSettings>) => {
      store.update((draft) => {
        draft.settings = { ...draft.settings, ...patch };
      });
    },
  };
}
