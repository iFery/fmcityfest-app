/**
 * Store for tracking notification prompt state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { debouncedStorage } from '../utils/debouncedStorage';

const logStoreDebug = (...args: unknown[]) => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[NotificationPromptStore]', ...args);
  }
};

interface NotificationPromptStore {
  notificationPromptShown: boolean;
  setPromptShown: (shown: boolean) => void;
  shouldShowPrompt: () => boolean;
}

export const useNotificationPromptStore = create<NotificationPromptStore>()(
  persist(
    (set, get) => ({
      notificationPromptShown: false,

      setPromptShown: (shown: boolean) => {
        logStoreDebug('setPromptShown called', { shown });
        set({
          notificationPromptShown: shown,
        });
      },

      shouldShowPrompt: () => {
        const state = get();
        return !state.notificationPromptShown;
      },
    }),
    {
      name: 'notification-prompt-storage',
      storage: createJSONStorage(() => debouncedStorage),
    }
  )
);




