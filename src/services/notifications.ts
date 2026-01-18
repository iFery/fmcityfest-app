import * as Notifications from 'expo-notifications';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import crashlytics from '@react-native-firebase/crashlytics';
import { handleNotificationNavigation } from './notificationNavigation';
import { TimelineApiResponse } from '../api/endpoints';
import { loadFromCache } from '../utils/cacheManager';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

/**
 * Configure notification handler
 * Must be called before any notification operations
 * Best practice: Set once at app initialization
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private fcmToken: string | null = null;

  /**
   * Požádá o oprávnění k notifikacím
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      crashlytics().recordError(error as Error);
      return false;
    }
  }

  /**
   * Získá FCM token pro zařízení (pokud má permission)
   * Nepožádá o oprávnění - použijte requestPermissions() před tím
   */
  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        console.warn('FCM not supported on web');
        return null;
      }

      // Zkontroluje oprávnění (nepožádá)
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permission not granted, skipping token');
        return null;
      }

      // Získá FCM token
      const token = await messaging().getToken();
      this.fcmToken = token;
      
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      crashlytics().recordError(error as Error);
      return null;
    }
  }

  /**
   * Nastaví listenery pro notifikace
   * Poznámka: Background message handler musí být registrován v index.js
   */
  setupNotificationListeners() {
    // Listener pro notifikace, když je aplikace na popředí
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground notification received:', remoteMessage);
      
      // Zobrazí lokální notifikaci
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title || 'Nová notifikace',
          body: remoteMessage.notification?.body || '',
          data: remoteMessage.data,
        },
        trigger: null, // Okamžitě
      });
    });

    // Listener pro kliknutí na notifikaci
    // Works for both foreground and background/closed app states
    const notificationListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      
      if (data) {
        // Use navigation helper with queue system
        // No delay needed - queue handles timing
        handleNotificationNavigation(data);
      }
    });

    return {
      unsubscribeForeground,
      notificationListener,
    };
  }

  /**
   * Odešle testovací notifikaci (pro testování)
   */
  async sendTestNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Testovací notifikace',
          body: 'Toto je testovací notifikace z aplikace FMCityFest',
          data: { test: true },
        },
        trigger: null, // Okamžitě
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      crashlytics().recordError(error as Error);
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
          seconds: seconds,
        },
      });
      console.log(`Test notification scheduled for ${seconds} seconds`);
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      crashlytics().recordError(error as Error);
      throw error;
    }
  }

  /**
   * Zruší registraci FCM tokenu
   */
  async deleteToken(): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        await messaging().deleteToken();
        this.fcmToken = null;
      }
    } catch (error) {
      console.error('Error deleting FCM token:', error);
      crashlytics().recordError(error as Error);
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
   * Naplánuje notifikace pro interpreta - 10 minut před každým jeho koncertem
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

      // Najdi všechny koncerty tohoto interpreta
      const artistEvents = timelineData.events.filter(
        (event) => event.interpret_id === numericArtistId && event.start
      );

      // Naplánuj notifikaci 10 minut před každým koncertem
      for (const event of artistEvents) {
        if (!event.start) continue;

        const eventStart = dayjs(event.start);
        const notificationTime = eventStart.subtract(10, 'minute');

        // Naplánuj pouze budoucí notifikace
        if (notificationTime.isAfter(now)) {
          const notificationId = `artist_${artistId}_event_${event.id || event.start}`;

          try {
            await Notifications.scheduleNotificationAsync({
              identifier: notificationId,
              content: {
                title: `${artistName} začíná za 10 minut!`,
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
                date: notificationTime.toDate(),
              },
            });
          } catch (error) {
            console.error(`Error scheduling notification for artist ${artistName}:`, error);
            crashlytics().recordError(error as Error);
          }
        }
      }
    } catch (error) {
      console.error('Error scheduling artist notifications:', error);
      crashlytics().recordError(error as Error);
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
          console.log(`Cancelled notification ${notification.identifier}`);
        } catch (error) {
          console.error(`Error cancelling notification ${notification.identifier}:`, error);
        }
      }
    } catch (error) {
      console.error('Error cancelling artist notifications:', error);
      crashlytics().recordError(error as Error);
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
      let cancelledCount = 0;
      
      for (const notification of scheduledNotifications) {
        const data = notification.content.data as Record<string, unknown> | undefined;
        if (data?.type === 'artist') {
          try {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            cancelledCount++;
          } catch (error) {
            console.error(`Error cancelling notification ${notification.identifier}:`, error);
          }
        }
      }

      if (cancelledCount > 0) {
        console.log(`Cancelled ${cancelledCount} artist notifications`);
      }
    } catch (error) {
      console.error('Error cancelling all artist notifications:', error);
      crashlytics().recordError(error as Error);
    }
  }

  /**
   * Aktualizuje notifikace pro všechny oblíbené interprety
   * Volá se při změně oblíbených nebo při aktualizaci timeline
   * Zruší všechny existující notifikace typu 'artist' a naplánuje nové pouze pro oblíbené interprety
   */
  async updateAllArtistNotifications(favoriteArtistIds: string[], artists: Array<{ id: string; name: string }>): Promise<void> {
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
      crashlytics().recordError(error as Error);
    }
  }
}

export const notificationService = new NotificationService();

