/**
 * Store for tracking notification prompt state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { debouncedStorage } from '../utils/debouncedStorage';

interface NotificationPromptStore {
  notificationPromptShown: boolean;
  lastPromptDate: string | null; // ISO date string
  setPromptShown: (shown: boolean) => void;
  shouldShowPrompt: () => boolean;
  resetDaily: () => void;
}

/**
 * Check if last prompt was shown today
 */
function isToday(dateString: string | null): boolean {
  if (!dateString) return false;
  
  const lastDate = new Date(dateString);
  const today = new Date();
  
  return (
    lastDate.getFullYear() === today.getFullYear() &&
    lastDate.getMonth() === today.getMonth() &&
    lastDate.getDate() === today.getDate()
  );
}

export const useNotificationPromptStore = create<NotificationPromptStore>()(
  persist(
    (set, get) => ({
      notificationPromptShown: false,
      lastPromptDate: null,

      setPromptShown: (shown: boolean) => {
        set({
          notificationPromptShown: shown,
          lastPromptDate: shown ? new Date().toISOString() : get().lastPromptDate,
        });
      },

      shouldShowPrompt: () => {
        const state = get();
        // Show if not shown today (reset daily)
        if (state.lastPromptDate) {
          return !isToday(state.lastPromptDate);
        }
        return !state.notificationPromptShown;
      },

      resetDaily: () => {
        const state = get();
        // Reset if last prompt was from a different day
        if (state.lastPromptDate && !isToday(state.lastPromptDate)) {
          set({
            notificationPromptShown: false,
          });
        }
      },
    }),
    {
      name: 'notification-prompt-storage',
      storage: createJSONStorage(() => debouncedStorage),
    }
  )
);




