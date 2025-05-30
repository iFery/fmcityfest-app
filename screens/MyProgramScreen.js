import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Image } from 'react-native';
import Header from '../components/Header';
import { loadFromCache, removeFromCache } from '../utils/cache';

export default function MyProgramScreen() {
  const [events, setEvents] = useState([]);
  const [artistIds, setArtistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const cachedEventsRef = useRef(null);
  const cachedArtistsRef = useRef(null);

  console.log('🔄 MyProgramScreen re-render');

  useEffect(() => {
    const loadData = async () => {
      console.log('📥 Načítám MyProgramScreen');
      try {
        const favorites = (await loadFromCache('myArtists')) || [];
        console.log('✅ Načtení myArtists:', favorites);

        const cachedProgram = await loadFromCache('cachedProgramData');
        console.log('✅ Načtení cachedProgramData:', Array.isArray(cachedProgram) ? `${cachedProgram.length} položek` : '❌ není pole');

        const numericArtistIds = favorites.map(id => parseInt(id));
        const myEvents = cachedProgram?.filter(e =>
          numericArtistIds.includes(parseInt(e.interpret_id))
        ) || [];

        console.log('🎤 Vyfiltrované eventy:', myEvents.length);
        console.log('📦 První event:', myEvents[0]);

        setArtistIds(favorites);
        setEvents(myEvents);

        cachedEventsRef.current = myEvents;
        cachedArtistsRef.current = favorites;
      } catch (error) {
        console.error('❌ Error loading favorites or events:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  useEffect(() => {
    console.log('🟢 MyProgramScreen mounted');
    return () => {
      console.log('🔴 MyProgramScreen unmounted');
    };
  }, []);

  const clearFavorites = async () => {
    try {
      await removeFromCache('myArtists');
      console.log('🧹 Cache myArtists cleared');
      alert('Uložené interprety jsem smazal.');
      setArtistIds([]);
      setEvents([]);
    } catch (error) {
      console.error('❌ Error clearing favorites:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EA5178" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.background}>
      <Header title="Můj program" />

      <View style={styles.content}>
        {Array.isArray(events) ? (
          events.length === 0 ? (
            <Text style={styles.noFavorites}>Nemáš zatím uložené žádné interprety.</Text>
          ) : (
            events
              .slice()
              .sort((a, b) => new Date(a.start) - new Date(b.start))
              .map((item) => {
                const [datePart, timePart] = item.start.split('T');
                const endTime = item.end.split('T')[1];

                const uri = item.photo_artist?.url;

                const startDateTime = new Date(item.start);
                let dayLabel = '';
                if (startDateTime.getDay() === 5) {
                  dayLabel = 'Pátek';
                } else if (startDateTime.getDay() === 6) {
                  dayLabel = 'Sobota';
                } else if (startDateTime.getDay() === 0) {
                  dayLabel = 'Neděle';
                }

                return (
                  <TouchableOpacity
                    key={item.interpret_id}
                    style={styles.eventCard}
                    onPress={() => navigation.navigate('ArtistDetail', { id: parseInt(item.interpret_id) })}
                  >
                    <View style={styles.eventRow}>

                    {uri ? (
                      <Image
                        source={{ uri }}
                        style={styles.artistPhoto}
                        resizeMode="cover"           // místo contentFit
                      />
                    ) : (
                      <View style={[styles.artistPhoto, styles.placeholder]} />
                    )}


                      <View style={styles.eventInfo}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.stage}>{item.stage_name}</Text>
                        <Text style={styles.time}>
                          {dayLabel} {timePart} - {endTime}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
          )
        ) : (
          <Text style={{ color: 'red', textAlign: 'center', marginVertical: 20 }}>
            ❗ Nepodařilo se načíst program. Pravděpodobně chyba v datech.
          </Text>
        )}

        <TouchableOpacity onPress={clearFavorites} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Vymazat oblíbené interprety</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#002239',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  eventCard: {
    backgroundColor: '#0A3652',
    padding: 15,
    marginBottom: 15,
  },
  name: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 5,
  },
  stage: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },
  time: {
    color: '#EA5178',
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    marginTop: 20,
    backgroundColor: '#FF3B30',
    padding: 12,
  },
  clearButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  noFavorites: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#002239',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  eventText: {
    flex: 1,
  },
  artistPhoto: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  placeholder: {
    backgroundColor: '#ccc',     // nebo jakákoliv barva záložky
  },
});
