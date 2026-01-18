import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import dayjs from 'dayjs';
import 'dayjs/locale/cs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';
import { RootStackParamList } from '../navigation/linking';
import { useArtists } from '../hooks/useArtists';
import { useFavorites } from '../hooks/useFavorites';
import { notificationService } from '../services';
import { loadFromCache } from '../utils/cacheManager';
import { TimelineApiResponse } from '../api/endpoints';
import NotificationPermissionModal from '../components/NotificationPermissionModal';
import Toast from '../components/Toast';
import Header from '../components/Header';

dayjs.locale('cs');
dayjs.extend(localizedFormat);
dayjs.extend(utc);

type ArtistDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ArtistDetail'>;

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

export default function ArtistDetailScreen() {
  const route = useRoute<ArtistDetailScreenProps['route']>();
  const navigation = useNavigation<ArtistDetailScreenProps['navigation']>();
  const isFocused = useIsFocused();
  const { artistId } = route.params;
  const { artists, loading, error, refetch } = useArtists();
  const { toggleArtist, toggleEvent, isArtistFavorite, isEventFavorite, favoriteArtists, favoriteEvents } = useFavorites();

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState<boolean | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineApiResponse | null>(null);

  const artist = React.useMemo(() => {
    return artists.find((a) => a.id === artistId);
  }, [artists, artistId]);

  const isFavorite = favoriteArtists.includes(artistId);

  // Načti timeline data pro získání informací o koncertech
  useEffect(() => {
    const loadTimeline = async () => {
      const data = await loadFromCache<TimelineApiResponse>('timeline');
      setTimelineData(data);
    };
    loadTimeline();
  }, []);

  // Najdi eventy pro tohoto interpreta
  const artistEvents = useMemo(() => {
    if (!timelineData || !artist) return [];
    
    const numericArtistId = parseInt(artistId, 10);
    return (timelineData.events as TimelineEvent[])
      .filter((event) => event.interpret_id === numericArtistId && event.start && event.id)
      .sort((a, b) => {
        const startA = a.start ? new Date(a.start).getTime() : 0;
        const startB = b.start ? new Date(b.start).getTime() : 0;
        return startA - startB;
      });
  }, [timelineData, artistId, artist]);

  // Zjisti, zda má interpret více koncertů
  const hasMultipleConcerts = artistEvents.length > 1;

  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationPermissionGranted(status === 'granted');
    };
    checkPermission();
  }, []);

  const handleFavoritePress = async () => {
    const wasFavorite = isFavorite;
    toggleArtist(artistId);

    if (!wasFavorite) {
      // Added to favorites
      const { status } = await Notifications.getPermissionsAsync();
      const artistName = artist?.name || 'Interpret';
      const isFemale = artistName.endsWith('a') || artistName.endsWith('á');
      const genderSuffix = isFemale ? 'a' : '';

      if (status === 'granted') {
        setToastMessage(`❤️ ${artistName} přidán${genderSuffix}! 🔔 Dostaneš upozornění 10 min před.`);
      } else {
        setToastMessage(`❤️ ${artistName} přidán${genderSuffix}! 🔕 Notifikace nejsou povolené.`);
      }
      setToastVisible(true);
    } else {
      // Removed from favorites
      const artistName = artist?.name || 'Interpret';
      const isFemale = artistName.endsWith('a') || artistName.endsWith('á');
      const genderSuffix = isFemale ? 'a' : '';
      setToastMessage(`🤍 ${artistName} odebrán${genderSuffix} z Můj program.`);
      setToastVisible(true);
    }
  };

  const handleEnableNotifications = async () => {
    setShowPermissionModal(true);
  };

  const handleModalAccept = async () => {
    setShowPermissionModal(false);
    const granted = await notificationService.requestPermissions();
    if (granted) {
      await notificationService.getToken();
    }
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationPermissionGranted(status === 'granted');
  };

  const handleModalDismiss = () => {
    setShowPermissionModal(false);
  };

  if (loading && !artist) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <ActivityIndicator size="large" color="#21AAB0" />
        <Text style={styles.loadingText}>Načítání detailu interpreta...</Text>
      </View>
    );
  }

  if (error || !artist) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <Header title="INTERPRETI" />
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={48} color="#EA5178" />
          <Text style={styles.errorText}>{error || 'Interpret nebyl nalezen'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Zkusit znovu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const showNotificationButton =
    toastVisible &&
    isFavorite &&
    notificationPermissionGranted === false &&
    toastMessage.includes('Notifikace nejsou povolené');

  // Hide screen content when not focused to prevent flicker during tab navigation
  if (!isFocused) {
    return null;
  }

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        <ScrollView 
          bounces={false} 
          overScrollMode="never" 
          refreshControl={undefined}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            {artist.image && (
              <Image source={{ uri: artist.image }} style={styles.artistImage} resizeMode="cover" />
            )}

            <View style={styles.headerSection}>
              <View style={styles.nameRow}>
                <Text style={styles.artistName}>{artist.name}</Text>
                {/* Srdíčko pouze pro interprety s jedním koncertem */}
                {!hasMultipleConcerts && (
                  <TouchableOpacity
                    onPress={handleFavoritePress}
                    activeOpacity={0.7}
                    style={styles.favoriteIconButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={isFavorite ? 'heart' : 'heart-outline'}
                      size={28}
                      color={isFavorite ? '#EA5178' : '#999'}
                    />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.headerBorder} />
            </View>

            {/* Zobraz eventy pokud existují */}
            {artistEvents.length > 0 && (
              <View style={styles.eventsSection}>
                {artistEvents.map((event, index) => {
                  const startDate = event.start ? dayjs(event.start) : null;
                  const endDate = event.end ? dayjs(event.end) : null;
                  const eventId = event.id || '';
                  const isEventFav = eventId ? favoriteEvents.includes(eventId) : false;
                  
                  return (
                    <View key={event.id || index} style={styles.eventCard}>
                      {/* Pro více koncertů: zobraz název na celé šířce nahoře */}
                      {hasMultipleConcerts && event.name && (
                        <View style={styles.eventNameHeader}>
                          <Text style={styles.eventNameText}>{event.name}</Text>
                          {eventId && (
                            <TouchableOpacity
                              onPress={() => {
                                toggleEvent(eventId);
                                const eventName = event.name || artist?.name || 'Koncert';
                                const isFemale = eventName.endsWith('a') || eventName.endsWith('á');
                                const genderSuffix = isFemale ? 'a' : '';
                                if (isEventFav) {
                                  setToastMessage(`🤍 ${eventName} odebrán${genderSuffix} z Můj program.`);
                                } else {
                                  setToastMessage(`❤️ ${eventName} přidán${genderSuffix}!`);
                                }
                                setToastVisible(true);
                              }}
                              style={styles.eventFavoriteButtonHeader}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              <Ionicons
                                name={isEventFav ? 'heart' : 'heart-outline'}
                                size={22}
                                color={isEventFav ? '#EA5178' : '#999'}
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                      <View style={styles.eventRow}>
                        <View style={styles.eventColumn}>
                          <Text style={styles.eventLabel}>STAGE</Text>
                          <Text style={styles.eventValue}>
                            {event.stage_name || event.stage || 'Neznámé pódium'}
                          </Text>
                        </View>
                        <View style={styles.eventDivider} />
                        <View style={styles.eventColumn}>
                          <Text style={styles.eventLabel}>ČAS</Text>
                          <Text style={styles.eventValue}>
                            {startDate
                              ? `${startDate.format('dd')} ${startDate.format('HH:mm')}${
                                  endDate ? ` - ${endDate.format('HH:mm')}` : ''
                                }`
                              : 'Neznámý čas'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}


            {artist.bio ? (
              <View style={styles.bioContainer}>
                <Text style={styles.bioText}>{artist.bio.replace(/<[^>]*>/g, ' ').trim()}</Text>
              </View>
            ) : (
              <View style={styles.noBioContainer}>
                <Text style={styles.noBioText}>Žádný popis není k dispozici</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <Toast
          visible={toastVisible}
          message={toastMessage}
          onDismiss={() => setToastVisible(false)}
          duration={notificationPermissionGranted === false && toastMessage.includes('Notifikace') ? 4000 : 2500}
          actionButton={
            showNotificationButton
              ? {
                  label: 'Povolit notifikace',
                  onPress: handleEnableNotifications,
                }
              : undefined
          }
        />

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="white" style={styles.backIcon} />
          <Text style={styles.backButtonText}>Zpět</Text>
        </TouchableOpacity>
      </View>
      <NotificationPermissionModal
        visible={showPermissionModal}
        onAllowNotifications={handleModalAccept}
        onDismiss={handleModalDismiss}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002239',
  },
  scrollContent: {
    paddingBottom: 50, // Space for back button
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
    backgroundColor: '#002239',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 30,
  },
  artistImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 0,
    backgroundColor: '#0A3652',
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  artistName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'left',
    flex: 1,
    marginRight: 12,
  },
  favoriteIconButton: {
    padding: 4,
  },
  headerBorder: {
    height: 1,
    backgroundColor: '#1a3a5a',
    width: '100%',
  },
  eventsSection: {
    paddingHorizontal: 20,
    marginBottom: 0,
  },
  eventCard: {
    backgroundColor: '#0A3652',
    marginBottom: 12,
    borderRadius: 0,
    overflow: 'hidden',
  },
  eventNameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5a',
  },
  eventNameText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  eventFavoriteButtonHeader: {
    padding: 4,
  },
  eventRow: {
    flexDirection: 'row',
    minHeight: 80,
  },
  eventColumn: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  eventDivider: {
    width: 1,
    backgroundColor: '#1a3a5a',
  },
  eventLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  eventValue: {
    color: '#EA5178',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  favoriteButton: {
    display: 'none',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A3652',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  favoriteIcon: {
    marginRight: 10,
  },
  favoriteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  bioContainer: {
    marginTop: 8,
    paddingHorizontal: 20,
  },
  bioText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
  },
  noBioContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noBioText: {
    color: '#B0B0B0',
    fontSize: 16,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#EA5178',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  backIcon: {
    marginRight: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});
