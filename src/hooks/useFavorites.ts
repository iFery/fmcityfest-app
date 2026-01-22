/**
 * Centralized hook for managing favorites
 * Provides unified API for toggling and checking favorites (artists and events)
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFavoritesStore } from '../stores/favoritesStore';
import { notificationService } from '../services/notifications';
import { useNotificationPreferencesStore } from '../stores/notificationPreferencesStore';
import { useTimeline } from '../contexts/TimelineContext';

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
  toggleEvent: (eventId: string) => void;
  isArtistFavorite: (artistId: string) => boolean;
  isEventFavorite: (eventId: string) => boolean;
  favoriteArtists: string[];
  favoriteEvents: string[];
  clearAll: () => void;
}

/**
 * Centralized hook for favorites management
 * Provides clean API for toggling and checking favorites across the app
 */
export function useFavorites(): UseFavoritesResult {
  const {
    toggleEventFavorite,
    isEventFavorite: storeIsEventFavorite,
    favoriteArtists: legacyFavoriteArtists,
    favoriteEvents,
    clearAll,
    clearLegacyArtists,
  } = useFavoritesStore();

  const { favoriteArtistsNotifications, favoriteArtistsNotificationLeadMinutes } =
    useNotificationPreferencesStore();
  const { timelineData } = useTimeline();

  // Sleduj změny v oblíbených koncertech a aktualizuj notifikace
  // Použij ref pro sledování předchozího stavu, aby se neaktualizovalo při každém renderu
  const prevFavoriteArtistsRef = useRef<string>('');
  const prevNotificationsEnabledRef = useRef<boolean | null>(null);
  const prevLeadTimeMinutesRef = useRef<number | null>(null);
  const isInitialMountRef = useRef(true);

  const eventIdToArtistId = useMemo(() => {
    const map = new Map<string, string>();
    if (!timelineData) return map;

    const events = timelineData.events as TimelineEvent[];
    for (const event of events) {
      if (event.id && event.interpret_id) {
        map.set(event.id, String(event.interpret_id));
      }
    }

    return map;
  }, [timelineData]);

  const favoriteArtistIdSet = useMemo(() => {
    const set = new Set<string>();
    for (const eventId of favoriteEvents) {
      const artistId = eventIdToArtistId.get(eventId);
      if (artistId) {
        set.add(artistId);
      }
    }
    return set;
  }, [favoriteEvents, eventIdToArtistId]);

  const derivedFavoriteArtists = useMemo(
    () => Array.from(favoriteArtistIdSet),
    [favoriteArtistIdSet]
  );

  // Migrace: při prvním načtení přidej eventy pro existující oblíbené interprety (legacy)
  const migrationDoneRef = useRef(false);
  
  useEffect(() => {
    if (migrationDoneRef.current || !timelineData) return;
    
    const migrateExistingFavorites = () => {
      try {
        if (!legacyFavoriteArtists.length) {
          migrationDoneRef.current = true;
          return;
        }

        // Legacy: pokud byl interpret v oblíbených, přidej všechny jeho koncerty
        for (const artistId of legacyFavoriteArtists) {
          const numericArtistId = parseInt(artistId, 10);
          const artistEvents = (timelineData.events as TimelineEvent[]).filter(
            (event) => event.interpret_id === numericArtistId && event.start && event.id
          );

          for (const event of artistEvents) {
            if (event.id && !storeIsEventFavorite(event.id)) {
              toggleEventFavorite(event.id);
            }
          }
        }

        clearLegacyArtists();
        migrationDoneRef.current = true;
      } catch (error) {
        console.warn('Could not migrate existing favorites:', error);
        migrationDoneRef.current = true; // Neopakuj migraci při chybě
      }
    };

    migrateExistingFavorites();
  }, [legacyFavoriteArtists, storeIsEventFavorite, toggleEventFavorite, timelineData, clearLegacyArtists]);

  useEffect(() => {
    // Při prvním mount neaktualizuj (data se načtou později)
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevFavoriteArtistsRef.current = JSON.stringify(favoriteEvents);
      prevNotificationsEnabledRef.current = favoriteArtistsNotifications;
      prevLeadTimeMinutesRef.current = favoriteArtistsNotificationLeadMinutes;
      return;
    }

    const currentArtistsString = JSON.stringify(favoriteEvents);
    const artistsChanged = prevFavoriteArtistsRef.current !== currentArtistsString;
    const notificationsEnabledChanged = prevNotificationsEnabledRef.current !== favoriteArtistsNotifications;
    const leadTimeChanged = prevLeadTimeMinutesRef.current !== favoriteArtistsNotificationLeadMinutes;

    // Aktualizuj refy
    prevFavoriteArtistsRef.current = currentArtistsString;
    prevNotificationsEnabledRef.current = favoriteArtistsNotifications;
    prevLeadTimeMinutesRef.current = favoriteArtistsNotificationLeadMinutes;

    // Aktualizuj notifikace pouze pokud se změnilo něco důležitého
    if (!artistsChanged && !notificationsEnabledChanged && !leadTimeChanged) {
      return;
    }

    const updateNotifications = async () => {
      // Zkontroluj oprávnění
      const status = await notificationService.getPermissionStatus();
      if (status !== 'granted') {
        return;
      }

      // Pokud jsou notifikace vypnuté, zruš všechny notifikace pro oblíbené
      if (!favoriteArtistsNotifications) {
        await notificationService.cancelAllFavoriteNotifications();
        return;
      }

      // Pokud nejsou žádné oblíbené koncerty, zruš všechny notifikace pro oblíbené
      if (favoriteEvents.length === 0) {
        await notificationService.cancelAllFavoriteNotifications();
        return;
      }

      // Aktualizuj notifikace pro všechny oblíbené koncerty
      await notificationService.updateAllEventNotifications(favoriteEvents);
    };

    updateNotifications();
  }, [favoriteEvents, favoriteArtistsNotifications, favoriteArtistsNotificationLeadMinutes]);

  const toggleEvent = useCallback(
    (eventId: string) => {
      toggleEventFavorite(eventId);
    },
    [toggleEventFavorite]
  );

  const isArtistFavorite = useCallback(
    (artistId: string) => {
      return favoriteArtistIdSet.has(artistId);
    },
    [favoriteArtistIdSet]
  );

  const isEventFavorite = useCallback(
    (eventId: string) => {
      return storeIsEventFavorite(eventId);
    },
    [storeIsEventFavorite]
  );

  return {
    toggleEvent,
    isArtistFavorite,
    isEventFavorite,
    favoriteArtists: derivedFavoriteArtists,
    favoriteEvents,
    clearAll,
  };
}
