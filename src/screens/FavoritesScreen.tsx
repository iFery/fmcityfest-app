import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  Image,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/cs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { RootStackParamList } from '../navigation/linking';
import { useArtists } from '../hooks/useArtists';
import { useFavorites } from '../hooks/useFavorites';
import { useTimeline } from '../contexts/TimelineContext';
import Header from '../components/Header';
import { useTheme } from '../theme/ThemeProvider';
import { logEvent } from '../services/analytics';
import { useScreenView } from '../hooks/useScreenView';
import { sharedProgramApi } from '../api/endpoints';

dayjs.locale('cs');
dayjs.extend(localizedFormat);

type FavoritesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HEADER_HEIGHT = 130;

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

export default function FavoritesScreen() {
  const { globalStyles } = useTheme();
  const navigation = useNavigation<FavoritesScreenNavigationProp>();
  const { artists, loading: artistsLoading } = useArtists();
  const { favoriteEvents } = useFavorites();
  const { timelineData, loading: timelineLoading } = useTimeline();
  const insets = useSafeAreaInsets();
  const previousTabRef = useRef<string | null>(null);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [shareLoading, setShareLoading] = useState(false);
  const shareDisabled = !favoriteEvents.length || shareLoading;
  useScreenView('Favorites');

  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      if (!parent) return;

      const tabState = parent.getState();
      const currentTab = tabState.routes[tabState.index];
      const previousTabName = previousTabRef.current;

      previousTabRef.current = currentTab?.name ?? null;

      if (currentTab?.name === 'Favorites' && previousTabName && previousTabName !== 'Favorites') {
        const stackState = currentTab.state;
        const stackIndex = stackState?.index ?? 0;

        if (stackIndex > 0) {
          requestAnimationFrame(() => {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'FavoritesMain' }],
              })
            );
          });
        }
      }
    }, [navigation])
  );

  const favoriteEventsList = useMemo(() => {
    if (!timelineData || favoriteEvents.length === 0) return [];

    return (timelineData.events as TimelineEvent[])
      .filter((event) => {
        if (!event.id || !event.start) return false;
        return favoriteEvents.includes(String(event.id));
      })
      .sort((a, b) => {
        const startA = a.start ? new Date(a.start).getTime() : 0;
        const startB = b.start ? new Date(b.start).getTime() : 0;
        return startA - startB;
      });
  }, [timelineData, favoriteEvents]);

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = dayjs();
    const upcoming: TimelineEvent[] = [];
    const past: TimelineEvent[] = [];

    favoriteEventsList.forEach((event) => {
      if (!event.start) return;
      const eventDate = dayjs(event.start);
      if (eventDate.isBefore(now)) past.push(event);
      else upcoming.push(event);
    });

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [favoriteEventsList]);

  const eventsToDisplay = useMemo(
    () => (showPastEvents ? favoriteEventsList : upcomingEvents),
    [showPastEvents, favoriteEventsList, upcomingEvents]
  );

  const displayedEventsByDay = useMemo(() => {
    const byDay: Record<string, TimelineEvent[]> = {};
    eventsToDisplay.forEach((event) => {
      if (!event.start) return;
      const dayKey = dayjs(event.start).format('YYYY-MM-DD');
      if (!byDay[dayKey]) byDay[dayKey] = [];
      byDay[dayKey].push(event);
    });
    return byDay;
  }, [eventsToDisplay]);

  const getArtistName = (artistId: number | string): string =>
    artists.find((a) => String(a.id) === String(artistId))?.name ||
    `Neznámý interpret (${artistId})`;

  const getArtistImage = (artistId: number | string): string | null =>
    artists.find((a) => String(a.id) === String(artistId))?.image || null;

  const handleImageError = (artistId: string | number) =>
    setImageErrors((p) => ({ ...p, [String(artistId)]: true }));

  const handleEventPress = (event: TimelineEvent) => {
    if (event.interpret_id) {
      logEvent('favorite_open', {
        event_id: event.id,
        artist_id: event.interpret_id,
        source: showPastEvents ? 'favorites_past' : 'favorites_upcoming',
      });
      navigation.navigate('ArtistDetail', {
        artistId: event.interpret_id.toString(),
        artistName: event.name || getArtistName(event.interpret_id),
      });
    }
  };

  const handleShareProgram = useCallback(async () => {
    if (!favoriteEvents.length) {
      Alert.alert('Nic k sdílení', 'Vyber si aspoň jeden koncert ve svém programu.');
      return;
    }

    try {
      setShareLoading(true);
      const response = await sharedProgramApi.create(favoriteEvents);
      const code = response.data.code;
      const shareUrl = sharedProgramApi.buildShareUrl(code);

      await Share.share({
        message: `Můj program na FM CITY FEST:\n${shareUrl}`,
      });

      logEvent('favorites_share', {
        code,
        items: favoriteEvents.length,
      });
    } catch (error) {
      console.error('Failed to share program', error);
      Alert.alert('Ups!', 'Sdílení se nepovedlo. Zkus to prosím znovu.');
    } finally {
      setShareLoading(false);
    }
  }, [favoriteEvents]);

  const loading =
    (artistsLoading && artists.length === 0) || (timelineLoading && !timelineData);

  if (loading) {
    return (
      <>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA5178" />
          <Text style={[globalStyles.text, styles.loadingText]}>Načítám program...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.stickyHeader}>
          <Header title="MŮJ PROGRAM" />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 160 + Math.max(insets.bottom, 24) },
          ]}
          bounces={false}
          overScrollMode="never"
        >
          {favoriteEventsList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[globalStyles.text, styles.emptyText]}>
                Nemáš zatím uložené žádné koncerty.
              </Text>
            </View>
          ) : (
            <>
              {pastEvents.length > 0 && (
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => {
                    setShowPastEvents((prev) => {
                      const next = !prev;
                      logEvent('favorites_toggle_past', { value: next });
                      return next;
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPastEvents ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#EA5178"
                  />
                  <Text style={[globalStyles.caption, styles.toggleText]}>
                    {showPastEvents
                      ? `Skrýt proběhlé koncerty (${pastEvents.length})`
                      : `Zobrazit proběhlé koncerty (${pastEvents.length})`}
                  </Text>
                </TouchableOpacity>
              )}

              {eventsToDisplay.length > 0 &&
                Object.entries(displayedEventsByDay)
                  .sort(([a], [b]) =>
                    dayjs(a).isBefore(dayjs(b)) ? -1 : dayjs(a).isAfter(dayjs(b)) ? 1 : 0
                  )
                  .map(([dayKey, dayEvents]) => {
                    const dayDate = dayjs(dayKey);
                    const isToday = dayDate.isSame(dayjs(), 'day');
                    const isPast = dayDate.isBefore(dayjs(), 'day');
                    const dayLabel = isToday
                      ? 'Dnes'
                      : dayDate.format('dddd D. MMMM');

                    return (
                      <View key={dayKey} style={styles.daySection}>
                        <View style={styles.dayHeader}>
                          <Text
                            style={[
                              globalStyles.heading,
                              styles.dayTitle,
                              isPast && styles.dayTitlePast,
                            ]}
                          >
                            {dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}
                          </Text>
                          <Text style={[globalStyles.caption, styles.dayCount]}>
                            ({dayEvents.length})
                          </Text>
                        </View>

                        {dayEvents.map((event, i) => {
                          if (!event.start || !event.interpret_id || !event.id) return null;

                          const start = dayjs(event.start);
                          const end = dayjs(event.end || event.start);
                          const artistId = event.interpret_id;
                          const name = event.name || getArtistName(artistId);
                          const img = getArtistImage(artistId);
                          const hasErr = imageErrors[String(artistId)];

                          return (
                            <TouchableOpacity
                              key={event.id || `${artistId}_${i}`}
                              style={[styles.eventCard, isPast && styles.eventCardPast]}
                              onPress={() => handleEventPress(event)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.eventRow}>
                                {img && !hasErr ? (
                                  <Image
                                    source={{ uri: img }}
                                    style={styles.artistPhoto}
                                    onError={() => handleImageError(artistId)}
                                  />
                                ) : (
                                  <View style={styles.artistPhotoPlaceholder}>
                                    <Ionicons name="musical-notes" size={18} color="#666" />
                                  </View>
                                )}

                                <View style={styles.eventInfo}>
                                  <Text
                                    style={[
                                      globalStyles.heading,
                                      styles.artistName,
                                      isPast && styles.artistNamePast,
                                    ]}
                                    numberOfLines={2}
                                  >
                                    {name}
                                  </Text>
                                  <View style={styles.eventDetailsRow}>
                                    {event.stage_name && (
                                      <Text
                                        style={[
                                          globalStyles.caption,
                                          styles.stage,
                                          isPast && styles.stagePast,
                                        ]}
                                      >
                                        {event.stage_name} stage
                                      </Text>
                                    )}
                                    <Text
                                      style={[
                                        globalStyles.heading,
                                        styles.timeCompact,
                                        isPast && styles.timeCompactPast,
                                      ]}
                                    >
                                      {start.format('HH:mm')} – {end.format('HH:mm')}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  })}

            </>
          )}
        </ScrollView>

        <View style={styles.shareFabContainer} pointerEvents="box-none">
          <TouchableOpacity
            style={[
              styles.shareFab,
              shareDisabled && styles.shareFabDisabled,
              { bottom: Math.max(insets.bottom + 24, 32) },
            ]}
            onPress={handleShareProgram}
            disabled={shareDisabled}
            activeOpacity={0.85}
            accessibilityLabel="Sdílet můj program"
          >
            {shareLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="share-social" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
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
    color: 'white',
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
    paddingTop: HEADER_HEIGHT + 10,
    paddingHorizontal: 16,
  },
  shareFabContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shareFab: {
    position: 'absolute',
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#D14D75',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  shareFabDisabled: {
    backgroundColor: '#6B2E45',
    opacity: 0.5,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    color: 'white',
    textAlign: 'center',
    marginVertical: 30,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A3652',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EA5178',
  },
  toggleText: {
    color: '#EA5178',
    marginLeft: 8,
  },
  daySection: {
    marginBottom: 20,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1A3B5A',
  },
  dayTitle: {
    color: '#EA5178',
    marginRight: 8,
  },
  dayTitlePast: {
    color: '#666',
    opacity: 0.7,
  },
  dayCount: {
    color: '#999',
  },
  eventCard: {
    backgroundColor: '#0A3652',
    padding: 10,
    marginBottom: 8,
  },
  eventCardPast: {
    backgroundColor: '#0A1F2E',
    opacity: 0.6,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artistPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  artistPhotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#1A3B5A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  artistName: {
    color: 'white',
    marginBottom: 6,
  },
  artistNamePast: {
    color: '#999',
  },
  eventDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stage: {
    color: '#CCC',
    flex: 1,
  },
  stagePast: {
    color: '#666',
  },
  timeCompact: {
    color: '#EA5178',
    marginLeft: 12,
    fontSize: 14,
  },
  timeCompactPast: {
    color: '#999',
    opacity: 0.7,
  },
  unscheduledSection: {
    marginTop: 32,
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
    color: 'white',
    marginLeft: 8,
    flex: 1,
  },
  sectionCount: {
    color: '#CCC',
  },
});
