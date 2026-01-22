import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';
import 'dayjs/locale/cs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import Header from '../components/Header';
import { useNotificationPreferencesStore } from '../stores/notificationPreferencesStore';

dayjs.locale('cs');
dayjs.extend(localizedFormat);

const HEADER_HEIGHT = 130;

export default function NotificationsScreen() {
  const [scheduledNotifications, setScheduledNotifications] = useState<Notifications.NotificationRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { favoriteArtistsNotificationLeadMinutes } = useNotificationPreferencesStore();

  const getNotificationDate = React.useCallback((trigger: Notifications.NotificationTrigger | null): Date | null => {
    if (!trigger) {
      return null;
    }
    
    try {
      const triggerAny = trigger as any;
      
      // Debug logging pro iOS (odkomentuj pro debugging)
      // console.log('Trigger structure:', JSON.stringify(triggerAny, null, 2));
      
      // Expo-notifications vrací trigger s type a value
      // Na iOS může být value jako timestamp (number) v milisekundách
      if (triggerAny.type === 'date' && triggerAny.value !== undefined && triggerAny.value !== null) {
        // value může být timestamp (number) nebo Date objekt
        let date: Date;
        if (typeof triggerAny.value === 'number') {
          date = new Date(triggerAny.value);
        } else if (triggerAny.value instanceof Date) {
          date = triggerAny.value;
        } else if (typeof triggerAny.value === 'string') {
          date = new Date(triggerAny.value);
        } else {
          date = new Date(triggerAny.value);
        }
        
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      // TimeIntervalNotificationTrigger - scheduled with seconds
      // Na iOS může být seconds jako samostatná property nebo jako value
      if (triggerAny.type === 'timeInterval') {
        // Zkus nejdřív seconds property (iOS)
        let seconds: number | null = null;
        if (triggerAny.seconds !== undefined && triggerAny.seconds !== null) {
          seconds = typeof triggerAny.seconds === 'number' ? triggerAny.seconds : parseFloat(String(triggerAny.seconds));
        } else if (triggerAny.value !== undefined && triggerAny.value !== null) {
          // Fallback na value property
          seconds = typeof triggerAny.value === 'number' ? triggerAny.value : parseFloat(String(triggerAny.value));
        }
        
        if (seconds !== null && !isNaN(seconds)) {
          const date = new Date(Date.now() + seconds * 1000);
          return date;
        }
      }
      
      // Fallback - starý formát (přímo date property)
      if ('date' in trigger) {
        const dateValue = triggerAny.date;
        if (dateValue !== null && dateValue !== undefined) {
          if (dateValue instanceof Date) {
            return dateValue;
          }
          if (typeof dateValue === 'number') {
            return new Date(dateValue);
          }
          if (typeof dateValue === 'string') {
            return new Date(dateValue);
          }
          return new Date(dateValue);
        }
      }
      
      // Fallback - zkus value jako timestamp přímo (pro iOS)
      if (triggerAny.value !== undefined && triggerAny.value !== null) {
        const value = typeof triggerAny.value === 'number' ? triggerAny.value : 
                     typeof triggerAny.value === 'string' ? parseInt(triggerAny.value, 10) : null;
        if (value !== null && !isNaN(value)) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing notification date:', error, trigger);
      return null;
    }
  }, []);

  const loadScheduledNotifications = React.useCallback(async () => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      // Seřaď notifikace podle času (nejbližší první)
      const sortedNotifications = notifications.sort((a, b) => {
        const dateA = getNotificationDate(a.trigger);
        const dateB = getNotificationDate(b.trigger);
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.getTime() - dateB.getTime();
      });
      setScheduledNotifications(sortedNotifications);
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
      setScheduledNotifications([]);
    }
  }, [getNotificationDate]);

  const formatNotificationDate = (trigger: Notifications.NotificationTrigger | null): string => {
    if (!trigger) {
      return 'Okamžitě';
    }
    
    const date = getNotificationDate(trigger);
    if (!date) {
      return 'Neznámý čas';
    }

    const dayjsDate = dayjs(date);
    if (dayjsDate.isValid()) {
      return dayjsDate.format('dddd D. MMMM YYYY, HH:mm');
    }
    
    return 'Neplatný čas';
  };

  const formatTimeUntil = (trigger: Notifications.NotificationTrigger | null): string => {
    const date = getNotificationDate(trigger);
    if (!date) {
      return '';
    }

    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs < 0) {
      return 'Proběhlo';
    }

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `Za ${diffDays} ${diffDays === 1 ? 'den' : diffDays < 5 ? 'dny' : 'dní'}`;
    }
    if (diffHours > 0) {
      return `Za ${diffHours} ${diffHours === 1 ? 'hodinu' : diffHours < 5 ? 'hodiny' : 'hodin'}`;
    }
    if (diffMinutes > 0) {
      return `Za ${diffMinutes} ${diffMinutes === 1 ? 'minutu' : diffMinutes < 5 ? 'minuty' : 'minut'}`;
    }
    return `Za ${diffSeconds} sekund`;
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadScheduledNotifications();
    setRefreshing(false);
  }, [loadScheduledNotifications]);

  useFocusEffect(
    React.useCallback(() => {
      loadScheduledNotifications();
    }, [loadScheduledNotifications])
  );

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.stickyHeader}>
          <Header title="NOTIFIKACE" />
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          overScrollMode="never"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#21AAB0" />}
        >
          {scheduledNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Žádné naplánované notifikace</Text>
              <Text style={styles.emptySubtext}>
                Přidej koncerty do oblíbených a notifikace se ti automaticky naplánují {favoriteArtistsNotificationLeadMinutes} minut před začátkem.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.countText}>
                {scheduledNotifications.length} {scheduledNotifications.length === 1 ? 'notifikace' : scheduledNotifications.length < 5 ? 'notifikace' : 'notifikací'}
              </Text>
              {scheduledNotifications.map((notification, index) => {
                const data = notification.content.data as Record<string, unknown> | undefined;
                const isArtistNotification = data?.type === 'artist';
                
                return (
                  <View key={notification.identifier} style={styles.notificationItem}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle} numberOfLines={2}>
                        {notification.content.title || 'Bez názvu'}
                      </Text>
                      {isArtistNotification && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>Interpret</Text>
                        </View>
                      )}
                    </View>
                    {notification.content.body && (
                      <Text style={styles.notificationBody} numberOfLines={2}>
                        {notification.content.body}
                      </Text>
                    )}
                    <View style={styles.notificationFooter}>
                      <Text style={styles.notificationDate}>
                        {formatNotificationDate(notification.trigger)}
                      </Text>
                      <Text style={styles.notificationTimeUntil}>
                        {formatTimeUntil(notification.trigger)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      </View>
    </>
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
    paddingTop: HEADER_HEIGHT,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  countText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  notificationItem: {
    backgroundColor: '#0A3652',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#21AAB0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notificationBody: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 12,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1a3a5a',
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  notificationTimeUntil: {
    fontSize: 12,
    fontWeight: '600',
    color: '#21AAB0',
  },
});
