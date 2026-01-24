/**
 * Store for notification preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { debouncedStorage } from '../utils/debouncedStorage';

interface NotificationPreferencesStore {
  favoriteArtistsNotifications: boolean;
  importantFestivalNotifications: boolean;
  favoriteArtistsNotificationLeadMinutes: number;
  setFavoriteArtistsNotifications: (enabled: boolean) => void;
  setImportantFestivalNotifications: (enabled: boolean) => void;
  setFavoriteArtistsNotificationLeadMinutes: (minutes: number) => void;
}

export const useNotificationPreferencesStore = create<NotificationPreferencesStore>()(
  persist(
    (set) => ({
      favoriteArtistsNotifications: true,
      importantFestivalNotifications: false,
      favoriteArtistsNotificationLeadMinutes: 10,

      setFavoriteArtistsNotifications: (enabled: boolean) => {
        set({ favoriteArtistsNotifications: enabled });
      },

      setImportantFestivalNotifications: (enabled: boolean) => {
        set({ importantFestivalNotifications: enabled });
      },

      setFavoriteArtistsNotificationLeadMinutes: (minutes: number) => {
        set({ favoriteArtistsNotificationLeadMinutes: minutes });
      },
    }),
    {
      name: 'notification-preferences-storage',
      storage: createJSONStorage(() => debouncedStorage),
    }
  )
);

