// screens/ArtistDetailScreen.js
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  StyleSheet,
  Alert,
  Dimensions,
  StatusBar
} from 'react-native';
import Header from '../components/Header'; 
import Ionicons from 'react-native-vector-icons/Ionicons';
import { loadFromCache, saveToCache } from '../utils/cache';
import { getAllArtistsIncludingHidden } from '../utils/dataLoader';
import { 
  scheduleNotificationForArtist, 
  cancelNotificationForArtist,
  areNotificationsEnabled,
  toggleNotifications
} from '../utils/notificationHelper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRemoteConfig } from '../context/RemoteConfigProvider';

const { width } = Dimensions.get('window');

export default function ArtistDetailScreen() {
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [isFavorite, setIsFavorite] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { config } = useRemoteConfig();

  useEffect(() => {
    const loadArtist = async () => {
      try {
        console.log('🔄 Načítám data pro interpreta:', route.params);
        const artists = await getAllArtistsIncludingHidden();
        const artistId = route.params?.artist?.id || route.params?.id;
        
        if (!artistId) {
          console.warn('⚠️ Chybí ID interpreta v parametrech');
          Alert.alert(
            'Chyba',
            'Chybí ID interpreta',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }

        const foundArtist = artists.find(a => a.id === artistId);
        if (foundArtist) {
          console.log('✅ Nalezený interpret:', foundArtist.fields?.name);
          setArtist(foundArtist);
          await checkFavoriteStatus(foundArtist.id);
          await checkNotificationsStatus();
        } else {
          console.warn('⚠️ Interpret nebyl nalezen pro ID:', artistId);
          Alert.alert(
            'Chyba',
            'Interpret nebyl nalezen',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } catch (error) {
        console.error('❌ Chyba při načítání detailu interpreta:', error);
        Alert.alert(
          'Chyba',
          'Nepodařilo se načíst data interpreta',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } finally {
        setLoading(false);
      }
    };

    loadArtist();
  }, [route.params, navigation]);

  // Kontrola stavu notifikací
  const checkNotificationsStatus = async () => {
    try {
      const enabled = await areNotificationsEnabled();
      setNotificationsEnabled(enabled);
    } catch (error) {
      console.error('❌ Chyba při kontrole stavu notifikací:', error);
    }
  };

  // Kontrola, zda je interpret v oblíbených
  const checkFavoriteStatus = async (artistId) => {
    try {
      console.log('🔍 Kontroluji oblíbené pro ID:', artistId);
      const favorites = await loadFromCache('myArtists') || [];
      console.log('📋 Načtené oblíbené:', favorites);
      const isFav = favorites.includes(artistId);
      console.log('❤️ Je v oblíbených:', isFav);
      setIsFavorite(isFav);
    } catch (error) {
      console.error('❌ Error checking favorite status:', error);
    }
  };

  // Přidání/odebrání z oblíbených
  const toggleFavorite = async () => {
    try {
      const favorites = await loadFromCache('myArtists') || [];
      let updatedFavorites;

      if (isFavorite) {
        // Odebrání z oblíbených
        updatedFavorites = favorites.filter(favId => favId !== artist.id);
        await cancelNotificationForArtist(artist.id);
      } else {
        // Přidání do oblíbených
        updatedFavorites = [...favorites, artist.id];
        if (notificationsEnabled) {
          await scheduleNotificationForArtist(artist.id);
        }
      }

      await saveToCache('myArtists', updatedFavorites);
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
      Alert.alert('Chyba', 'Nepodařilo se aktualizovat oblíbené');
    }
  };

  // Přepnutí notifikací
  const handleToggleNotifications = async () => {
    try {
      const newState = !notificationsEnabled;
      await toggleNotifications(newState);
      setNotificationsEnabled(newState);

      if (newState && isFavorite) {
        // Pokud jsou notifikace povoleny a interpret je v oblíbených,
        // naplánujeme notifikaci
        await scheduleNotificationForArtist(artist.id);
      } else if (!newState && isFavorite) {
        // Pokud jsou notifikace zakázány a interpret je v oblíbených,
        // zrušíme notifikaci
        await cancelNotificationForArtist(artist.id);
      }
    } catch (error) {
      console.error('❌ Error toggling notifications:', error);
      Alert.alert('Chyba', 'Nepodařilo se aktualizovat nastavení notifikací');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  if (!artist) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <Text style={styles.errorText}>Interpret nebyl nalezen</Text>
      </View>
    );
  }

  const photoUrl = artist.fields?.photo?.url || '';
  const imageUrl = photoUrl.includes('thumb/') && !photoUrl.endsWith('/')
    ? photoUrl
    : 'https://www.fmcityfest.cz/media/performers/thumb/placeholder.webp';

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <Header 
          title={artist?.fields?.name || 'Detail interpreta'} 
          showBackButton 
          onBackPress={() => navigation.goBack()}
        />
        
        <ScrollView style={styles.scrollView}>
          <Image
            source={imageError ? require('../assets/icon.png') : { uri: imageUrl }}
            style={styles.artistImage}
            resizeMode="cover"
            onError={() => {
              console.log('❌ Chyba načítání fotky, používám fallback');
              setImageError(true);
            }}
          />

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, isFavorite && styles.activeButton]}
              onPress={toggleFavorite}
            >
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorite ? "#EA5178" : "white"} 
              />
              <Text style={styles.actionButtonText}>
                {isFavorite ? 'Odebrat z mého programu' : 'Přidat do mého programu'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            {artist?.fields?.description && (
              <Text style={styles.description}>{artist.fields.description}</Text>
            )}

            {artist?.fields?.category_name && (
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryLabel}>Kategorie:</Text>
                <Text style={styles.categoryText}>{artist.fields.category_name}</Text>
              </View>
            )}

            {artist?.fields?.stage && (
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryLabel}>Pódium:</Text>
                <Text style={styles.categoryText}>{artist.fields.stage}</Text>
              </View>
            )}

            {artist?.fields?.time_from && (
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryLabel}>Začátek:</Text>
                <Text style={styles.categoryText}>{artist.fields.time_from}</Text>
              </View>
            )}
          </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#002239',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
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
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  artistImage: {
    width: width,
    height: width,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#0A3652',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
  activeButton: {
    backgroundColor: 'rgba(234, 81, 120, 0.1)',
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
  },
  infoContainer: {
    padding: 20,
  },
  description: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  categoryLabel: {
    color: '#EA5178',
    fontSize: 16,
    marginRight: 8,
  },
  categoryText: {
    color: 'white',
    fontSize: 16,
  },
});
