import React, { useMemo, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
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
import ArtistCard from '../components/ArtistCard';
import { useTheme } from '../theme/ThemeProvider';
import type { Artist } from '../types';

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
  const { favoriteArtists, favoriteEvents, toggleArtist } = useFavorites();
  const { timelineData, loading: timelineLoading } = useTimeline();
  const previousTabRef = useRef<string | null>(null);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

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
      .filter((event) => event.id && event.start && favoriteEvents.includes(event.id))
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

  const artistsWithEvents = useMemo(() => {
    if (!favoriteEventsList.length) return new Set<number>();
    const set = new Set<number>();
    favoriteEventsList.forEach((e) => e.interpret_id && set.add(e.interpret_id));
    return set;
  }, [favoriteEventsList]);

  const unscheduledArtists = useMemo(() => {
    if (!favoriteArtists.length || !artists.length) return [];
    return artists
      .filter((a) => {
        const id = parseInt(a.id, 10);
        return favoriteArtists.includes(a.id) && !artistsWithEvents.has(id);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [artists, favoriteArtists, artistsWithEvents]);

  const getArtistName = (artistId: number | string): string =>
    artists.find((a) => String(a.id) === String(artistId))?.name ||
    `Neznámý interpret (${artistId})`;

  const getArtistImage = (artistId: number | string): string | null =>
    artists.find((a) => String(a.id) === String(artistId))?.image || null;

  const handleImageError = (artistId: string | number) =>
    setImageErrors((p) => ({ ...p, [String(artistId)]: true }));

  const handleEventPress = (event: TimelineEvent) => {
    if (event.interpret_id) {
      navigation.navigate('ArtistDetail', {
        artistId: event.interpret_id.toString(),
        artistName: event.name || getArtistName(event.interpret_id),
      });
    }
  };

  const handleArtistPress = (artist: Artist) => {
    navigation.navigate('ArtistDetail', {
      artistId: artist.id,
      artistName: artist.name,
    });
  };

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
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          overScrollMode="never"
        >
          {favoriteEventsList.length === 0 && unscheduledArtists.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[globalStyles.text, styles.emptyText]}>
                Nemáš zatím uložené žádné interprety.
              </Text>
            </View>
          ) : (
            <>
              {pastEvents.length > 0 && (
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => setShowPastEvents(!showPastEvents)}
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

              {unscheduledArtists.length > 0 && (
                <View style={styles.unscheduledSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="time-outline" size={24} color="#EA5178" />
                    <Text style={[styles.sectionTitle, globalStyles.heading]}>
                      Nenaplánované koncerty
                    </Text>
                    <Text style={[styles.sectionCount, globalStyles.caption]}>
                      ({unscheduledArtists.length})
                    </Text>
                  </View>

                  {unscheduledArtists.map((artist) => (
                    <ArtistCard
                      key={artist.id}
                      artist={artist}
                      onPress={() => handleArtistPress(artist)}
                      showFavoriteButton
                      isFavorite={favoriteArtists.includes(artist.id)}
                      onFavoritePress={() => toggleArtist(artist.id)}
                    />
                  ))}
                </View>
              )}
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
    paddingBottom: 30,
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