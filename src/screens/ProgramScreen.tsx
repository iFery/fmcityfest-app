import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  Animated,
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
import { useFavoriteFeedback } from '../hooks/useFavoriteFeedback';
import { useTimeline } from '../contexts/TimelineContext';
import Header from '../components/Header';
import Toast from '../components/Toast';
import { useTheme } from '../theme/ThemeProvider';
import { logEvent } from '../services/analytics';
import { useScreenView } from '../hooks/useScreenView';
import { hasEventEnded } from '../utils/eventTime';

dayjs.locale('cs');
dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.extend(isSameOrAfter);

type ProgramScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HEADER_HEIGHT = 130;
const PIXELS_PER_HOUR = 80;
const STAGE_HEADER_HEIGHT = 45;
const COMPACT_EVENT_HEIGHT_THRESHOLD = 65;
const LONG_EVENT_NAME_CHAR_THRESHOLD = 20;
const TIME_OFFSET_HOURS = 0; // např. +10 hodin

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

interface StageEventLayout {
  event: TimelineEvent;
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
  top: number;
  height: number;
  key: string;
}

export default function ProgramScreen() {
  const { globalStyles } = useTheme();
  const navigation = useNavigation<ProgramScreenNavigationProp>();
  const { loading, error } = useEvents();
  const { favoriteEvents, toggleEvent, isEventFavorite } = useFavorites();
  const previousTabRef = useRef<string | null>(null);
  useScreenView('Program');

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

  const { showPrompt, handleAccept, handleDismiss, onScroll: handleNotificationScroll } =
    useNotificationPrompt({
      enabled: true,
      triggerOnScroll: true,
    });

  const [helpExpanded, setHelpExpanded] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const helpOpacity = useRef(new Animated.Value(0)).current;
  const helpScale = useRef(new Animated.Value(0.98)).current;
  const helpTranslate = useRef(new Animated.Value(6)).current;

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

  const { timelineData, loading: timelineLoading, refetch: refetchTimeline } = useTimeline();
  const [day, setDay] = useState<'dayOne' | 'dayTwo'>('dayOne');
  const getNow = () => dayjs().add(TIME_OFFSET_HOURS, 'hour');
  const [currentTime, setCurrentTime] = useState(getNow());

  useFocusEffect(
    React.useCallback(() => {
      refetchTimeline();
    }, [refetchTimeline])
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(getNow());
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!timelineData) return;

    const now = currentTime;
    const dayOneStart = dayjs(timelineData.config.dayOne.start);
    const dayOneEnd = dayjs(timelineData.config.dayOne.end);
    const dayTwoStart = dayjs(timelineData.config.dayTwo.start);
    const dayTwoEnd = dayjs(timelineData.config.dayTwo.end);

    const isWithinRange = (start: dayjs.Dayjs, end: dayjs.Dayjs) =>
      (now.isAfter(start) || now.isSame(start)) && now.isBefore(end);

    if (isWithinRange(dayOneStart, dayOneEnd)) {
      setDay('dayOne');
    } else if (isWithinRange(dayTwoStart, dayTwoEnd)) {
      setDay('dayTwo');
    } else if (now.isAfter(dayOneEnd) && now.isBefore(dayTwoStart)) {
      setDay('dayTwo');
    }
  }, [timelineData, currentTime]);

  useEffect(() => {
    if (helpExpanded) {
      setHelpVisible(true);
      Animated.parallel([
        Animated.timing(helpOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(helpScale, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(helpTranslate, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(helpOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(helpScale, {
        toValue: 0.98,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(helpTranslate, {
        toValue: 6,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setHelpVisible(false);
    });
  }, [helpExpanded, helpOpacity, helpScale, helpTranslate]);

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

  const currentTimeIndicator = useMemo(() => {
    if (!timelineData) {
      return { visible: false, position: 0, label: '' };
    }

    const config = timelineData.config[day];
    if (!config) {
      return { visible: false, position: 0, label: '' };
    }

    const dayStart = dayjs(config.start);
    const dayEnd = dayjs(config.end);

    if (currentTime.isBefore(dayStart) || currentTime.isAfter(dayEnd)) {
      return { visible: false, position: 0, label: '' };
    }

    const totalMinutes = Math.max(dayEnd.diff(dayStart, 'minute'), 1);
    const elapsedMinutes = currentTime.diff(dayStart, 'minute');
    const clampedMinutes = Math.min(Math.max(elapsedMinutes, 0), totalMinutes);
    const position = (clampedMinutes / 60) * PIXELS_PER_HOUR;

    return {
      visible: true,
      position,
      label: currentTime.format('HH:mm'),
    };
  }, [timelineData, day, currentTime]);

  const showCurrentTime = currentTimeIndicator.visible;
  const currentTimeOffset = currentTimeIndicator.position;

  const handleEventPress = (event: TimelineEvent) => {
    if (event.interpret_id) {
      logEvent('event_open', {
        event_id: event.id,
        artist_id: event.interpret_id,
        stage: event.stage,
        source: 'program',
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

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.stickyHeader}>
          <Header title="PROGRAM" />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleNotificationScroll}
          scrollEventThrottle={400}
          bounces={false}
          overScrollMode="never"
        >
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
                    logEvent('program_day_switch', { day: key });
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

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.timelineContainer}>
              <View style={styles.hoursColumn}>
                {timeline.map((time, i) => (
                  <View key={i} style={styles.hourSlot}>
                    <Text style={[styles.hourText, globalStyles.caption]}>{time}</Text>
                  </View>
                ))}
              </View>

              {stagesConfig.map((stage) => {
                const currentDayStart = dayjs(timelineData.config[day].start);
                const stageEvents = dayEvents.filter((ev) => ev.stage === stage.stage);
                const stageEventLayouts = stageEvents
                  .map((event, i): StageEventLayout | null => {
                    if (!event.start || !event.end) return null;

                    const start = dayjs(event.start);
                    const end = dayjs(event.end);
                    const top = (start.diff(currentDayStart, 'minute') / 60) * PIXELS_PER_HOUR;
                    const height = Math.max(
                      40,
                      (end.diff(start, 'minute') / 60) * PIXELS_PER_HOUR
                    );

                    return {
                      event,
                      start,
                      end,
                      top,
                      height,
                      key: `${event.id}-${i}`,
                    };
                  })
                  .filter((layout): layout is StageEventLayout => layout !== null);
                const eventColor = stage.stageColorsArtist || stage.stageColors;

                return (
                  <View key={stage.stage} style={styles.stageColumn}>
                    <View style={[styles.stageHeader, { backgroundColor: stage.stageColors }]}>
                      <Text style={[styles.stageHeaderTitle, globalStyles.heading]}>
                        {stage.stage_name}
                      </Text>
                      <Text style={[styles.stageHeaderSubtitle, globalStyles.caption]}>STAGE</Text>
                    </View>

                    <View style={styles.stageTimeline}>
                      {timeline.map((_, i) => (
                        <View key={i} style={styles.timelineSlot} />
                      ))}
                      {stageEventLayouts.map(({ key, top, height }) => (
                        <View
                          key={`bg-${key}`}
                          pointerEvents="none"
                          style={[
                            styles.eventBackground,
                            {
                              top,
                              height,
                              backgroundColor: eventColor,
                            },
                          ]}
                        />
                      ))}
                      {showCurrentTime && (
                        <View
                          pointerEvents="none"
                          style={[
                            styles.currentTimeLine,
                            { top: currentTimeOffset },
                          ]}
                        />
                      )}
                      {stageEventLayouts.map(({ key, event, start, end, top, height }) => {
                        const isFavorite = event.id ? favoriteEvents.includes(event.id) : false;
                        const eventNameLength = (event.name || '').length;
                        const isCompactEvent =
                          height <= COMPACT_EVENT_HEIGHT_THRESHOLD &&
                          eventNameLength >= LONG_EVENT_NAME_CHAR_THRESHOLD;

                        return (
                          <TouchableOpacity
                            key={key}
                            onPress={() => handleEventPress(event)}
                            onLongPress={async () => {
                              if (!event.id) return;
                              const wasFavorite = isEventFavorite(event.id);
                              toggleEvent(event.id);
                              const label = event.name || event.artist || 'Koncert';
                              const isPastEvent = hasEventEnded(event.start, event.end);
                              logEvent('favorite_change', {
                                action: wasFavorite ? 'remove' : 'add',
                                entity_type: 'event',
                                event_id: event.id,
                                artist_id: event.interpret_id,
                                source: 'program_longpress',
                              });
                              if (!wasFavorite) {
                                await handleFavoriteAdded(label, { isPastEvent });
                              } else {
                                await handleFavoriteRemoved(label);
                              }
                            }}
                            delayLongPress={350}
                            style={[
                              styles.eventBlock,
                              {
                                top,
                                height,
                              },
                            ]}
                            activeOpacity={0.8}
                          >
                            <View
                              style={[
                                styles.eventContent,
                                isCompactEvent && styles.eventContentCompact,
                              ]}
                            >
                              <Text
                                style={[
                                  globalStyles.heading,
                                  styles.eventName,
                                  isCompactEvent && styles.eventNameCompact,
                                ]}
                                numberOfLines={2}
                              >
                                {event.name}
                              </Text>
                              <Text
                                style={[
                                  globalStyles.text,
                                  styles.eventTime,
                                  isCompactEvent && styles.eventTimeCompact,
                                ]}
                              >
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
          <View style={styles.experimentalLinkWrapper}>
            <TouchableOpacity
              onPress={() => {
                logEvent('layout_switch', { to: 'horizontal', source: 'program' });
                navigation.navigate('ProgramHorizontal');
              }}
              activeOpacity={0.75}
            >
              <Text style={[styles.experimentalLinkText, globalStyles.caption]}>
                👀 Zkus nový layout
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <View style={styles.helpContainer} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => {
              setHelpExpanded((prev) => {
                const next = !prev;
                logEvent('help_bubble_toggle', { state: next ? 'open' : 'close', source: 'program' });
                return next;
              });
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="help-circle-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          {helpVisible && (
            <Animated.View
              style={[
                styles.helpBubble,
                {
                  opacity: helpOpacity,
                  transform: [{ translateY: helpTranslate }, { scale: helpScale }],
                },
              ]}
            >
              <Text style={styles.helpText}>Podrž koncert a přidej ho do Můj program.</Text>
            </Animated.View>
          )}
        </View>
      </View>
      <NotificationPermissionModal
        visible={showPrompt}
        onAllowNotifications={handleAccept}
        onDismiss={handleDismiss}
        source="program-soft-prompt"
      />
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
        source="program-favorite-feedback"
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
  timelineContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  hoursColumn: {
    width: 60,
    paddingTop: STAGE_HEADER_HEIGHT,
    position: 'relative',
  },
  hourSlot: {
    height: PIXELS_PER_HOUR,
    justifyContent: 'flex-start',
  },
  hourText: {
    color: 'white',
  },
  stageColumn: {
    width: 140,
    marginRight: 10,
  },
  stageHeader: {
    paddingVertical: 10,
    alignItems: 'center',
    minHeight: STAGE_HEADER_HEIGHT,
    justifyContent: 'center',
  },
  stageHeaderTitle: {
    color: 'white',
  },
  stageHeaderSubtitle: {
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
  currentTimeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#EA5178',
  },
  currentTimeLineHours: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#EA5178',
    zIndex: 5,
  },
  eventBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'column',
    padding: 4,
    minHeight: 40,
  },
  eventBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  eventContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  eventContentCompact: {
    paddingHorizontal: 2,
  },
  eventName: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
  },
  eventNameCompact: {
    fontSize: 10,
    lineHeight: 12,
  },
  eventTime: {
    marginTop: 0,
    textAlign: 'center',
    fontSize: 12,
  },
  eventTimeCompact: {
    fontSize: 10,
  },
  eventFavoriteIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  helpContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D14D75',
    borderWidth: 1,
    borderColor: '#e24574',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBubble: {
    backgroundColor: '#D14D75',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e24574',
    maxWidth: 220,
  },
  helpText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  experimentalLinkWrapper: {
    marginTop: 18,
    marginBottom: 10,
    alignItems: 'center',
  },
  experimentalLinkText: {
    color: '#7CDDE4',
    textDecorationLine: 'underline',
  },
});
