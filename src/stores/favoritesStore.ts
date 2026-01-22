/**
 * Zustand store for managing favorites (events and artists)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { debouncedStorage } from '../utils/debouncedStorage';

interface FavoritesStore {
  favoriteEvents: string[];
  favoriteArtists: string[];
  toggleEventFavorite: (eventId: string) => void;
  toggleArtistFavorite: (artistId: string) => void;
  isEventFavorite: (eventId: string) => boolean;
  isArtistFavorite: (artistId: string) => boolean;
  clearAll: () => void;
  clearLegacyArtists: () => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favoriteEvents: [],
      favoriteArtists: [],

      toggleEventFavorite: (eventId: string) => {
        set((state) => {
          const isFavorite = state.favoriteEvents.includes(eventId);
          return {
            favoriteEvents: isFavorite
              ? state.favoriteEvents.filter((id) => id !== eventId)
              : [...state.favoriteEvents, eventId],
          };
        });
      },

      toggleArtistFavorite: (artistId: string) => {
        set((state) => {
          const isFavorite = state.favoriteArtists.includes(artistId);
          return {
            favoriteArtists: isFavorite
              ? state.favoriteArtists.filter((id) => id !== artistId)
              : [...state.favoriteArtists, artistId],
          };
        });
      },

      isEventFavorite: (eventId: string) => {
        return get().favoriteEvents.includes(eventId);
      },

      isArtistFavorite: (artistId: string) => {
        return get().favoriteArtists.includes(artistId);
      },

      clearAll: () => {
        set({
          favoriteEvents: [],
          favoriteArtists: [],
        });
      },
      clearLegacyArtists: () => {
        set({
          favoriteArtists: [],
        });
      },
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => debouncedStorage),
    }
  )
);
