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
import { useTheme } from '../theme/ThemeProvider';
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
  const { toggleArtist, toggleEvent, isArtistFavorite, favoriteEvents, favoriteArtists } = useFavorites();
  const { timelineData } = useTimeline();
  const previousTabRef = useRef<string | null>(null);

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
      let isFavorite = favoriteArtists.includes(artistId);

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

  const handleFavoritePress = useCallback(
    async (artistId: string) => {
      const artist = artists.find((a) => a.id === artistId);
      if (!artist) return;

      const artistEvents = artistEventsMap.get(artistId) || [];

      if (artistEvents.length > 1) {
        setSelectedArtistForModal(artist);
        setSelectedArtistEvents(artistEvents);
        setEventModalVisible(true);
        return;
      }

      const wasFavorite = isArtistFavorite(artistId);
      toggleArtist(artistId);

      if (!wasFavorite) {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'granted') {
          setToastMessage('❤️ Přidáno do Můj program! 🔔');
          setToastVisible(true);
        } else {
          setShowFavoritePermissionModal(true);
        }
      } else {
        setToastMessage('💔 Odebráno z Můj program.');
        setToastVisible(true);
      }
    },
    [artists, isArtistFavorite, toggleArtist, artistEventsMap]
  );

  const handleEventToggle = useCallback(
    (eventId: string) => {
      toggleEvent(eventId);
    },
    [toggleEvent]
  );

  const handleEventModalDismiss = useCallback(() => {
    setEventModalVisible(false);
    setSelectedArtistForModal(null);
    setSelectedArtistEvents([]);
  }, []);

  const handleFavoritePermissionAccept = useCallback(async () => {
    setShowFavoritePermissionModal(false);
    const granted = await notificationService.requestPermissions();

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

  const renderArtistCard = useCallback(
    ({ item }: { item: Artist & { id?: string } }) => {
      if (item.id === 'spacer') {
        return <View style={[styles.card, { backgroundColor: 'transparent' }]} />;
      }

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
            <Text style={[globalStyles.heading, styles.name]} numberOfLines={2}>
              {item.name}
            </Text>
          </View>
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
    [artistFavoriteStatusMap, handleArtistPress, handleFavoritePress, globalStyles.heading]
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
              onPress={() => setSelectedCategory(category === 'Všichni' ? null : category)}
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