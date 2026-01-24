import * as Notifications from 'expo-notifications';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import crashlytics from '@react-native-firebase/crashlytics';
import { handleNotificationNavigation } from './notificationNavigation';
import { TimelineApiResponse } from '../api/endpoints';
import { loadFromCache } from '../utils/cacheManager';
import { ensureFirebaseInitialized, isFirebaseReady, safeMessagingCall } from './firebase';
import { useNotificationPreferencesStore } from '../stores/notificationPreferencesStore';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const getLeadTimeMinutes = () => {
  const minutes = useNotificationPreferencesStore.getState().favoriteArtistsNotificationLeadMinutes;
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 10;
};

/**
 * Configure notification handler
 * Must be called before any notification operations
 * Best practice: Set once at app initialization
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private fcmToken: string | null = null;

  /**
   * Získá FCM token (pro push notifikace)
   */
  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return null;
      }

      // Zajisti, že Firebase je inicializován
      await ensureFirebaseInitialized();
      if (!isFirebaseReady()) {
        console.warn('Firebase not ready after ensureFirebaseInitialized, cannot get token');
        return null;
      }

      // Získá FCM token pomocí safeMessagingCall pro retry logiku
      const token = await safeMessagingCall(async (msg) => {
        return await msg.getToken();
      });

      if (token) {
        this.fcmToken = token;
        return token;
      }

      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      try {
        if (isFirebaseReady()) {
          crashlytics().recordError(error as Error);
        }
      } catch {
        // Ignore Crashlytics errors
      }
      return null;
    }
  }

  /**
   * Nastaví posluchače notifikací
   */
  async setupNotificationListeners() {
    try {
      if (Platform.OS === 'web') {
        return {
          unsubscribeForeground: () => {},
          notificationListener: { remove: () => {} },
        };
      }

      await ensureFirebaseInitialized();
      if (!isFirebaseReady()) {
        console.warn('Firebase not ready after ensureFirebaseInitialized, cannot setup listeners');
        return {
          unsubscribeForeground: () => {},
          notificationListener: { remove: () => {} },
        };
      }

      // Listener pro notifikace, když je aplikace na popředí
      const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
        console.log('Foreground notification received:', remoteMessage);
        
        // Zobrazíme lokální notifikaci pomocí Expo Notifications
        // (FCM foreground notifikace se nezobrazují automaticky na Androidu)
        if (remoteMessage.notification) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: remoteMessage.notification.title || 'Notification',
              body: remoteMessage.notification.body || '',
              data: remoteMessage.data || {},
            },
            trigger: null, // Okamžitě
          });
        }
      });

      // Listener pro kliknutí na notifikaci (když je aplikace na pozadí nebo zavřená)
      const notificationListener = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        handleNotificationNavigation(data);
      });

      return {
        unsubscribeForeground,
        notificationListener,
      };
    } catch (error) {
      console.error('Error setting up notification listeners:', error);
      try {
        if (isFirebaseReady()) {
          crashlytics().recordError(error as Error);
        }
      } catch {
        // Ignore Crashlytics errors
      }
      return {
        unsubscribeForeground: () => {},
        notificationListener: { remove: () => {} },
      };
    }
  }

  /**
   * Požádá o oprávnění k notifikacím
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission not granted');
        return false;
      }

      // If user just granted system notifications, enable in-app notification toggles
      const notificationPreferences = useNotificationPreferencesStore.getState();
      notificationPreferences.setFavoriteArtistsNotifications(true);
      notificationPreferences.setImportantFestivalNotifications(true);

      // Pro Android je potřeba ještě nastavit notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      try {
        if (isFirebaseReady()) {
          crashlytics().recordError(error as Error);
        }
      } catch {
        // Ignore Crashlytics errors
      }
      return false;
    }
  }

  /**
   * Pošle testovací notifikaci
   */
  async sendTestNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Testovací notifikace',
          body: 'Tato notifikace byla odeslána pro testování.',
          data: { test: true },
        },
        trigger: null, // Okamžitě
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      try {
        if (isFirebaseReady()) {
          crashlytics().recordError(error as Error);
        }
      } catch {
        // Ignore Crashlytics errors
      }
      throw error;
    }
  }

  /**
   * Naplánuje testovací notifikaci za určitý počet sekund
   * Užitečné pro testování notifikací když je aplikace zavřená
   */
  async scheduleTestNotification(seconds: number = 10): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Testovací notifikace (naplánovaná)',
          body: `Tato notifikace byla naplánována před ${seconds} sekundami. Aplikace může být zavřená.`,
          data: { 
            test: true,
            scheduled: true,
            scheduledAt: new Date().toISOString(),
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
          repeats: false,
        },
      });
      console.log(`Test notification scheduled for ${seconds} seconds`);
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      try {
        if (isFirebaseReady()) {
          crashlytics().recordError(error as Error);
        }
      } catch {
        // Ignore Crashlytics errors
      }
      throw error;
    }
  }

  /**
   * Zruší registraci FCM tokenu
   */
  async deleteToken(): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        await ensureFirebaseInitialized();
        if (isFirebaseReady()) {
          await safeMessagingCall(async (msg) => {
            await msg.deleteToken();
          });
        }
        this.fcmToken = null;
      }
    } catch (error) {
      console.error('Error deleting FCM token:', error);
      try {
        if (isFirebaseReady()) {
          crashlytics().recordError(error as Error);
        }
      } catch {
        // Ignore Crashlytics errors
      }
    }
  }

  /**
   * Získá aktuální permission status (nepožádá o permission)
   */
  async getPermissionStatus(): Promise<string> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      console.error('Error getting permission status:', error);
      return 'undetermined';
    }
  }

  /**
   * Naplánuje notifikaci pro konkrétní koncert (podle nastaveného předstihu)
   */
  async scheduleEventNotification(
    eventId: string,
    event: {
      id?: string;
      name?: string;
      interpret_id?: number;
      stage?: string;
      stage_name?: string;
      start?: string;
      end?: string;
      [key: string]: unknown;
    },
    artistName?: string
  ): Promise<void> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      if (!event.start) {
        return;
      }

      const eventStart = dayjs(event.start);
      if (!eventStart.isValid()) {
        return;
      }

      const now = dayjs();
      const minTimeOffset = 5; // sekund
      const leadTimeMinutes = getLeadTimeMinutes();
      const notificationTime = eventStart.subtract(leadTimeMinutes, 'minute');
      const minNotificationTime = now.add(minTimeOffset, 'second');
      if (!notificationTime.isAfter(minNotificationTime)) {
        return;
      }

      const notificationDate = notificationTime.toDate();
      if (isNaN(notificationDate.getTime())) {
        return;
      }

      const titleArtistName = artistName || event.name || 'Koncert';
      const contentTitle = `${titleArtistName} začíná za ${leadTimeMinutes} minut!`;
      const contentBody =
        event.name || `${titleArtistName} na ${event.stage_name || event.stage || 'pódiu'}`;

      await Notifications.scheduleNotificationAsync({
        identifier: `favorite_event_${eventId}`,
        content: {
          title: contentTitle,
          body: contentBody,
          data: {
            type: 'artist',
            artistId: event.interpret_id ? String(event.interpret_id) : undefined,
            artistName: titleArtistName,
            eventId: event.id || eventId,
            eventName: event.name,
            stage: event.stage_name || event.stage,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationDate,
        },
      });
    } catch (error) {
      console.error(`Error scheduling notification for event ${eventId}:`, error);
      try {
        if (isFirebaseReady()) {
          crashlytics().recordError(error as Error);
        }
      } catch {
        // Ignore Crashlytics errors
      }
    }
  }

  /**
   * Naplánuje notifikace pro interpreta - podle nastaveného předstihu
   */
  async scheduleArtistNotifications(artistId: string, artistName: string): Promise<void> {
    try {
      // Zkontroluj oprávnění
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      // Načti timeline data
      const timelineData = await loadFromCache<TimelineApiResponse>('timeline');
      if (!timelineData || !timelineData.events) {
        return;
      }

      const numericArtistId = parseInt(artistId, 10);
      const now = dayjs();
      // Minimální odstup pro naplánování notifikace - zabraňuje okamžitému zobrazení
      const minTimeOffset = 5; // sekund

      // Najdi všechny koncerty tohoto interpreta
      const artistEvents = timelineData.events.filter(
        (event) => event.interpret_id === numericArtistId && event.start
      );

      // Naplánuj notifikaci podle nastaveného předstihu
      const leadTimeMinutes = getLeadTimeMinutes();
      for (const event of artistEvents) {
        if (!event.start) continue;

        // Parsuj datum eventu - API vrací ISO 8601 string (může být UTC nebo místní čas)
        // Použij dayjs, který automaticky rozpozná formát
        const eventStart = dayjs(event.start);
        
        // Ověř, že datum je validní
        if (!eventStart.isValid()) {
          continue;
        }

        const notificationTime = eventStart.subtract(leadTimeMinutes, 'minute');

        // Naplánuj pouze budoucí notifikace, které jsou alespoň minTimeOffset sekund v budoucnosti
        // To zabraňuje okamžitému zobrazení notifikace
        const minNotificationTime = now.add(minTimeOffset, 'second');
        if (notificationTime.isAfter(minNotificationTime)) {
          const notificationId = `artist_${artistId}_event_${event.id || event.start}`;

          // Převod na Date objekt pro trigger - používáme date místo seconds pro lepší spolehlivost s dlouhými odloženími
          const notificationDate = notificationTime.toDate();
          
          // Ověř, že datum je validní a v budoucnosti
          if (isNaN(notificationDate.getTime())) {
            continue;
          }

          // Ověř, že datum je v budoucnosti (s minimálním odstupem)
          if (notificationDate.getTime() <= minNotificationTime.toDate().getTime()) {
            continue;
          }

          try {
            // Ujistíme se, že Android notification channel existuje (pro Android 8.0+)
            if (Platform.OS === 'android') {
              try {
                await Notifications.setNotificationChannelAsync('default', {
                  name: 'Default',
                  importance: Notifications.AndroidImportance.MAX,
                  vibrationPattern: [0, 250, 250, 250],
                  lightColor: '#002239',
                  sound: 'default',
                });
              } catch {
                // Ignore channel errors
              }
            }
            
            // Použijeme objekt formát pro trigger - toto by mělo fungovat spolehlivě
            await Notifications.scheduleNotificationAsync({
              identifier: notificationId,
              content: {
                title: `${artistName} začíná za ${leadTimeMinutes} minut!`,
                body: event.name || `${artistName} na ${event.stage_name || event.stage || 'pódiu'}`,
                data: {
                  type: 'artist',
                  artistId: artistId,
                  artistName: artistName,
                  eventId: event.id || String(event.start),
                  eventName: event.name,
                  stage: event.stage_name || event.stage,
                },
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: notificationDate,
              },
            });
          } catch (error) {
            console.error(`Error scheduling notification for artist ${artistName}:`, error);
            try {
              if (isFirebaseReady()) {
                crashlytics().recordError(error as Error);
              }
            } catch {
              // Ignore Crashlytics errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Error scheduling artist notifications:', error);
      try {
        if (isFirebaseReady()) {
          crashlytics().recordError(error as Error);
        }
      } catch {
        // Ignore Crashlytics errors
      }
    }
  }

  /**
   * Zruší všechny naplánované notifikace pro interpreta
   */
  async cancelArtistNotifications(artistId: string): Promise<void> {
    try {
      // Získej všechny naplánované notifikace
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      // Najdi a zruš všechny notifikace pro tohoto interpreta
      const notificationsToCancel = scheduledNotifications.filter(
        (notification) => {
          const data = notification.content.data as Record<string, unknown> | undefined;
          return data?.artistId === artistId || notification.identifier.startsWith(`artist_${artistId}_`);
        }
      );

      // Zruš každou notifikaci
      for (const notification of notificationsToCancel) {
        try {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        } catch (error) {
          console.error(`Error cancelling notification ${notification.identifier}:`, error);
        }
      }
    } catch (error) {
      console.error('Error cancelling artist notifications:', error);
      try {
        if (isFirebaseReady()) {
          crashlytics().recordError(error as Error);
        }
      } catch {
        // Ignore Crashlytics errors
      }
    }
  }

  /**
   * Zruší všechny naplánované notifikace pro interprety
   * Používá se když se vypnou notifikace pro oblíbené interprety
   */
  async cancelAllArtistNotifications(): Promise<void> {
    try {
      // Zkontroluj oprávnění
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      // Zruš všechny existující notifikace typu 'artist'
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        const data = notification.content.data as Record<string, unknown> | undefined;
        if (data?.type === 'artist') {
          try {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          } catch (error) {
            console.error(`Error cancelling notification ${notification.identifier}:`, error);
          }
        }
      }

    } catch (error) {
      console.error('Error cancelling all artist notifications:', error);
      try {
        if (isFirebaseReady()) {
          crashlytics().recordError(error as Error);
        }
      } catch {
        // Ignore Crashlytics errors
      }
    }
  }

  /**
   * Zruší všechny naplánované notifikace pro oblíbené koncerty
   */
  async cancelAllFavoriteNotifications(): Promise<void> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      for (const notification of scheduledNotifications) {
        const data = notification.content.data as Record<string, unknown> | undefined;
        const isFavoriteNotification =
          data?.type === 'artist' ||
          (typeof notification.identifier === 'string' &&
            notification.identifier.startsWith('favorite_event_'));

        if (isFavoriteNotification) {
          try {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          } catch (error) {
            console.error(`Error cancelling notification ${notification.identifier}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error cancelling all favorite notifications:', error);
      try {
        if (isFirebaseReady()) {
          crashlytics().recordError(error as Error);
        }
      } catch {
        // Ignore Crashlytics errors
      }
    }
  }

  /**
   * Aktualizuje notifikace pro všechny oblíbené koncerty
   */
  async updateAllEventNotifications(favoriteEventIds: string[]): Promise<void> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      await this.cancelAllFavoriteNotifications();

      const timelineData = await loadFromCache<TimelineApiResponse>('timeline');
      if (!timelineData || !timelineData.events) {
        return;
      }

      const artists = await loadFromCache<{ id: string; name: string }[]>('artists');
      const artistNameMap = new Map<string, string>();
      if (artists) {
        for (const artist of artists) {
          artistNameMap.set(String(artist.id), artist.name);
        }
      }

      const events = timelineData.events as {
        id?: string;
        name?: string;
        interpret_id?: number;
        stage?: string;
        stage_name?: string;
        start?: string;
        end?: string;
        [key: string]: unknown;
      }[];

      const uniqueEventIds = Array.from(new Set(favoriteEventIds));
      for (const eventId of uniqueEventIds) {
        const event = events.find((e) => e.id === eventId);
        if (!event) continue;

        const artistId = event.interpret_id ? String(event.interpret_id) : undefined;
        const artistName = artistId ? artistNameMap.get(artistId) : undefined;

        await this.scheduleEventNotification(eventId, event, artistName);
      }
    } catch (error) {
      console.error('Error updating all event notifications:', error);
      try {
        if (isFirebaseReady()) {
          crashlytics().recordError(error as Error);
        }
      } catch {
        // Ignore Crashlytics errors
      }
    }
  }

  /**
   * Aktualizuje notifikace pro všechny oblíbené interprety
   * Volá se při změně oblíbených nebo při aktualizaci timeline
   * Zruší všechny existující notifikace typu 'artist' a naplánuje nové pouze pro oblíbené interprety
   */
  async updateAllArtistNotifications(favoriteArtistIds: string[], artists: { id: string; name: string }[]): Promise<void> {
    try {
      // Zkontroluj oprávnění
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      // Zruš všechny existující notifikace typu 'artist'
      // (to zahrnuje i ty pro interprety, kteří byli odebráni z oblíbených)
      await this.cancelAllArtistNotifications();

      // Naplánuj nové notifikace pouze pro aktuální oblíbené interprety
      for (const artistId of favoriteArtistIds) {
        const artist = artists.find((a) => a.id === artistId);
        if (artist) {
          await this.scheduleArtistNotifications(artistId, artist.name);
        }
      }
    } catch (error) {
      console.error('Error updating all artist notifications:', error);
      try {
        if (isFirebaseReady()) {
          crashlytics().recordError(error as Error);
        }
      } catch {
        // Ignore Crashlytics errors
      }
    }
  }
}

export const notificationService = new NotificationService();
