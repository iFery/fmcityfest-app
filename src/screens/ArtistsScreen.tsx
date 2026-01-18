import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
import * as Notifications from 'expo-notifications';
import { RootStackParamList } from '../navigation/linking';
import { useArtists } from '../hooks/useArtists';
import { useFavorites } from '../hooks/useFavorites';
import { useNotificationPrompt } from '../hooks/useNotificationPrompt';
import { useTimeline } from '../contexts/TimelineContext';
import NotificationPermissionModal from '../components/NotificationPermissionModal';
import EventSelectionModal from '../components/EventSelectionModal';
import Toast from '../components/Toast';
import Header from '../components/Header';
import { notificationService } from '../services';
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
  const navigation = useNavigation<ArtistsScreenNavigationProp>();
  const { artists, loading, error, refetch } = useArtists();
  const { toggleArtist, toggleEvent, isArtistFavorite, favoriteEvents, favoriteArtists } = useFavorites();
  const { timelineData } = useTimeline(); // Use shared timeline context instead of local state
  const previousTabRef = useRef<string | null>(null);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [selectedArtistForModal, setSelectedArtistForModal] = useState<Artist | null>(null);
  const [selectedArtistEvents, setSelectedArtistEvents] = useState<TimelineEvent[]>([]);

  // Reset stack to ArtistsMain when returning to this tab from another tab
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

  const { showPrompt, handleAccept, handleDismiss, onScroll: handleNotificationScroll } = useNotificationPrompt({
    enabled: true,
    triggerOnScroll: true,
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState<boolean | null>(null);
  const [showFavoritePermissionModal, setShowFavoritePermissionModal] = useState(false);

  React.useEffect(() => {
    const checkPermission = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationPermissionGranted(status === 'granted');
    };
    checkPermission();
  }, []);

  // Timeline data is now loaded via TimelineContext - no local loading needed

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

  // Performance optimization: Pre-compute artist-to-events mapping once
  // This prevents expensive filtering on every render
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

  // Performance optimization: Pre-compute favorite status for all artists
  // This prevents repeated lookups and filtering during render
  const artistFavoriteStatusMap = useMemo(() => {
    const map = new Map<string, boolean>();
    
    filteredArtists.forEach((artist) => {
      const artistId = artist.id;
      let isFavorite = favoriteArtists.includes(artistId);
      
      // For artists with multiple events, check if any event is favorite
      if (timelineData && !isFavorite) {
        const artistEvents = artistEventsMap.get(artistId) || [];
        if (artistEvents.length > 1) {
          isFavorite = artistEvents.some(
            (event) => event.id && favoriteEvents.includes(event.id)
          );
        }
      }
      
      map.set(artistId, isFavorite);
    });
    
    return map;
  }, [filteredArtists, timelineData, artistEventsMap, favoriteArtists, favoriteEvents]);

  const handleArtistPress = (artist: Artist) => {
    navigation.navigate('ArtistDetail', {
      artistId: artist.id,
      artistName: artist.name,
    });
  };

  const handleFavoritePress = useCallback(async (artistId: string) => {
    const artist = artists.find((a) => a.id === artistId);
    if (!artist) return;

    // Performance optimization: Use pre-computed events map instead of filtering
    const artistEvents = artistEventsMap.get(artistId) || [];

    // Pokud má interpret více koncertů, zobraz modal
    if (artistEvents.length > 1) {
      setSelectedArtistForModal(artist);
      setSelectedArtistEvents(artistEvents);
      setEventModalVisible(true);
      return;
    }

    // Pro interprety s jedním koncertem použij původní logiku
    const wasFavorite = isArtistFavorite(artistId);
    toggleArtist(artistId);

    const artistName = artist?.name || 'Interpret';

    if (!wasFavorite) {
      // Added to favorites
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        setToastMessage('❤️ Přidáno do Můj program! 🔔');
        setToastVisible(true);
      } else {
        // Pokud nemá povolené notifikace, zobraz modal pro žádost o povolení
        setShowFavoritePermissionModal(true);
      }
    } else {
      // Removed from favorites
      setToastMessage('💔 Odebráno z Můj program.');
      setToastVisible(true);
    }
  }, [artists, isArtistFavorite, toggleArtist, artistEventsMap]);

  const handleEventToggle = useCallback((eventId: string) => {
    toggleEvent(eventId);
  }, [toggleEvent]);

  const handleEventModalDismiss = useCallback(() => {
    setEventModalVisible(false);
    setSelectedArtistForModal(null);
    setSelectedArtistEvents([]);
  }, []);

  const handleFavoritePermissionAccept = useCallback(async () => {
    setShowFavoritePermissionModal(false);
    const granted = await notificationService.requestPermissions();
    
    // Aktualizuj stav povolení
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationPermissionGranted(status === 'granted');
    
    if (granted) {
      await notificationService.getToken();
      setToastMessage('❤️ Přidáno do Můj program! 🔔 Dostaneš upozornění 10 min před.');
    } else {
      setToastMessage('❤️ Přidáno do Můj program! 🔕 Notifikace nejsou povolené.');
    }
    setToastVisible(true);
  }, []);

  const handleFavoritePermissionDismiss = useCallback(() => {
    setShowFavoritePermissionModal(false);
    setToastMessage('❤️ Přidáno do Můj program! 🔕 Notifikace nejsou povolené.');
    setToastVisible(true);
  }, []);

  // Performance optimization: Memoized render function with pre-computed data
  // Uses useCallback to prevent recreation on every render
  const renderArtistCard = useCallback(
    ({ item }: { item: Artist & { id?: string } }) => {
      if (item.id === 'spacer') {
        return <View style={[styles.card, { backgroundColor: 'transparent' }]} />;
      }

      // Use pre-computed favorite status instead of filtering on every render
      const isFavorite = artistFavoriteStatusMap.get(item.id) || false;

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
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
          </View>
          {/* Srdíčko - pro interprety s více koncerty se zobrazí modal při kliknutí */}
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
        </TouchableOpacity>
      );
    },
    [artistFavoriteStatusMap, handleArtistPress, handleFavoritePress]
  );

  const renderFilters = () => (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterButton,
              selectedCategory === category || (!selectedCategory && category === 'Všichni')
                ? styles.activeFilterButton
                : null,
            ]}
            onPress={() => setSelectedCategory(category === 'Všichni' ? null : category)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategory === category || (!selectedCategory && category === 'Všichni')
                  ? styles.activeFilterText
                  : null,
              ]}
            >
              {category.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const keyExtractor = (item: Artist & { id?: string }, index: number) => {
    return item.id?.toString() || index.toString();
  };

  if (loading && artists.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <ActivityIndicator size="large" color="#EA5178" />
        <Text style={styles.loadingText}>Načítání interpretů...</Text>
      </View>
    );
  }

  if (error && artists.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <Ionicons name="alert-circle-outline" size={48} color="#EA5178" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Zkusit znovu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        {/* Sticky Header */}
        <View style={styles.stickyHeader}>
          <Header title="INTERPRETI" />
        </View>

        {/* Scrollable Content */}
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
          refreshControl={undefined}
          onScroll={handleNotificationScroll}
          scrollEventThrottle={400}
          // Performance optimizations for smooth 60fps scrolling
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
          // Note: getItemLayout not supported with numColumns > 1
          // Items are arranged in rows, so layout calculation is complex
        />
        <Toast
          visible={toastVisible}
          message={toastMessage}
          onDismiss={() => setToastVisible(false)}
          duration={2000}
        />
      </View>
      <NotificationPermissionModal
        visible={showPrompt}
        onAllowNotifications={handleAccept}
        onDismiss={handleDismiss}
      />
      <NotificationPermissionModal
        visible={showFavoritePermissionModal}
        onAllowNotifications={handleFavoritePermissionAccept}
        onDismiss={handleFavoritePermissionDismiss}
      />
      <EventSelectionModal
        visible={eventModalVisible}
        artistName={selectedArtistForModal?.name || ''}
        events={selectedArtistEvents}
        favoriteEventIds={favoriteEvents}
        onToggleEvent={handleEventToggle}
        onDismiss={handleEventModalDismiss}
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
    fontWeight: 'bold',
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
    fontWeight: '500',
    textTransform: 'uppercase',
    fontSize: 14,
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
    marginBottom: 0,
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
    fontWeight: '700',
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
