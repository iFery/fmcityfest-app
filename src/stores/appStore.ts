/**
 * Zustand store for global app state
 */

import { create } from 'zustand';
import type { PreloadProgress } from '../services/preloadService';

interface AppStore {
  isInitialized: boolean;
  isPreloaded: boolean;
  initError: string | null;
  preloadProgress: PreloadProgress | null;
  setInitialized: (value: boolean) => void;
  setPreloaded: (value: boolean) => void;
  setInitError: (error: string | null) => void;
  setPreloadProgress: (progress: PreloadProgress | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  isInitialized: false,
  isPreloaded: false,
  initError: null,
  preloadProgress: null,
  setInitialized: (value: boolean) => set({ isInitialized: value }),
  setPreloaded: (value: boolean) => set({ isPreloaded: value }),
  setInitError: (error: string | null) => set({ initError: error }),
  setPreloadProgress: (progress: PreloadProgress | null) => set({ preloadProgress: progress }),
}));

