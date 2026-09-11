import { createContext } from 'react';
import type { LearnerStore } from '../services/storage/store';
import type { PersistedData } from '../domain/types';
import type { StorageStatus } from '../services/storage/store';

export interface StoreContextValue {
  store: LearnerStore;
  data: PersistedData;
  status: StorageStatus;
  warnings: string[];
}

/**
 * Kept in its own module so the provider file exports only components and
 * fast refresh keeps working during development.
 */
export const StoreContext = createContext<StoreContextValue | null>(null);
