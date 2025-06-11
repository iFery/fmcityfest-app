import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
  Linking,
  StatusBar,
} from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import { loadFromCache } from '../utils/cache';
import Ionicons from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/cs';
import { loadFestivalData } from '../utils/dataLoader';
import {
  toggleNotifications as toggleNotificationsHelper,
  areNotificationsEnabled,
  requestNotificationPermissions,
  debugScheduledNotifications,
  scheduleNotificationsForAllFavorites
} from '../utils/notificationHelper';

dayjs.extend(relativeTime);
dayjs.locale('cs');

export default function MyProgramScreen() {
  const [events, setEvents] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  const isFocused = useIsFocused();
  const navigation = useNavigation();

  useEffect(() => {
    const checkNotifications = async () => {
      const enabled = await areNotificationsEnabled();
      setNotificationsEnabled(enabled);
    };
    checkNotifications();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        setLoading(true);
        console.log('🔄 Načítám data pro Můj program...');

        const favorites = await loadFromCache('myArtists');
        console.log('📋 Oblíbení interpreti:', favorites);

        if (!favorites || !Array.isArray(favorites) || favorites.length === 0) {
          console.log('ℹ️ Žádní oblíbení interpreti');
          setEvents([]);
          setArtists([]);
          return;
        }

        console.log('📥 Načítám festivalová data...');
        const festivalData = await loadFestivalData();
        
        if (!festivalData || !festivalData.program || !festivalData.artists) {
          throw new Error('Nepodařilo se načíst festivalová data. Zkuste obnovit data v nastavení.');
        }

        const { program, artists: artistsData } = festivalData;
        console.log('✅ Festivalová data načtena:', {
          hasProgram: !!program,
          hasArtists: !!artistsData,
          programEventsCount: program.events?.length || 0,
          artistsCount: artistsData.length
        });

        const numericArtistIds = favorites.map(id => parseInt(id));
        console.log('🔢 ID oblíbených interpretů:', numericArtistIds);

        const myEvents = program.events.filter(e => 
          numericArtistIds.includes(parseInt(e.interpret_id))
        );
        console.log('🎯 Nalezené eventy:', myEvents.length);

        setEvents(myEvents);
        setArtists(artistsData);
      } catch (error) {
        console.error('❌ Error loading data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const getArtistName = (artistId) => {
    const found = artists.find((a) => String(a.id) === String(artistId));
    return found?.fields?.name || found?.name || `Neznámý interpret (${artistId})`;
  };

  const handleToggleNotifications = async () => {
    try {
      if (!notificationsEnabled) {
        // Pokud chceme zapnout notifikace, nejdřív zkontrolujeme oprávnění
        const hasPermission = await requestNotificationPermissions();
        
        if (!hasPermission) {
          Alert.alert(
            'Povolení notifikací',
            'Pro zapnutí notifikací je potřeba povolit oprávnění v nastavení zařízení.',
            [
              {
                text: 'Zrušit',
                style: 'cancel'
              },
              {
                text: 'Otevřít nastavení',
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                }
              }
            ]
          );
          return;
        }
      }

      // Pokud máme oprávnění nebo vypínáme notifikace, provedeme změnu
      const newState = await toggleNotificationsHelper();
      setNotificationsEnabled(newState);

      if (newState) {
        await scheduleNotificationsForAllFavorites();
      }

    } catch (error) {
      console.error('❌ Error toggling notifications:', error);
      Alert.alert(
        'Chyba',
        'Nepodařilo se změnit nastavení notifikací. Zkuste to prosím znovu.'
      );
    }
  };

  const handleImageError = (artistId) => {
    console.log('❌ Chyba načítání fotky, používám fallback pro:', artistId);
    setImageErrors(prev => ({
      ...prev,
      [artistId]: true
    }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EA5178" />
        <Text style={{ color: 'white', marginTop: 20 }}>Načítám program...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'white', textAlign: 'center', padding: 20 }}>{error}</Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#21AAB0',
            padding: 15,
            marginTop: 20,
          }}
          onPress={() => {
            setLoading(true);
            setError(null);
            loadData();
          }}
        >
          <Text style={{ color: 'white' }}>Zkusit znovu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ScrollView style={styles.background}>
        <Header title="Můj program" />

        <View style={styles.content}>
          {events.length === 0 ? (
            <Text style={styles.noFavorites}>
              Nemáš zatím uložené žádné interprety.
            </Text>
          ) : (
            <>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={handleToggleNotifications}
              >
                <Ionicons
                  name={notificationsEnabled ? 'notifications' : 'notifications-off-outline'}
                  size={24}
                  color="#EA5178"
                />
                <Text style={styles.notificationButtonText}>
                  {notificationsEnabled ? 'Vypnout notifikace' : 'Zapnout notifikace'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.notificationButton, { backgroundColor: '#224259' }]}
                onPress={debugScheduledNotifications}
              >
                <Ionicons name="bug-outline" size={24} color="#21AAB0" />
                <Text style={styles.notificationButtonText}>Debug: zobrazit naplánované notifikace</Text>
              </TouchableOpacity>
              {events
                .slice()
                .sort((a, b) => new Date(a.start) - new Date(b.start))
                .map((item) => {
                  const [datePart, timePart] = item.start.split('T');
                  const endTime = item.end.split('T')[1];
                  
                  const artist = artists.find(a => String(a.id) === String(item.interpret_id));
                  const uri = artist?.fields?.photo?.url;

                  const startDateTime = new Date(item.start);
                  const dayMap = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
                  const dayLabel = dayMap[startDateTime.getDay()];

                  return (
                    <TouchableOpacity
                      key={item.interpret_id}
                      style={styles.eventCard}
                      onPress={() =>
                        navigation.navigate('ArtistDetail', {
                          id: parseInt(item.interpret_id),
                        })
                      }
                    >
                      <View style={styles.eventRow}>
                        {uri && !imageErrors[item.interpret_id] ? (
                          <Image 
                            source={{ uri }} 
                            style={styles.artistPhoto} 
                            resizeMode="cover"
                            onError={() => handleImageError(item.interpret_id)}
                          />
                        ) : (
                          <Image 
                            source={require('../assets/icon.png')}
                            style={styles.artistPhoto}
                            resizeMode="cover"
                          />
                        )}

                        <View style={styles.eventInfo}>
                          <Text style={styles.name}>
                            {getArtistName(item.interpret_id).length > 100
                              ? getArtistName(item.interpret_id).substring(0, 100) + '...'
                              : getArtistName(item.interpret_id)}
                          </Text>
                          <Text style={styles.stage}>{item.stage_name}</Text>
                          <Text style={styles.time}>
                            {dayLabel} {timePart} - {endTime}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#002239' },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 },
  eventCard: { backgroundColor: '#0A3652', padding: 15, marginBottom: 15 },
  name: { color: 'white', fontWeight: '700', fontSize: 18, marginBottom: 5 },
  stage: { color: 'white', fontSize: 14, marginBottom: 5 },
  time: { color: '#EA5178', fontSize: 14, fontWeight: '600' },
  noFavorites: { color: 'white', fontSize: 16, textAlign: 'center', marginVertical: 30 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#002239' },
  eventRow: { flexDirection: 'row', alignItems: 'center' },
  artistPhoto: { width: 60, height: 60, marginRight: 15 },
  placeholder: { backgroundColor: '#ccc' },
  eventInfo: { flex: 1 },
  notificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A3652',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  notificationButtonText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
  },
});
