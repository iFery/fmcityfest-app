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
  const navigation = useNavigation<FavoritesScreenNavigationProp>();
  const { artists, loading: artistsLoading } = useArtists();
  const { favoriteArtists, favoriteEvents, toggleArtist, toggleEvent } = useFavorites();
  const { timelineData, loading: timelineLoading } = useTimeline(); // Use shared timeline context
  const previousTabRef = useRef<string | null>(null);
  const [showPastEvents, setShowPastEvents] = useState(false);

  // Reset stack to FavoritesMain when returning to this tab from another tab
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
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Timeline data is now loaded via TimelineContext - no local loading needed

  // Get favorite events based on favorite event IDs
  const favoriteEventsList = useMemo(() => {
    if (!timelineData || favoriteEvents.length === 0) {
      return [];
    }
    
    return (timelineData.events as TimelineEvent[])
      .filter((event) => {
        return event.id && event.start && favoriteEvents.includes(event.id);
      })
      .sort((a, b) => {
        const startA = a.start ? new Date(a.start).getTime() : 0;
        const startB = b.start ? new Date(b.start).getTime() : 0;
        return startA - startB;
      });
  }, [timelineData, favoriteEvents]);

  // Separate upcoming and past events
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = dayjs();
    const upcoming: TimelineEvent[] = [];
    const past: TimelineEvent[] = [];

    favoriteEventsList.forEach((event) => {
      if (!event.start) return;
      
      const eventDate = dayjs(event.start);

      if (eventDate.isBefore(now)) {
        past.push(event);
      } else {
        upcoming.push(event);
      }
    });

    return {
      upcomingEvents: upcoming,
      pastEvents: past,
    };
  }, [favoriteEventsList]);

  // Get events to display
  const eventsToDisplay = useMemo(() => {
    return showPastEvents ? favoriteEventsList : upcomingEvents;
  }, [showPastEvents, favoriteEventsList, upcomingEvents]);

  // Group displayed events by day
  const displayedEventsByDay = useMemo(() => {
    const byDay: Record<string, TimelineEvent[]> = {};

    eventsToDisplay.forEach((event) => {
      if (!event.start) return;
      
      const dayKey = dayjs(event.start).format('YYYY-MM-DD');
      
      if (!byDay[dayKey]) {
        byDay[dayKey] = [];
      }
      byDay[dayKey].push(event);
    });

    return byDay;
  }, [eventsToDisplay]);

  // Get artists that have events in timeline
  const artistsWithEvents = useMemo(() => {
    if (!favoriteEventsList.length) return new Set<number>();
    const artistIds = new Set<number>();
    favoriteEventsList.forEach((event) => {
      if (event.interpret_id) {
        artistIds.add(event.interpret_id);
      }
    });
    return artistIds;
  }, [favoriteEventsList]);

  // Get favorite artists without scheduled events
  const unscheduledArtists = useMemo(() => {
    if (favoriteArtists.length === 0 || !artists.length) {
      return [];
    }

    return artists
      .filter((artist) => {
        const artistId = parseInt(artist.id, 10);
        const isFavorite = favoriteArtists.includes(artist.id);
        const hasEvents = artistsWithEvents.has(artistId);
        return isFavorite && !hasEvents;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [artists, favoriteArtists, artistsWithEvents]);

  const getArtistName = (artistId: number | string): string => {
    const found = artists.find((a) => String(a.id) === String(artistId));
    return found?.name || `Neznámý interpret (${artistId})`;
  };

  const getArtistImage = (artistId: number | string): string | null => {
    const found = artists.find((a) => String(a.id) === String(artistId));
    return found?.image || null;
  };

  const handleImageError = (artistId: string | number) => {
    setImageErrors((prev) => ({
      ...prev,
      [String(artistId)]: true,
    }));
  };

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

  // Only show loading if we don't have data yet
  // Data should be preloaded, so this should rarely happen
  const loading = (artistsLoading && artists.length === 0) || (timelineLoading && !timelineData);

  if (loading) {
    return (
      <>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA5178" />
          <Text style={styles.loadingText}>Načítám program...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        {/* Sticky Header */}
        <View style={styles.stickyHeader}>
          <Header title="MŮJ PROGRAM" />
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          overScrollMode="never"
          refreshControl={undefined}
        >
          {favoriteEventsList.length === 0 && unscheduledArtists.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Nemáš zatím uložené žádné interprety.
              </Text>
            </View>
          ) : (
            <>
              {/* Toggle for past events */}
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
                  <Text style={styles.toggleText}>
                    {showPastEvents
                      ? `Skrýt proběhlé koncerty (${pastEvents.length})`
                      : `Zobrazit proběhlé koncerty (${pastEvents.length})`}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Scheduled events grouped by day */}
              {eventsToDisplay.length > 0 && (
                <>
                  {Object.entries(displayedEventsByDay)
                    .sort(([dayA], [dayB]) => {
                      const dateA = dayjs(dayA);
                      const dateB = dayjs(dayB);
                      return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
                    })
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
                            <Text style={[styles.dayTitle, isPast && styles.dayTitlePast]}>
                              {dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}
                            </Text>
                            <Text style={styles.dayCount}>({dayEvents.length})</Text>
                          </View>
                          {dayEvents.map((event, index) => {
                              if (!event.start || !event.interpret_id || !event.id) return null;

                              const startDate = dayjs(event.start);
                              const endDate = dayjs(event.end || event.start);
                              const startTime = startDate.format('HH:mm');
                              const endTime = endDate.format('HH:mm');
                              const artistId = event.interpret_id;
                              const artistName = getArtistName(artistId);
                              // Použij název z timeline, pokud existuje, jinak název interpreta
                              const displayName = event.name || artistName;
                              const artistImage = getArtistImage(artistId);
                              const hasImageError = imageErrors[String(artistId)];

                              return (
                                <TouchableOpacity
                                  key={event.id || `${artistId}_${event.start}_${index}`}
                                  style={[styles.eventCard, isPast && styles.eventCardPast]}
                                  onPress={() => handleEventPress(event)}
                                  activeOpacity={0.7}
                                >
                                  <View style={styles.eventRow}>
                                    {artistImage && !hasImageError ? (
                                      <Image
                                        source={{ uri: artistImage }}
                                        style={styles.artistPhoto}
                                        resizeMode="cover"
                                        onError={() => handleImageError(artistId)}
                                      />
                                    ) : (
                                      <View style={styles.artistPhotoPlaceholder}>
                                        <Ionicons name="musical-notes" size={18} color="#666" />
                                      </View>
                                    )}

                                    <View style={styles.eventInfo}>
                                      <Text style={[styles.artistName, isPast && styles.artistNamePast]} numberOfLines={2}>
                                        {displayName}
                                      </Text>
                                      <View style={styles.eventDetailsRow}>
                                        {event.stage_name && (
                                          <Text style={[styles.stage, isPast && styles.stagePast]}>
                                            {event.stage_name} stage
                                          </Text>
                                        )}
                                        <Text style={[styles.timeCompact, isPast && styles.timeCompactPast]}>
                                          {startTime} - {endTime}
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

              {/* Unscheduled artists */}
              {unscheduledArtists.length > 0 && (
                <View style={styles.unscheduledSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="time-outline" size={24} color="#EA5178" />
                    <Text style={styles.sectionTitle}>Nenaplánované koncerty</Text>
                    <Text style={styles.sectionCount}>({unscheduledArtists.length})</Text>
                  </View>
                  {unscheduledArtists.map((artist) => (
                    <ArtistCard
                      key={artist.id}
                      artist={artist}
                      onPress={() => handleArtistPress(artist)}
                      showFavoriteButton={true}
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
    fontSize: 16,
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
    fontSize: 13,
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  dayTitlePast: {
    color: '#666',
    opacity: 0.7,
  },
  dayCount: {
    color: '#999',
    fontSize: 13,
    fontWeight: '500',
  },
  eventCard: {
    backgroundColor: '#0A3652',
    padding: 10,
    marginBottom: 8,
    borderRadius: 0,
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
    fontWeight: '600',
    fontSize: 15,
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
    fontSize: 12,
    flex: 1,
  },
  stagePast: {
    color: '#666',
  },
  timeCompact: {
    color: '#EA5178',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 12,
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
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginLeft: 8,
    flex: 1,
  },
  sectionCount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#CCC',
  },
});
