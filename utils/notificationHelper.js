import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { TriggerType, AuthorizationStatus } from '@notifee/react-native';
import { loadFromCache } from './cache';
import { Platform } from 'react-native';

// Pomocná funkce pro získání názvu interpreta
export const getArtistNameById = (artists, artistId) => {
  const found = artists.find(a => String(a.id) === String(artistId));
  return found?.fields?.name || found?.name || `Neznámý interpret (${artistId})`;
};

const NOTIFICATIONS_ENABLED_KEY = 'notifications_enabled';

export const requestNotificationPermissions = async () => {
  try {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
  } catch (error) {
    console.error('❌ Error requesting notification permissions:', error);
    return false;
  }
};

export const areNotificationsEnabled = async () => {
  try {
    const enabled = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('❌ Error checking notification status:', error);
    return false;
  }
};

export const toggleNotifications = async () => {
  try {
    const currentState = await areNotificationsEnabled();
    const newState = !currentState;
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(newState));
    return newState;
  } catch (error) {
    console.error('❌ Error toggling notifications:', error);
    return false;
  }
};

export const scheduleArtistNotifications = async (artistId, artistName, startTime) => {
  try {
    const notificationsEnabled = await areNotificationsEnabled();
    if (!notificationsEnabled) {
      console.log('ℹ️ Notifications are disabled, skipping notification scheduling');
      return;
    }

    const myArtists = await loadFromCache('myArtists') || [];
    if (!myArtists.includes(String(artistId))) {
      console.log('ℹ️ Artist is not in favorites, skipping notification scheduling');
      return;
    }

    // TODO: Implement actual notification scheduling
    console.log('📅 Scheduling notification for:', {
      artistId,
      artistName,
      startTime
    });
  } catch (error) {
    console.error('❌ Error scheduling notification:', error);
  }
};

// ✅ Povolí notifikace
export async function enableNotifications() {
  try {
    await AsyncStorage.setItem('notificationsEnabled', 'true');
    console.log('✅ enableNotifications: Notifikace byly povoleny a uloženy');
    return true;
  } catch (e) {
    console.error('❌ Chyba při enableNotifications:', e);
    return false;
  }
}

// ❌ Zakáže notifikace
export async function disableNotifications() {
  try {
    await AsyncStorage.setItem('notificationsEnabled', 'false');
    // Zrušíme všechny naplánované notifikace
    const notifications = await notifee.getTriggerNotifications();
    await Promise.all(notifications.map(n => notifee.cancelNotification(n.notification.id)));
    console.log('✅ disableNotifications: Notifikace byly zakázány a smazány');
  } catch (e) {
    console.error('❌ Chyba při disableNotifications:', e);
  }
}

export async function scheduleNotificationsForAllFavorites() {
  try {
    const myArtists = await loadFromCache('myArtists');
    if (!Array.isArray(myArtists) || myArtists.length === 0) {
      console.log('ℹ️ Žádní oblíbení interpreti pro naplánování notifikací');
      return;
    }

    for (const artistId of myArtists) {
      await scheduleNotificationForArtist(artistId);
    }

    console.log(`✅ Naplánováno ${myArtists.length} notifikací pro oblíbené interprety`);
  } catch (error) {
    console.error('❌ Chyba při plánování notifikací pro všechny oblíbené:', error);
  }
}


// 🛠 Naplánuje notifikaci pro interpreta
export async function scheduleNotificationForArtist(artistId) {
  try {
    // Kontrola, zda jsou notifikace povolené
    const notificationsEnabled = await areNotificationsEnabled();
    if (!notificationsEnabled) {
      console.log('📴 Notifikace jsou zakázané, nebudu plánovat');
      return;
    }

    const festivalData = await loadFromCache('cachedFestivalData');
    if (!festivalData || !festivalData.program || !festivalData.artists) {
      console.warn('⚠️ Chybí data pro plánování notifikace');
      return;
    }

    const event = festivalData.program.events.find(
      (item) =>
        String(item.interpret_id) === String(artistId) ||
        String(item.artist_id) === String(artistId)
    );

    if (!event) {
      console.warn(`⚠️ Nenalezen event pro artist_id: ${artistId}`);
      return;
    }

    const startTime = new Date(event.start || event.time_from).getTime();
    const triggerTime = startTime - 15 * 60 * 1000; // 15 minut před začátkem
    const now = Date.now();

    if (isNaN(startTime) || triggerTime <= now) {
      console.log(`⏱️ Event už začal nebo je příliš blízko.`);
      return;
    }

    const artistName = getArtistNameById(festivalData.artists, artistId);
    const stageName = event.stage_name || event.stage || 'neznámé stage';

    // Nejdřív zrušíme existující notifikaci
    await notifee.cancelNotification(`artist-${artistId}`);

    // Pak vytvoříme novou
    await notifee.createTriggerNotification(
      {
        id: `artist-${artistId}`,
        title: 'Za chvíli to začne!',
        body: `${artistName} začíná za 15 minut na ${stageName} stage.`,
        android: {
          channelId: 'default',
          smallIcon: 'ic_launcher',
          pressAction: {
            id: 'default',
          },
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerTime,
      }
    );

    console.log(`🔔 Naplánována notifikace pro ${artistName} na ${new Date(triggerTime).toLocaleString()}`);
  } catch (error) {
    console.error('❌ Chyba při plánování notifikace:', error);
  }
}

// ❌ Zruší notifikaci pro interpreta
export async function cancelNotificationForArtist(artistId) {
  try {
    await notifee.cancelNotification(`artist-${artistId}`);
    console.log(`🗑️ Zrušena notifikace pro artist_id: ${artistId}`);
  } catch (e) {
    console.warn(`⚠️ Nepodařilo se zrušit notifikaci:`, e);
  }
}

// 🧪 Debug - výpis všech triggerovaných notifikací
export async function debugScheduledNotifications() {
  try {
    const list = await notifee.getTriggerNotifications();
    console.log(`🧾 Detaily naplánovaných notifikací: ${list.length}`);

    list.forEach(({ notification, trigger }, index) => {
      const time = trigger?.timestamp
        ? new Date(trigger.timestamp).toLocaleString()
        : '⏳ (bez timestampu)';

      console.log('———————————————');
      console.log(`🔢 Notifikace ${index + 1}`);
      console.log(`🔔 ID: ${notification?.id}`);
      console.log(`📋 Title: ${notification?.title}`);
      console.log(`📝 Body: ${notification?.body}`);
      console.log(`🕒 Spuštění: ${time}`);
    });
  } catch (err) {
    console.warn('❌ Chyba při výpisu notifikací:', err);
  }
}
