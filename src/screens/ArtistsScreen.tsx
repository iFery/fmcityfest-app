import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/linking';
import { useArtists } from '../hooks/useArtists';
import { useFavorites } from '../hooks/useFavorites';
import { useFavoriteFeedback } from '../hooks/useFavoriteFeedback';
import { useNotificationPrompt } from '../hooks/useNotificationPrompt';
import { useTimeline } from '../contexts/TimelineContext';
import NotificationPermissionModal from '../components/NotificationPermissionModal';
import EventSelectionModal from '../components/EventSelectionModal';
import Toast from '../components/Toast';
import Header from '../components/Header';
import { useTheme } from '../theme/ThemeProvider';
import { logEvent } from '../services/analytics';
import { useScreenView } from '../hooks/useScreenView';
import { hasEventEnded } from '../utils/eventTime';
import type { Artist } from '../types';

type ArtistsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const NUM_COLUMNS = 2;
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

export default function ArtistsScreen() {
  const { globalStyles } = useTheme();
  const navigation = useNavigation<ArtistsScreenNavigationProp>();
  const { artists, loading, error, refetch } = useArtists();
  const { toggleEvent, isArtistFavorite, isEventFavorite, favoriteEvents } = useFavorites();
  const { timelineData } = useTimeline();
  const previousTabRef = useRef<string | null>(null);
  useScreenView('Artists');

  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [selectedArtistForModal, setSelectedArtistForModal] = useState<Artist | null>(null);
  const [selectedArtistEvents, setSelectedArtistEvents] = useState<TimelineEvent[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      if (!parent) return;

      const tabState = parent.getState();
      const currentTab = tabState.routes[tabState.index];
      const previousTabName = previousTabRef.current;

      previousTabRef.current = currentTab?.name ?? null;

      if (currentTab?.name === 'Artists' && previousTabName && previousTabName !== 'Artists') {
        const stackState = currentTab.state;
        const stackIndex = stackState?.index ?? 0;

        if (stackIndex > 0) {
          requestAnimationFrame(() => {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'ArtistsMain' }],
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

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
  } = useFavoriteFeedback({ promptStyle: 'modal' });

  const categories = useMemo(() => {
    const cats = Array.from(new Set(artists.map((artist) => artist.genre || 'Ostatní')));
    return ['Všichni', ...cats.sort()];
  }, [artists]);

  const filteredArtists = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'Všichni') {
      return artists;
    }
    return artists.filter((artist) => artist.genre === selectedCategory);
  }, [artists, selectedCategory]);

  const displayArtists = useMemo(() => {
    if (filteredArtists.length % NUM_COLUMNS === 1) {
      return [...filteredArtists, { id: 'spacer' } as Artist & { id: string }];
    }
    return filteredArtists;
  }, [filteredArtists]);

  const artistEventsMap = useMemo(() => {
    if (!timelineData) return new Map<string, TimelineEvent[]>();

    const map = new Map<string, TimelineEvent[]>();
    const events = timelineData.events as TimelineEvent[];

    events.forEach((event) => {
      if (event.interpret_id && event.start && event.id) {
        const artistId = event.interpret_id.toString();
        if (!map.has(artistId)) {
          map.set(artistId, []);
        }
        map.get(artistId)!.push(event);
      }
    });

    return map;
  }, [timelineData]);

  const artistFavoriteStatusMap = useMemo(() => {
    const map = new Map<string, boolean>();

    filteredArtists.forEach((artist) => {
      const artistId = artist.id;
      map.set(artistId, isArtistFavorite(artistId));
    });

    return map;
  }, [filteredArtists, isArtistFavorite]);

  const handleArtistPress = useCallback((artist: Artist) => {
    logEvent('artist_open', { artist_id: artist.id, artist_name: artist.name, source: 'artists_grid' });
    navigation.navigate('ArtistDetail', {
      artistId: artist.id,
      artistName: artist.name,
    });
  }, [navigation]);

  const handleFavoritePress = useCallback(
    async (artistId: string) => {
      const artist = artists.find((a) => a.id === artistId);
      if (!artist) return;

      const artistEvents = artistEventsMap.get(artistId) || [];

      if (artistEvents.length > 1) {
        logEvent('event_selection_modal', { action: 'open', artist_id: artistId, events_count: artistEvents.length });
        setSelectedArtistForModal(artist);
        setSelectedArtistEvents(artistEvents);
        setEventModalVisible(true);
        return;
      }

      const eventId = artistEvents[0]?.id;
      if (!eventId) return;

      const wasFavorite = isEventFavorite(eventId);
      toggleEvent(eventId);

      logEvent('favorite_change', {
        action: wasFavorite ? 'remove' : 'add',
        entity_type: 'event',
        event_id: eventId,
        artist_id: artistId,
        source: 'artists_grid',
      });

      const isPastEvent = hasEventEnded(artistEvents[0]?.start, artistEvents[0]?.end);
      if (!wasFavorite) {
        await handleFavoriteAdded(artist.name || 'Interpret', { isPastEvent });
      } else {
        await handleFavoriteRemoved(artist.name || 'Interpret');
      }
    },
    [artists, artistEventsMap, handleFavoriteAdded, handleFavoriteRemoved, isEventFavorite, toggleEvent]
  );

  const handleEventToggle = useCallback(
    async (event: TimelineEvent) => {
      const eventId = event.id;
      if (!eventId) return;
      const wasFavorite = isEventFavorite(eventId);
      toggleEvent(eventId);
      const label = event.name || 'Koncert';
      const isPastEvent = hasEventEnded(event.start, event.end);

      logEvent('favorite_change', {
        action: wasFavorite ? 'remove' : 'add',
        entity_type: 'event',
        event_id: eventId,
        source: 'event_selection_modal',
      });

      if (!wasFavorite) {
        await handleFavoriteAdded(label, { isPastEvent });
      } else {
        await handleFavoriteRemoved(label);
      }
    },
    [handleFavoriteAdded, handleFavoriteRemoved, isEventFavorite, toggleEvent]
  );

  const handleEventModalDismiss = useCallback(() => {
    hideToast();
    setEventModalVisible(false);
    setSelectedArtistForModal(null);
    setSelectedArtistEvents([]);
    if (selectedArtistForModal?.id) {
      logEvent('event_selection_modal', { action: 'close', artist_id: selectedArtistForModal.id });
    }
  }, [hideToast, selectedArtistForModal]);

  const renderArtistCard = useCallback(
    ({ item }: { item: Artist & { id?: string } }) => {
      if (item.id === 'spacer') {
        return <View style={[styles.card, { backgroundColor: 'transparent' }]} />;
      }

      const isFavorite = artistFavoriteStatusMap.get(item.id) || false;
      const artistEvents = artistEventsMap.get(item.id) || [];
      const canFavorite = artistEvents.length > 0;

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleArtistPress(item)}
          activeOpacity={0.8}
        >
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="musical-notes" size={48} color="#666" />
            </View>
          )}
          <View style={styles.overlay}>
            <Text style={[globalStyles.heading, styles.name]} numberOfLines={2}>
              {item.name}
            </Text>
          </View>
          {canFavorite && (
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={(e) => {
                e.stopPropagation();
                handleFavoritePress(item.id);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorite ? '#EA5178' : '#FFFFFF'}
              />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      );
    },
    [artistFavoriteStatusMap, artistEventsMap, handleArtistPress, handleFavoritePress, globalStyles.heading]
  );

  const renderFilters = () => (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
      >
        {categories.map((category) => {
          const active =
            selectedCategory === category || (!selectedCategory && category === 'Všichni');

          return (
            <TouchableOpacity
              key={category}
              style={[styles.filterButton, active && styles.activeFilterButton]}
              onPress={() => {
                const nextCategory = category === 'Všichni' ? null : category;
                setSelectedCategory(nextCategory);
                logEvent('filter_select', { category: nextCategory || 'Všichni', source: 'artists' });
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  globalStyles.subtitle,
                  styles.filterText,
                  active && styles.activeFilterText,
                ]}
              >
                {category.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const keyExtractor = (item: Artist & { id?: string }, index: number) =>
    item.id?.toString() || index.toString();

  if (loading && artists.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <ActivityIndicator size="large" color="#EA5178" />
        <Text style={[globalStyles.text, styles.loadingText]}>Načítání interpretů...</Text>
      </View>
    );
  }

  if (error && artists.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <Ionicons name="alert-circle-outline" size={48} color="#EA5178" />
        <Text style={[globalStyles.text, styles.errorText]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={[globalStyles.subtitle, styles.retryButtonText]}>Zkusit znovu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.stickyHeader}>
          <Header title="INTERPRETI" />
        </View>

        <FlatList
          data={displayArtists}
          keyExtractor={keyExtractor}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={styles.row}
          renderItem={renderArtistCard}
          ListHeaderComponent={renderFilters}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          onScroll={handleNotificationScroll}
          scrollEventThrottle={400}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
        />

        {!eventModalVisible && (
          <Toast
            visible={toastVisible}
            message={toastMessage}
            onDismiss={hideToast}
            duration={toastDuration}
            actionButton={toastAction}
          />
        )}
      </View>

      <NotificationPermissionModal
        visible={showPrompt}
        onAllowNotifications={handleAccept}
        onDismiss={handleDismiss}
        source="artists-soft-prompt"
      />
      <NotificationPermissionModal
        visible={permissionModalVisible}
        onAllowNotifications={handlePermissionAccept}
        onDismiss={handlePermissionDismiss}
        source="artists-favorite-feedback"
      />
      <EventSelectionModal
        visible={eventModalVisible}
        artistName={selectedArtistForModal?.name || ''}
        events={selectedArtistEvents}
        favoriteEventIds={favoriteEvents}
        onToggleEvent={handleEventToggle}
        onDismiss={handleEventModalDismiss}
        toastVisible={toastVisible}
        toastMessage={toastMessage}
        toastDuration={toastDuration}
        toastAction={toastAction}
        onToastDismiss={hideToast}
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
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#002239',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#EA5178',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
  filterContainer: {
    paddingVertical: 10,
  },
  filterList: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  filterButton: {
    borderColor: '#FFFFFF',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 0,
    marginRight: 10,
    marginBottom: 10,
  },
  activeFilterButton: {
    backgroundColor: '#EA5178',
    borderColor: '#EA5178',
  },
  filterText: {
    color: '#FFFFFF',
    textTransform: 'uppercase',
    fontSize: 14,
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#002239',
  },
  listContent: {
    paddingTop: HEADER_HEIGHT,
    paddingBottom: 30,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  card: {
    flex: 1,
    aspectRatio: 1,
    margin: 5,
    backgroundColor: '#0A3652',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a3a5a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 4,
  },
});
