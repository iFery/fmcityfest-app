import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import dayjs from 'dayjs';
import 'dayjs/locale/cs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import Header from '../components/Header';

dayjs.locale('cs');
dayjs.extend(localizedFormat);
import { useFavoritesStore } from '../stores/favoritesStore';
import { useNotificationPreferencesStore } from '../stores/notificationPreferencesStore';
import { clearAllCache, getCacheAge } from '../utils/cacheManager';
import { remoteConfigService } from '../services/remoteConfig';
import { crashlyticsService } from '../services/crashlytics';
import { getFirebaseProjectId } from '../services/firebase';

const HEADER_HEIGHT = 130;

interface CacheInfo {
  key: string;
  age: number | null;
  exists: boolean;
}

const CACHE_KEYS = ['events', 'timeline', 'artists', 'news', 'partners', 'faq'];

export default function DebugScreen() {
  const { favoriteEvents, favoriteArtists } = useFavoritesStore();
  const {
    favoriteArtistsNotifications,
    importantFestivalNotifications,
  } = useNotificationPreferencesStore();

  const [cacheInfo, setCacheInfo] = useState<CacheInfo[]>([]);
  const [asyncStorageKeysCount, setAsyncStorageKeysCount] = useState<number>(0);
  const [notificationPermission, setNotificationPermission] = useState<string>('');
  const [scheduledNotifications, setScheduledNotifications] = useState<Notifications.NotificationRequest[]>([]);
  const [remoteConfigValues, setRemoteConfigValues] = useState<Record<string, string>>({});
  const [firebaseProjectId, setFirebaseProjectId] = useState<string | null>(null);

  useEffect(() => {
    loadDebugInfo();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadDebugInfo();
    }, [])
  );

  const loadDebugInfo = async () => {
    await Promise.all([
      loadCacheInfo(),
      loadAsyncStorageInfo(),
      loadNotificationPermission(),
      loadScheduledNotifications(),
      loadRemoteConfig(),
      loadFirebaseProjectId(),
    ]);
  };

  const loadFirebaseProjectId = () => {
    try {
      const projectId = getFirebaseProjectId();
      setFirebaseProjectId(projectId);
    } catch (error) {
      console.error('Error loading Firebase project ID:', error);
      setFirebaseProjectId(null);
    }
  };

  const loadCacheInfo = async () => {
    const info: CacheInfo[] = await Promise.all(
      CACHE_KEYS.map(async (key) => {
        const age = await getCacheAge(key);
        return {
          key,
          age: age ?? null,
          exists: age !== null,
        };
      })
    );
    setCacheInfo(info);
  };

  const loadAsyncStorageInfo = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      setAsyncStorageKeysCount(keys.length);
    } catch (error) {
      console.error('Error loading AsyncStorage info:', error);
    }
  };

  const loadNotificationPermission = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationPermission(status);
    } catch (error) {
      setNotificationPermission('unknown');
    }
  };

  const loadScheduledNotifications = async () => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      setScheduledNotifications(notifications);
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
      setScheduledNotifications([]);
    }
  };

  const loadRemoteConfig = async () => {
    try {
      const all = remoteConfigService.getAll();
      setRemoteConfigValues(all);
    } catch (error) {
      console.error('Error loading Remote Config:', error);
    }
  };

  const handleScheduleTestNotification = async () => {
    try {
      const permission = await Notifications.getPermissionsAsync();
      let status = permission.status;

      if (status !== 'granted') {
        const request = await Notifications.requestPermissionsAsync();
        status = request.status;
      }

      if (status !== 'granted') {
        Alert.alert('Notifikace nejsou povolené', 'Povol prosím notifikace v nastavení zařízení.');
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Testovací notifikace',
          body: 'Tato notifikace byla naplánována na 30 sekund dopředu.',
        },
        trigger: {
          type: 'timeInterval',
          seconds: 30,
          repeats: false,
        },
      });

      await loadScheduledNotifications();

      Alert.alert('Naplánováno', 'Notifikace dorazí za 30 sekund.');
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      Alert.alert('Chyba', 'Notifikaci se nepodařilo naplánovat.');
    }
  };

  const formatAge = (ageMs: number | null): string => {
    if (ageMs === null) return 'Není v cache';
    const seconds = Math.floor(ageMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatNotificationDate = (trigger: Notifications.NotificationTrigger | null): string => {
    if (!trigger) {
      return 'Okamžitě';
    }
    
    try {
      const triggerAny = trigger as any;
      
      // Expo-notifications vrací trigger s type a value
      if (triggerAny.type === 'date' && triggerAny.value) {
        const date = dayjs(triggerAny.value);
        if (date.isValid()) {
          return date.format('DD.MM.YYYY HH:mm');
        }
      }
      
      // TimeIntervalNotificationTrigger - scheduled with seconds
      if (triggerAny.type === 'timeInterval' && triggerAny.value) {
        const date = dayjs().add(triggerAny.value, 'second');
        return date.format('DD.MM.YYYY HH:mm');
      }
      
      // CalendarNotificationTrigger
      if (triggerAny.type === 'calendar') {
        if (triggerAny.value && triggerAny.value.hour !== undefined && triggerAny.value.minute !== undefined) {
          const hour = triggerAny.value.hour;
          const minute = triggerAny.value.minute;
          if (triggerAny.value.day || triggerAny.value.weekday || triggerAny.value.month) {
            return 'Pravidelná notifikace';
          }
          return `Denně v ${hour}:${minute.toString().padStart(2, '0')}`;
        }
      }
      
      // Fallback - starý formát (přímo date property)
      if ('date' in trigger) {
        const dateValue = triggerAny.date;
        if (dateValue !== null && dateValue !== undefined) {
          let date: dayjs.Dayjs;
          if (dateValue instanceof Date) {
            date = dayjs(dateValue);
          } else if (typeof dateValue === 'string') {
            date = dayjs(dateValue);
          } else if (typeof dateValue === 'number') {
            date = dayjs(dateValue);
          } else {
            date = dayjs(new Date(dateValue));
          }
          if (date.isValid()) {
            return date.format('DD.MM.YYYY HH:mm');
          }
        }
      }
      
      // Fallback - seconds property
      if ('seconds' in trigger && typeof triggerAny.seconds === 'number') {
        const date = dayjs().add(triggerAny.seconds, 'second');
        return date.format('DD.MM.YYYY HH:mm');
      }
    } catch (error) {
      console.error('Error formatting notification date:', error, trigger);
    }
    
    return 'Naplánováno';
  };

  const handleClearCache = () => {
    Alert.alert(
      'Vyčistit cache',
      'Opravdu chceš vymazat všechnu cache?',
      [
        { text: 'Zrušit', style: 'cancel' },
        {
          text: 'Vymazat',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllCache();
              await loadCacheInfo();
              await loadAsyncStorageInfo();
              Alert.alert('Hotovo', 'Cache byla vymazána');
            } catch (error) {
              Alert.alert('Chyba', 'Nepodařilo se vymazat cache');
            }
          },
        },
      ]
    );
  };

  const handleTestCrash = () => {
    Alert.alert(
      'Testovací Crash',
      'Toto vyvolá testovací crash aplikace pro Crashlytics. Aplikace se okamžitě ukončí. Chceš pokračovat?',
      [
        { text: 'Zrušit', style: 'cancel' },
        {
          text: 'Vyvolat crash',
          style: 'destructive',
          onPress: () => {
            crashlyticsService.log('Test crash triggered from debug screen');
            crashlyticsService.forceCrash();
          },
        },
      ]
    );
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || 'N/A';
  const deviceName = Constants.deviceName || 'Unknown';
  const platform = Platform.OS;
  const platformVersion = Platform.Version;

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.stickyHeader}>
          <Header title="DEBUG" />
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          overScrollMode="never"
        >
          {/* App Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={24} color="#EA5178" />
              <Text style={styles.sectionTitle}>Informace o aplikaci</Text>
            </View>
            <InfoRow label="Verze aplikace" value={appVersion} />
            <InfoRow label="Build číslo" value={String(buildNumber)} />
            <InfoRow label="Platforma" value={`${platform} ${platformVersion}`} />
            <InfoRow label="Zařízení" value={deviceName} />
            <InfoRow label="Expo SDK" value={Constants.expoConfig?.sdkVersion || 'N/A'} />
          </View>

          {/* Cache Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="archive" size={24} color="#EA5178" />
              <Text style={styles.sectionTitle}>Cache</Text>
            </View>
            {cacheInfo.map((info) => (
              <InfoRow
                key={info.key}
                label={info.key}
                value={formatAge(info.age)}
                valueColor={info.exists ? '#21AAB0' : '#999'}
              />
            ))}
            <InfoRow label="AsyncStorage klíčů" value={String(asyncStorageKeysCount)} />
            <TouchableOpacity style={styles.clearButton} onPress={handleClearCache}>
              <Text style={styles.clearButtonText}>Vyčistit všechnu cache</Text>
            </TouchableOpacity>
          </View>

          {/* Favorites Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart" size={24} color="#EA5178" />
              <Text style={styles.sectionTitle}>Můj program</Text>
            </View>
            <InfoRow label="Uložené události" value={String(favoriteEvents.length)} />
            <InfoRow label="Uložení interpreti" value={String(favoriteArtists.length)} />
            <InfoRow label="Celkem" value={String(favoriteEvents.length + favoriteArtists.length)} />
          </View>

          {/* Notifications Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications" size={24} color="#EA5178" />
              <Text style={styles.sectionTitle}>Notifikace</Text>
            </View>
            <InfoRow label="Oprávnění" value={notificationPermission} />
            <InfoRow
              label="Interpreti"
              value={favoriteArtistsNotifications ? 'Zapnuto' : 'Vypnuto'}
              valueColor={favoriteArtistsNotifications ? '#21AAB0' : '#999'}
            />
            <InfoRow
              label="Festival"
              value={importantFestivalNotifications ? 'Zapnuto' : 'Vypnuto'}
              valueColor={importantFestivalNotifications ? '#21AAB0' : '#999'}
            />
            <InfoRow label="Naplánované notifikace" value={String(scheduledNotifications.length)} />
            <TouchableOpacity style={styles.testNotificationButton} onPress={handleScheduleTestNotification}>
              <Text style={styles.testNotificationButtonText}>Naplánovat test notifikaci (30s)</Text>
            </TouchableOpacity>
            {scheduledNotifications.length > 0 && (
              <View style={styles.notificationsList}>
                {scheduledNotifications.map((notification, index) => (
                  <View key={notification.identifier} style={styles.notificationItem}>
                    <Text style={styles.notificationTitle}>
                      {index + 1}. {notification.content.title || 'Bez názvu'}
                    </Text>
                    {notification.content.body && (
                      <Text style={styles.notificationBody}>{notification.content.body}</Text>
                    )}
                    <Text style={styles.notificationDate}>
                      {formatNotificationDate(notification.trigger)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Remote Config */}
          {Object.keys(remoteConfigValues).length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="cloud" size={24} color="#EA5178" />
                <Text style={styles.sectionTitle}>Remote Config</Text>
              </View>
              {Object.entries(remoteConfigValues).map(([key, value]) => (
                <InfoRow key={key} label={key} value={String(value)} />
              ))}
            </View>
          )}

          {/* Environment */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings" size={24} color="#EA5178" />
              <Text style={styles.sectionTitle}>Prostředí</Text>
            </View>
            <InfoRow label="Development" value={__DEV__ ? 'Ano' : 'Ne'} />
            <InfoRow label="EAS Project ID" value={Constants.expoConfig?.extra?.eas?.projectId || 'N/A'} />
            <InfoRow 
              label="Firebase Project ID" 
              value={firebaseProjectId || 'N/A'} 
              valueColor={firebaseProjectId ? '#21AAB0' : '#999'}
            />
          </View>

          {/* Crashlytics Testing */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bug" size={24} color="#EA5178" />
              <Text style={styles.sectionTitle}>Crashlytics</Text>
            </View>
            <TouchableOpacity style={styles.crashButton} onPress={handleTestCrash}>
              <Ionicons name="warning" size={20} color="#FFFFFF" style={styles.crashButtonIcon} />
              <Text style={styles.crashButtonText}>Vyvolat testovací crash</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

function InfoRow({ label, value, valueColor = '#FFFFFF' }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002239',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: HEADER_HEIGHT + 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#EA5178',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0A3652',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'right',
  },
  clearButton: {
    backgroundColor: '#EA5178',
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  notificationsList: {
    marginTop: 8,
  },
  notificationItem: {
    backgroundColor: '#0A3652',
    padding: 12,
    marginBottom: 8,
    borderRadius: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 11,
    color: '#21AAB0',
    fontStyle: 'italic',
  },
  testNotificationButton: {
    backgroundColor: '#21AAB0',
    padding: 14,
    marginTop: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  testNotificationButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  crashButton: {
    backgroundColor: '#FF4444',
    padding: 16,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  crashButtonIcon: {
    marginRight: 8,
  },
  crashButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

