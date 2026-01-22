/**
 * Centralized hook for managing favorites
 * Provides unified API for toggling and checking favorites (artists and events)
 */

import { useCallback, useEffect, useRef } from 'react';
import { useFavoritesStore } from '../stores/favoritesStore';
import { notificationService } from '../services/notifications';
import { useNotificationPreferencesStore } from '../stores/notificationPreferencesStore';
import { useTimeline } from '../contexts/TimelineContext';
import { loadFromCache } from '../utils/cacheManager';
import type { Artist } from '../types';

export type FavoriteType = 'artist' | 'event';

interface TimelineEvent {
  id?: string;
  name?: string;
  interpret_id?: number;
  stage?: string;
  stage_name?: string;
  start?: string;
  end?: string;
  [key: string]: unknown;
}

interface UseFavoritesResult {
  // Toggle functions
  toggleArtist: (artistId: string) => void;
  toggleEvent: (eventId: string) => void;
  toggle: (id: string, type: FavoriteType) => void;

  // Check functions
  isArtistFavorite: (artistId: string) => boolean;
  isEventFavorite: (eventId: string) => boolean;
  isFavorite: (id: string, type: FavoriteType) => boolean;

  // Direct access to store values (if needed)
  favoriteArtists: string[];
  favoriteEvents: string[];

  // Clear all favorites
  clearAll: () => void;
}

/**
 * Centralized hook for favorites management
 * Provides clean API for toggling and checking favorites across the app
 */
