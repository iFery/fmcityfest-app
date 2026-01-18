/**
 * Store for notification preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { debouncedStorage } from '../utils/debouncedStorage';

interface NotificationPreferencesStore {
  favoriteArtistsNotifications: boolean;
  importantFestivalNotifications: boolean;
  setFavoriteArtistsNotifications: (enabled: boolean) => void;
  setImportantFestivalNotifications: (enabled: boolean) => void;
}

export const useNotificationPreferencesStore = create<NotificationPreferencesStore>()(
  persist(
    (set) => ({
      favoriteArtistsNotifications: true,
      importantFestivalNotifications: true,

      setFavoriteArtistsNotifications: (enabled: boolean) => {
        set({ favoriteArtistsNotifications: enabled });
      },

      setImportantFestivalNotifications: (enabled: boolean) => {
        set({ importantFestivalNotifications: enabled });
      },
    }),
    {
      name: 'notification-preferences-storage',
      storage: createJSONStorage(() => debouncedStorage),
    }
  )
);



