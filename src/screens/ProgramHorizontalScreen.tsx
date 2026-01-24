import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import 'dayjs/locale/cs';
import Header from '../components/Header';
import Toast from '../components/Toast';
import NotificationPermissionModal from '../components/NotificationPermissionModal';
import { useTheme } from '../theme/ThemeProvider';
import { useEvents } from '../hooks/useEvents';
import { useFavorites } from '../hooks/useFavorites';
import { useFavoriteFeedback } from '../hooks/useFavoriteFeedback';
import { useTimeline } from '../contexts/TimelineContext';
import { RootStackParamList } from '../navigation/linking';
import { logEvent } from '../services/analytics';
import { useScreenView } from '../hooks/useScreenView';
import { hasEventEnded } from '../utils/eventTime';

dayjs.locale('cs');
dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.extend(isSameOrAfter);

type ProgramHorizontalNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HEADER_HEIGHT = 130;
const STAGE_LABEL_WIDTH = 120;
const HOUR_WIDTH = 180;
const TIME_ROW_HEIGHT = 44;
const STAGE_ROW_HEIGHT = 86;
const MIN_CARD_WIDTH = 120;

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

export default function ProgramHorizontalScreen() {
  const { globalStyles } = useTheme();
  const navigation = useNavigation<ProgramHorizontalNavigationProp>();
  const { loading, error } = useEvents();
  const { favoriteEvents, toggleEvent, isEventFavorite } = useFavorites();
  const { timelineData, loading: timelineLoading, refetch: refetchTimeline } = useTimeline();
  const [day, setDay] = useState<'dayOne' | 'dayTwo'>('dayOne');
  useScreenView('ProgramHorizontal');

  const {
    toastVisible,
    toastMessage,
    toastDuration,
    toastAction,
    permissionModalVisible,
    handleFavoriteAdded,
    handleFavoriteRemoved,
    handlePermissionAccept,
    handlePermissionDismiss,
    hideToast,
  } = useFavoriteFeedback({ promptStyle: 'toast-action' });

  useEffect(() => {
    refetchTimeline();
  }, [refetchTimeline]);

  useEffect(() => {
    if (!timelineData) return;

    const now = dayjs();
    const today = now.format('YYYY-MM-DD');

    const dayOneStartDate = dayjs(timelineData.config.dayOne.start).format('YYYY-MM-DD');
    const dayOneEndDate = dayjs(timelineData.config.dayOne.end).format('YYYY-MM-DD');

    const dayTwoStartDate = dayjs(timelineData.config.dayTwo.start).format('YYYY-MM-DD');
    const dayTwoEndDate = dayjs(timelineData.config.dayTwo.end).format('YYYY-MM-DD');

    if (today >= dayTwoStartDate && today <= dayTwoEndDate) {
      setDay('dayTwo');
    } else if (today >= dayOneStartDate && today <= dayOneEndDate) {
      setDay('dayOne');
    }
  }, [timelineData]);

  const timelineEvents = useMemo((): TimelineEvent[] => {
    if (!timelineData) return [];

    return timelineData.events.map((event) => {
      let start = (event as any).start || '';
      let end = (event as any).end || '';

      if (!start) {
        const eventDate = (event as any).date || timelineData.config[day].start;
        const timeStr = event.time || '';

        if (timeStr && eventDate) {
          const datePart = dayjs(eventDate).format('YYYY-MM-DD');
          const [hours, minutes] = timeStr.split(':');
          if (hours && minutes) {
            start = dayjs(`${datePart} ${hours}:${minutes}`).toISOString();
            end = dayjs(start).add(1, 'hour').toISOString();
          }
        } else {
          start = eventDate || '';
        }
      }

      if (start && !start.includes('T')) start = dayjs(start).toISOString();
      if (end && !end.includes('T')) end = dayjs(end).toISOString();

      return {
        ...event,
        id: event.id || (event as any).interpret_id?.toString() || '',
        name: event.name || event.artist || '',
        artist: event.artist,
        start,
        end,
        stage: event.stage,
        interpret_id: (event as any).interpret_id || event.id || '',
      };
    });
  }, [timelineData, day]);

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
    if (event.interpret_id) {
      logEvent('event_open', {
        event_id: event.id,
        artist_id: event.interpret_id,
        stage: event.stage,
        source: 'program_horizontal',
      });
      navigation.navigate('ArtistDetail', {
        artistId: event.interpret_id.toString(),
        artistName: event.name || event.artist || 'Interpret',
      });
    }
  };

  if ((loading || timelineLoading) && !timelineData) {
    return (
      <>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#21AAB0" />
          <Text style={[styles.loadingText, globalStyles.text]}>Načítám program...</Text>
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
            <Text style={[styles.errorText, globalStyles.text]}>
              {error || 'Program není momentálně dostupný'}
            </Text>
          </View>
        </View>
      </>
    );
  }

  const stagesConfig = timelineData.stages.sort((a, b) => a.sort - b.sort);
  const timelineWidth = Math.max(timeline.length * HOUR_WIDTH, HOUR_WIDTH * 3);

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.stickyHeader}>
          <Header title="PROGRAM" />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.backRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Text style={[styles.backText, globalStyles.caption]}>
                ← Zpět na Program
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.daySwitcher}>
            {(['dayOne', 'dayTwo'] as const).map((key) => {
              const dayStart = dayjs(timelineData.config[key].start);
              const dayEnd = dayjs(timelineData.config[key].end);
              const isActive = day === key;

              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    setDay(key);
                    logEvent('program_day_switch', { day: key, source: 'program_horizontal' });
                  }}
                  style={[styles.dayButton, isActive && styles.dayButtonActive]}
                >
                  <Text style={[styles.dayButtonText, globalStyles.subtitle]}>
                    {dayStart.format('dd D. M. YYYY')}
                  </Text>
                  <Text style={[styles.dayButtonSubtext, globalStyles.caption]}>
                    {dayStart.format('HH:mm')} – {dayEnd.format('HH:mm')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.timelineOuter}>
            <View style={styles.stageColumn}>
              <View style={styles.stageColumnHeader}>
                <Text style={[styles.stageColumnHeaderText, globalStyles.caption]}>STAGE</Text>
              </View>
              {stagesConfig.map((stage) => (
                <View key={stage.stage} style={styles.stageLabelRow}>
                  <View
                    style={[
                      styles.stageLabelPill,
                      { backgroundColor: stage.stageColors || '#1A3B5A' },
                    ]}
                  >
                    <Text
                      style={[styles.stageLabelText, globalStyles.heading]}
                      numberOfLines={1}
                    >
                      {stage.stage_name}
                      
                    </Text>
                    <Text style={[globalStyles.caption]}>STAGE</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.timelineScrollContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.timelineContent}
                bounces={false}
                overScrollMode="never"
                nestedScrollEnabled
              >
                <View style={[styles.timelineGrid, { width: timelineWidth }]}>
                  <View style={styles.hoursRow}>
                    {timeline.map((time, i) => (
                      <View key={`${time}-${i}`} style={styles.hourCell}>
                        <Text style={[styles.hourText, globalStyles.caption]}>{time}</Text>
                      </View>
                    ))}
                  </View>

                  {stagesConfig.map((stage) => {
                    const currentDayStart = dayjs(timelineData.config[day].start);
                    const stageEvents = dayEvents.filter((ev) => ev.stage === stage.stage);

                    return (
                      <View
                        key={stage.stage}
                        style={[styles.stageRow, { width: timelineWidth }]}
                      >
                        <View style={styles.stageRowGrid}>
                          {timeline.map((_, i) => (
                            <View key={`grid-${stage.stage}-${i}`} style={styles.stageRowGridCell} />
                          ))}
                        </View>

                        {stageEvents.map((event, i) => {
                          if (!event.start || !event.end) return null;

                          const start = dayjs(event.start);
                          const end = dayjs(event.end);
                          const offsetHours = start.diff(currentDayStart, 'minute') / 60;
                          const durationHours = Math.max(
                            0.5,
                            end.diff(start, 'minute') / 60
                          );
                          const left = offsetHours * HOUR_WIDTH;
                          const width = Math.max(MIN_CARD_WIDTH, durationHours * HOUR_WIDTH);
                          const eventId = event.id ? String(event.id) : null;
                          const isFavorite = eventId ? favoriteEvents.includes(eventId) : false;

                          return (
                            <TouchableOpacity
                              key={`${event.id}-${i}`}
                              onPress={() => handleEventPress(event)}
                              onLongPress={async () => {
                                if (!eventId) return;
                                const wasFavorite = isEventFavorite(eventId);
                                toggleEvent(eventId);
                                const label = event.name || event.artist || 'Koncert';
                                const isPastEvent = hasEventEnded(event.start, event.end);
                                logEvent('favorite_change', {
                                  action: wasFavorite ? 'remove' : 'add',
                                  entity_type: 'event',
                                  event_id: eventId,
                                  artist_id: event.interpret_id,
                                  source: 'program_horizontal_longpress',
                                });
                                if (!wasFavorite) {
                                  await handleFavoriteAdded(label, { isPastEvent });
                                } else {
                                  await handleFavoriteRemoved(label);
                                }
                              }}
                              delayLongPress={350}
                              style={[
                                styles.eventCard,
                                {
                                  left,
                                  width,
                                  backgroundColor:
                                    stage.stageColorsArtist || stage.stageColors || '#1A3B5A',
                                },
                              ]}
                              activeOpacity={0.85}
                            >
                              <Text
                                style={[globalStyles.heading, styles.eventName]}
                                numberOfLines={2}
                              >
                                {event.name}
                              </Text>
                              <Text style={[styles.eventTime, globalStyles.caption]}>
                                {start.format('HH:mm')} – {end.format('HH:mm')}
                              </Text>
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
                    );
                  })}
                </View>
              </ScrollView>
              <View style={styles.scrollHint} pointerEvents="none">
                <View style={styles.scrollHintFade} />
                <Ionicons name="chevron-forward" size={18} color="#FFFFFF99" />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        onDismiss={hideToast}
        duration={toastDuration}
        actionButton={toastAction}
      />
      <NotificationPermissionModal
        visible={permissionModalVisible}
        onAllowNotifications={handlePermissionAccept}
        onDismiss={handlePermissionDismiss}
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
    paddingBottom: 36,
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
  },
  backRow: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  backText: {
    color: '#7CDDE4',
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
    textAlign: 'center',
  },
  dayButtonSubtext: {
    color: 'white',
    marginTop: 2,
    textAlign: 'center',
  },
  timelineOuter: {
    flexDirection: 'row',
    paddingLeft: 14,
    paddingBottom: 24,
  },
  stageColumn: {
    width: STAGE_LABEL_WIDTH,
  },
  stageColumnHeader: {
    height: TIME_ROW_HEIGHT,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 6,
  },
  stageColumnHeaderText: {
    color: '#9FB3C8',
  },
  stageLabelRow: {
    height: STAGE_ROW_HEIGHT,
    justifyContent: 'center',
  },
  stageLabelPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    height:'100%',
    width: '100%',
    justifyContent: 'center',
  },
  stageLabelText: {
    color: '#ffffff',
  },
  timelineScrollContainer: {
    flex: 1,
    position: 'relative',
  },
  timelineContent: {
    paddingRight: 80,
  },
  timelineGrid: {
    paddingRight: 40,
  },
  hoursRow: {
    height: TIME_ROW_HEIGHT,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#0A3652',
  },
  hourCell: {
    width: HOUR_WIDTH,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#0A3652',
  },
  hourText: {
    color: '#9FB3C8',
  },
  stageRow: {
    height: STAGE_ROW_HEIGHT,
    justifyContent: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#0A3652',
  },
  stageRowGrid: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  stageRowGridCell: {
    width: HOUR_WIDTH,
    borderRightWidth: 1,
    borderRightColor: '#0A3652',
  },
  eventCard: {
    position: 'absolute',
    height: '100%',
    top: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    elevation: 4,
  },
  eventName: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  eventTime: {
    color: '#FFFFFF',
    opacity: 0.85,
    marginTop: 2,
  },
  eventFavoriteIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  scrollHint: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollHintFade: {
    position: 'absolute',
    right: -8,
    width: 50,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 34, 57, 0.7)',
  },
});