export function useFavorites(): UseFavoritesResult {
  const {
    toggleArtistFavorite,
    toggleEventFavorite,
    isArtistFavorite: storeIsArtistFavorite,
    isEventFavorite: storeIsEventFavorite,
    favoriteArtists,
    favoriteEvents,
    clearAll,
  } = useFavoritesStore();

  const { favoriteArtistsNotifications } = useNotificationPreferencesStore();
  const { timelineData } = useTimeline();

  // Sleduj změny v oblíbených interpretech a aktualizuj notifikace
  // Použij ref pro sledování předchozího stavu, aby se neaktualizovalo při každém renderu
  const prevFavoriteArtistsRef = useRef<string>('');
  const prevNotificationsEnabledRef = useRef<boolean | null>(null);
  const isInitialMountRef = useRef(true);

  // Migrace: při prvním načtení přidej eventy pro existující oblíbené interprety s jedním koncertem
  const migrationDoneRef = useRef(false);
  
  useEffect(() => {
    if (migrationDoneRef.current || !timelineData) return;
    
    const migrateExistingFavorites = () => {
      try {

        // Pro všechny existující oblíbené interprety zkontroluj, zda mají jen jeden koncert
        for (const artistId of favoriteArtists) {
          const numericArtistId = parseInt(artistId, 10);
          const artistEvents = (timelineData.events as TimelineEvent[]).filter(
            (event) => event.interpret_id === numericArtistId && event.start && event.id
          );

          // Pokud má interpret jen jeden koncert a ještě nemá event v oblíbených, přidej ho
          if (artistEvents.length === 1 && artistEvents[0].id) {
            const eventId = artistEvents[0].id;
            if (!storeIsEventFavorite(eventId)) {
              toggleEventFavorite(eventId);
            }
          }
        }

        migrationDoneRef.current = true;
      } catch (error) {
        console.warn('Could not migrate existing favorites:', error);
        migrationDoneRef.current = true; // Neopakuj migraci při chybě
      }
    };

    if (favoriteArtists.length > 0) {
      migrateExistingFavorites();
    } else {
      migrationDoneRef.current = true;
    }
  }, [favoriteArtists, storeIsEventFavorite, toggleEventFavorite, timelineData]);

  // Synchronizuj eventy pro interprety s jedním koncertem
  // Při přidání interpreta s jedním koncertem automaticky přidej i event
  // Při odebírání interpreta neodebíráme event automaticky (eventy jsou nyní primární)
  const prevFavoriteArtistsForSyncRef = useRef<string>('');
  const isInitialSyncRef = useRef(true);

  useEffect(() => {
    if (!migrationDoneRef.current || isInitialSyncRef.current) {
      isInitialSyncRef.current = false;
      prevFavoriteArtistsForSyncRef.current = JSON.stringify(favoriteArtists);
      return;
    }

    const syncEventsForSingleConcertArtists = () => {
      try {
        if (!timelineData) return;

        const prevArtists = JSON.parse(prevFavoriteArtistsForSyncRef.current) as string[];
        const addedArtists = favoriteArtists.filter((id) => !prevArtists.includes(id));

        // Pro nově přidané interprety zkontroluj, zda má jen jeden koncert
        for (const artistId of addedArtists) {
          const numericArtistId = parseInt(artistId, 10);
          const artistEvents = (timelineData.events as TimelineEvent[]).filter(
            (event) => event.interpret_id === numericArtistId && event.start && event.id
          );

          // Pokud má interpret jen jeden koncert, automaticky přidej i event
          if (artistEvents.length === 1 && artistEvents[0].id) {
            const eventId = artistEvents[0].id;
            if (!storeIsEventFavorite(eventId)) {
              toggleEventFavorite(eventId);
            }
          }
        }

        prevFavoriteArtistsForSyncRef.current = JSON.stringify(favoriteArtists);
      } catch (error) {
        console.warn('Could not sync events for single-concert artists:', error);
      }
    };

    syncEventsForSingleConcertArtists();
  }, [favoriteArtists, storeIsEventFavorite, toggleEventFavorite, timelineData]);

  useEffect(() => {
    // Při prvním mount neaktualizuj (data se načtou později)
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevFavoriteArtistsRef.current = JSON.stringify(favoriteArtists);
      prevNotificationsEnabledRef.current = favoriteArtistsNotifications;
      return;
    }

    const currentArtistsString = JSON.stringify(favoriteArtists);
    const artistsChanged = prevFavoriteArtistsRef.current !== currentArtistsString;
    const notificationsEnabledChanged = prevNotificationsEnabledRef.current !== favoriteArtistsNotifications;

    // Aktualizuj refy
    prevFavoriteArtistsRef.current = currentArtistsString;
    prevNotificationsEnabledRef.current = favoriteArtistsNotifications;

    // Aktualizuj notifikace pouze pokud se změnilo něco důležitého
    if (!artistsChanged && !notificationsEnabledChanged) {
      return;
    }

    const updateNotifications = async () => {
      // Zkontroluj oprávnění
      const status = await notificationService.getPermissionStatus();
      if (status !== 'granted') {
        return;
      }

      // Pokud jsou notifikace vypnuté, zruš všechny notifikace pro interprety
      if (!favoriteArtistsNotifications) {
        await notificationService.cancelAllArtistNotifications();
        return;
      }

      // Pokud nejsou žádní oblíbení, zruš všechny notifikace pro interprety
      if (favoriteArtists.length === 0) {
        await notificationService.cancelAllArtistNotifications();
        return;
      }

      // Načti seznam interpretů pro získání jmen
      const artists = await loadFromCache<Artist[]>('artists');
      if (!artists || artists.length === 0) {
        return;
      }

      // Aktualizuj notifikace pro všechny oblíbené interprety
      await notificationService.updateAllArtistNotifications(favoriteArtists, artists);
    };

    updateNotifications();
  }, [favoriteArtists, favoriteArtistsNotifications]);

  const toggleArtist = useCallback(
    (artistId: string) => {
      const wasFavorite = storeIsArtistFavorite(artistId);
      toggleArtistFavorite(artistId);
      
      // Pokud se odebere interpret, odeber i všechny jeho eventy z oblíbených
      if (wasFavorite && timelineData) {
        const numericArtistId = parseInt(artistId, 10);
        const artistEvents = (timelineData.events as TimelineEvent[]).filter(
          (event) => event.interpret_id === numericArtistId && event.id
        );
        
        // Odeber všechny eventy tohoto interpreta z oblíbených
        artistEvents.forEach((event) => {
          if (event.id && storeIsEventFavorite(event.id)) {
            toggleEventFavorite(event.id);
          }
        });
      }
      // Synchronizace eventů pro interprety s jedním koncertem při přidání se děje automaticky přes useEffect
      // Notifikace se aktualizují automaticky přes useEffect níže
    },
    [toggleArtistFavorite, storeIsArtistFavorite, storeIsEventFavorite, toggleEventFavorite, timelineData]
  );

  const toggleEvent = useCallback(
    (eventId: string) => {
      if (!timelineData) {
        toggleEventFavorite(eventId);
        return;
      }

      const wasEventFavorite = storeIsEventFavorite(eventId);
      
      // Najdi event a získej interpret_id
      const event = (timelineData.events as TimelineEvent[]).find((e) => e.id === eventId);
      if (!event || !event.interpret_id) {
        toggleEventFavorite(eventId);
        return;
      }

      const artistId = event.interpret_id.toString();
      const isArtistFavorite = storeIsArtistFavorite(artistId);
      const numericArtistId = parseInt(artistId, 10);

      // Pokud odebíráme event, zkontroluj, kolik eventů interpreta zbývá v oblíbených (před změnou)
      let willHaveNoFavoriteEvents = false;
      if (wasEventFavorite && isArtistFavorite) {
        const artistEvents = (timelineData.events as TimelineEvent[]).filter(
          (e) => e.interpret_id === numericArtistId && e.id
        );
        
        // Počítáme eventy v oblíbených kromě toho, který právě odebíráme
        const remainingFavoriteEvents = artistEvents.filter(
          (e) => e.id !== eventId && storeIsEventFavorite(e.id || '')
        );
        
        // Pokud už nezbývají žádné eventy, po odebrání tohoto už nebude žádný
        willHaveNoFavoriteEvents = remainingFavoriteEvents.length === 0;
      }

      // Přidej/odeber event z oblíbených
      toggleEventFavorite(eventId);

      if (!wasEventFavorite) {
        // Event byl přidán do oblíbených
        // Pokud interpret není v oblíbených, přidej ho (to zajistí, že se naplánují notifikace)
        if (!isArtistFavorite) {
          toggleArtistFavorite(artistId);
        }
      } else {
        // Event byl odebrán z oblíbených
        // Pokud už interpret nemá žádné eventy v oblíbených, odeber ho z oblíbených
        if (willHaveNoFavoriteEvents) {
          toggleArtistFavorite(artistId);
        }
      }
    },
    [toggleEventFavorite, toggleArtistFavorite, storeIsEventFavorite, storeIsArtistFavorite, timelineData]
  );

  const toggle = useCallback(
    (id: string, type: FavoriteType) => {
      if (type === 'artist') {
        toggleArtistFavorite(id);
      } else {
        toggleEventFavorite(id);
      }
    },
    [toggleArtistFavorite, toggleEventFavorite]
  );

  const isArtistFavorite = useCallback(
    (artistId: string) => {
      return storeIsArtistFavorite(artistId);
    },
    [storeIsArtistFavorite]
  );

  const isEventFavorite = useCallback(
    (eventId: string) => {
      return storeIsEventFavorite(eventId);
    },
    [storeIsEventFavorite]
  );

  const isFavorite = useCallback(
    (id: string, type: FavoriteType) => {
      if (type === 'artist') {
        return storeIsArtistFavorite(id);
      } else {
        return storeIsEventFavorite(id);
      }
    },
    [storeIsArtistFavorite, storeIsEventFavorite]
  );

  return {
    toggleArtist,
    toggleEvent,
    toggle,
    isArtistFavorite,
    isEventFavorite,
    isFavorite,
    favoriteArtists,
    favoriteEvents,
    clearAll,
  };
}

