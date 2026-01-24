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
  setFavorites: (eventIds: string[]) => void;
  clearAll: () => void;
  clearLegacyArtists: () => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favoriteEvents: [],
      favoriteArtists: [],

      toggleEventFavorite: (eventId: string) => {
        const normalizedId = String(eventId).trim();
        if (!normalizedId) {
          return;
        }

        set((state) => {
          const isFavorite = state.favoriteEvents.includes(normalizedId);
          return {
            favoriteEvents: isFavorite
              ? state.favoriteEvents.filter((id) => id !== normalizedId)
              : [...state.favoriteEvents, normalizedId],
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
        const normalizedId = String(eventId).trim();
        if (!normalizedId) {
          return false;
        }
        return get().favoriteEvents.includes(normalizedId);
      },

      isArtistFavorite: (artistId: string) => {
        return get().favoriteArtists.includes(artistId);
      },

      setFavorites: (eventIds: string[]) => {
        const normalized = Array.from(
          new Set(
            eventIds
              .map((id) => String(id).trim())
              .filter((id) => id.length > 0)
          )
        );

        set({
          favoriteEvents: normalized,
        });
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
