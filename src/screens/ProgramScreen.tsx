import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/cs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { RootStackParamList } from '../navigation/linking';
import NotificationPermissionModal from '../components/NotificationPermissionModal';
import { useNotificationPrompt } from '../hooks/useNotificationPrompt';
import { useEvents } from '../hooks/useEvents';
import { useFavorites } from '../hooks/useFavorites';
import { useTimeline } from '../contexts/TimelineContext';
import Header from '../components/Header';
import type { Stage } from '../types';

dayjs.locale('cs');
dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.extend(isSameOrAfter);

type ProgramScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HEADER_HEIGHT = 130;
const PIXELS_PER_HOUR = 80;

interface TimelineEvent {
  id: string;
  name: string;
  artist?: string;
  start: string;
  end: string;
  stage?: string;
  interpret_id?: string;
  [key: string]: unknown;
}

export default function ProgramScreen() {
  const navigation = useNavigation<ProgramScreenNavigationProp>();
  const { events, loading, error } = useEvents();
  const { favoriteEvents } = useFavorites();
  const previousTabRef = useRef<string | null>(null);
  
  // Reset stack to ProgramMain when returning to this tab from another tab
  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      if (!parent) return;
      
      const tabState = parent.getState();
      const currentTab = tabState.routes[tabState.index];
      const previousTabName = previousTabRef.current;
      
      previousTabRef.current = currentTab?.name ?? null;
      
      if (currentTab?.name === 'Program' && previousTabName && previousTabName !== 'Program') {
        const stackState = currentTab.state;
        const stackIndex = stackState?.index ?? 0;
        
        if (stackIndex > 0) {
          requestAnimationFrame(() => {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'ProgramMain' }],
              })
            );
          });
        }
      }
    }, [navigation])
  );
  
  // Notification prompt
  const { showPrompt, handleAccept, handleDismiss, onScroll: handleNotificationScroll } = useNotificationPrompt({
    enabled: true,
    triggerOnScroll: true,
  });

  // Use shared timeline context instead of loading locally
  const { timelineData, loading: timelineLoading, refetch: refetchTimeline } = useTimeline();
  const [day, setDay] = useState<'dayOne' | 'dayTwo'>('dayOne');

  // Reload timeline data when screen is focused (e.g., after data refresh in settings)
  useFocusEffect(
    React.useCallback(() => {
      refetchTimeline();
    }, [refetchTimeline])
  );

  // Set default day based on current date
  useEffect(() => {
    if (!timelineData) return;

    const now = dayjs();
    const today = now.format('YYYY-MM-DD');
    
    const dayOneStart = dayjs(timelineData.config.dayOne.start);
    const dayOneStartDate = dayOneStart.format('YYYY-MM-DD');
    const dayOneEnd = dayjs(timelineData.config.dayOne.end);
    const dayOneEndDate = dayOneEnd.format('YYYY-MM-DD');
    
    const dayTwoStart = dayjs(timelineData.config.dayTwo.start);
    const dayTwoStartDate = dayTwoStart.format('YYYY-MM-DD');
    const dayTwoEnd = dayjs(timelineData.config.dayTwo.end);
    const dayTwoEndDate = dayTwoEnd.format('YYYY-MM-DD');

    // Check if today is within dayTwo range
    const isInDayTwo = 
      (today >= dayTwoStartDate && today <= dayTwoEndDate);
    
    // Check if today is within dayOne range
    const isInDayOne = 
      (today >= dayOneStartDate && today <= dayOneEndDate);

    // Prioritize dayTwo if both match (shouldn't happen, but just in case)
    if (isInDayTwo) {
      setDay('dayTwo');
    } else if (isInDayOne) {
      setDay('dayOne');
    }
    // Otherwise keep default (dayOne) - already set in useState
  }, [timelineData]);

  // Transform events to timeline format
  const timelineEvents = useMemo((): TimelineEvent[] => {
    if (!timelineData) return [];

    return timelineData.events.map((event) => {
      // API returns start and end directly in ISO format
      // If not available, try to construct from time/date fields
      let start = (event as any).start || '';
      let end = (event as any).end || '';

      // Fallback: try to construct from time/date if start/end not available
      if (!start) {
        const eventDate = (event as any).date || timelineData.config[day].start;
        const timeStr = event.time || '';
        
        if (timeStr && eventDate) {
          try {
            const datePart = dayjs(eventDate).format('YYYY-MM-DD');
            const [hours, minutes] = timeStr.split(':');
            if (hours && minutes) {
              start = dayjs(`${datePart} ${hours}:${minutes}`).toISOString();
              end = dayjs(start).add(1, 'hour').toISOString();
            }
          } catch (e) {
            console.warn('Could not parse event time:', e);
          }
        } else {
          start = eventDate || '';
        }
      }

      // Ensure ISO format
      if (start && !start.includes('T')) {
        try {
          start = dayjs(start).toISOString();
        } catch (e) {
          console.warn('Could not parse start date:', start);
        }
      }
      if (end && !end.includes('T')) {
        try {
          end = dayjs(end).toISOString();
        } catch (e) {
          console.warn('Could not parse end date:', end);
        }
      }

      return {
        ...event,
        id: event.id || (event as any).interpret_id?.toString() || '',
        name: event.name || event.artist || '',
        artist: event.artist,
        start: start,
        end: end,
        stage: event.stage,
        interpret_id: (event as any).interpret_id || event.id || '',
      };
    });
  }, [timelineData, day]);

  // Filter events for current day
  const dayEvents = useMemo(() => {
    if (!timelineData || timelineEvents.length === 0) return [];

    const currentDayStart = dayjs(timelineData.config[day].start);
    const currentDayEnd = dayjs(timelineData.config[day].end);

    return timelineEvents.filter((ev) => {
      if (!ev.start) return false;
      const start = dayjs(ev.start);
      return start.isSameOrAfter(currentDayStart) && start.isBefore(currentDayEnd);
    });
  }, [timelineData, day, timelineEvents]);

  // Generate timeline hours
  const timeline = useMemo(() => {
    if (!timelineData) return [];

    const currentDayStart = dayjs(timelineData.config[day].start);
    const currentDayEnd = dayjs(timelineData.config[day].end);
    const hours: string[] = [];
    let p = currentDayStart.clone();

    while (p.isBefore(currentDayEnd)) {
      hours.push(p.format('HH:mm'));
      p = p.add(1, 'hour');
    }

    return hours;
  }, [timelineData, day]);

  const handleEventPress = (event: TimelineEvent) => {
    // All events should have interpret_id, navigate to ArtistDetail
    if (event.interpret_id) {
      navigation.navigate('ArtistDetail', {
        artistId: event.interpret_id.toString(),
        artistName: event.name || event.artist || 'Interpret',
      });
    } else {
      // Fallback: if no interpret_id, still try to navigate to artist using event.id
      // This should not happen in practice, but provides graceful fallback
      const artistId = event.id || '';
      if (artistId) {
        navigation.navigate('ArtistDetail', {
          artistId: artistId,
          artistName: event.name || event.artist || 'Interpret',
        });
      }
    }
  };

  // Only show loading if we don't have timeline data yet
  // Timeline data should be preloaded, so this should rarely happen
  if ((loading || timelineLoading) && !timelineData) {
    return (
      <>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#21AAB0" />
          <Text style={styles.loadingText}>Načítám program...</Text>
        </View>
      </>
    );
  }

  if (error || !timelineData) {
    return (
      <>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <View style={styles.container}>
          <View style={styles.stickyHeader}>
            <Header title="PROGRAM" />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {error || 'Program není momentálně dostupný'}
            </Text>
          </View>
        </View>
      </>
    );
  }

  const stagesConfig = timelineData.stages.sort((a, b) => a.sort - b.sort);

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        {/* Sticky Header */}
        <View style={styles.stickyHeader}>
          <Header title="PROGRAM" />
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleNotificationScroll}
          scrollEventThrottle={400}
          bounces={false}
          overScrollMode="never"
          refreshControl={undefined}
        >
          {/* Day switcher */}
          <View style={styles.daySwitcher}>
            {(['dayOne', 'dayTwo'] as const).map((key) => {
              const dayStart = dayjs(timelineData.config[key].start);
              const dayEnd = dayjs(timelineData.config[key].end);
              const isActive = day === key;

              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setDay(key)}
                  style={[
                    styles.dayButton,
                    isActive && styles.dayButtonActive,
                  ]}
                >
                  <Text style={styles.dayButtonText}>
                    {dayStart.format('dd D. M. YYYY')}
                  </Text>
                  <Text style={styles.dayButtonSubtext}>
                    {dayStart.format('HH:mm')} – {dayEnd.format('HH:mm')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Timeline with horizontal scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.timelineContainer}>
              {/* Hours column */}
              <View style={styles.hoursColumn}>
                {timeline.map((time, i) => (
                  <View key={i} style={styles.hourSlot}>
                    <Text style={styles.hourText}>{time}</Text>
                  </View>
                ))}
              </View>

              {/* Stage columns */}
              {stagesConfig.map((stage) => {
                const currentDayStart = dayjs(timelineData.config[day].start);
                const stageEvents = dayEvents.filter((ev) => ev.stage === stage.stage);

                return (
                  <View key={stage.stage} style={styles.stageColumn}>
                    {/* Stage header */}
                    <View
                      style={[
                        styles.stageHeader,
                        { backgroundColor: stage.stageColors },
                      ]}
                    >
                      <Text style={styles.stageHeaderTitle}>{stage.stage_name}</Text>
                      <Text style={styles.stageHeaderSubtitle}>STAGE</Text>
                    </View>

                    {/* Timeline with events */}
                    <View style={styles.stageTimeline}>
                      {/* Hour grid */}
                      {timeline.map((_, i) => (
                        <View key={i} style={styles.timelineSlot} />
                      ))}

                      {/* Events */}
                      {stageEvents.map((event, i) => {
                        if (!event.start || !event.end) return null;

                        const start = dayjs(event.start);
                        const end = dayjs(event.end);
                        const top = (start.diff(currentDayStart, 'minute') / 60) * PIXELS_PER_HOUR;
                        const height = Math.max(
                          40,
                          (end.diff(start, 'minute') / 60) * PIXELS_PER_HOUR
                        );
                        const isFavorite = event.id
                          ? favoriteEvents.includes(event.id)
                          : false;

                        // Split name if it contains ": "
                        const nameParts = event.name?.includes(': ')
                          ? event.name.split(': ')
                          : [event.name];

                        return (
                          <TouchableOpacity
                            key={`${event.id}-${i}`}
                            onPress={() => handleEventPress(event)}
                            style={[
                              styles.eventBlock,
                              {
                                top,
                                height,
                                backgroundColor: stage.stageColorsArtist || stage.stageColors,
                              },
                            ]}
                            activeOpacity={0.8}
                          >
                            <View style={styles.eventContent}>
                              <Text style={styles.eventName} numberOfLines={2}>
                                {nameParts.length > 1 ? (
                                  <>
                                    {nameParts[0]}:{'\n'}
                                    {nameParts.slice(1).join(': ')}
                                  </>
                                ) : (
                                  event.name
                                )}
                              </Text>
                              <Text style={styles.eventTime}>
                                {start.format('HH:mm')} – {end.format('HH:mm')}
                              </Text>
                            </View>
                            {isFavorite && (
                              <Ionicons
                                name="heart"
                                size={12}
                                color="#EA5178"
                                style={styles.eventFavoriteIcon}
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </ScrollView>
      </View>
      <NotificationPermissionModal
        visible={showPrompt}
        onAllowNotifications={handleAccept}
        onDismiss={handleDismiss}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002239',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#002239',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 20,
    fontSize: 16,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#002239',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: HEADER_HEIGHT,
    paddingBottom: 30,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    paddingTop: HEADER_HEIGHT + 32,
  },
  errorText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 16,
  },
  daySwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
    paddingHorizontal: 10,
    gap: 10,
    marginLeft: 18,
  },
  dayButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#1A3B5A',
    minWidth: 140,
  },
  dayButtonActive: {
    backgroundColor: '#D14D75',
  },
  dayButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  dayButtonSubtext: {
    color: 'white',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  timelineContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  hoursColumn: {
    width: 60,
    paddingTop: 45,
  },
  hourSlot: {
    height: PIXELS_PER_HOUR,
    justifyContent: 'flex-start',
  },
  hourText: {
    fontSize: 12,
    color: 'white',
  },
  stageColumn: {
    width: 140,
    marginRight: 10,
  },
  stageHeader: {
    paddingVertical: 10,
    alignItems: 'center',
    minHeight: 45,
    justifyContent: 'center',
  },
  stageHeaderTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stageHeaderSubtitle: {
    fontSize: 10,
    color: 'white',
    marginTop: 2,
  },
  stageTimeline: {
    position: 'relative',
    backgroundColor: '#002239',
  },
  timelineSlot: {
    height: PIXELS_PER_HOUR,
    backgroundColor: '#0A3652',
    borderBottomWidth: 1,
    borderBottomColor: '#002239',
  },
  eventBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'column',
    padding: 4,
    minHeight: 40,
  },
  eventContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventName: {
    color: 'white',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  eventTime: {
    color: 'white',
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  eventFavoriteIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
});
