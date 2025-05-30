import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  ScrollView, ActivityIndicator
} from 'react-native';
import { Image } from 'react-native';
import {
  saveToCache,
  loadFromCache,
  getLastUpdate,
  setLastUpdate
} from '../utils/cache';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import { useRemoteConfig } from '../context/RemoteConfigProvider';

export default function InterpretiScreen() {
  const [interpreti, setInterpreti] = useState([]);
  const [categories, setCategories] = useState([{ label: 'Všichni', value: 'all' }]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { config } = useRemoteConfig();

  useEffect(() => {
    const fetchInterpretiIfNeeded = async () => {
      try {
        const latestArtistsUpdate = config?.last_updates?.artists;
        console.log('🌐 Last artists update from config:', latestArtistsUpdate);

        const lastFetched = await getLastUpdate('artists');
        console.log('📱 Last local artists update:', lastFetched);

        const shouldFetch = !lastFetched || new Date(latestArtistsUpdate) > new Date(lastFetched);

        if (shouldFetch) {
          console.log('📥 Fetching updated artists data...');
          const response = await fetch('https://www.fmcityfest.cz/api/mobile-app/artists.php');
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Server responded with an error:', errorText);
            throw new Error('Failed to fetch artists data');
          }
          const data = await response.json();

          setInterpreti(data.records);
          await saveToCache('cachedArtists', data.records);
          await setLastUpdate('artists', latestArtistsUpdate);
          console.log('💾 Artists cache saved.');

          if (data.categories) {
            const newCats = data.categories.map(cat => ({
              label: cat.name,
              value: cat.tag,
            }));
            setCategories([{ label: 'Všichni', value: 'all' }, ...newCats]);
            await saveToCache('cachedArtistCategories', newCats);
            console.log('💾 Categories cache saved.');
          }
        } else {
          console.log('✅ Using cached artists data');

          const cachedArtists = await loadFromCache('cachedArtists');
          const cachedCategories = await loadFromCache('cachedArtistCategories');

          console.log('📦 Cached artists:', cachedArtists ? 'Found' : 'NOT found');
          console.log('📦 Cached categories:', cachedCategories ? 'Found' : 'NOT found');

          if (cachedArtists) setInterpreti(cachedArtists);
          if (cachedCategories) setCategories([{ label: 'Všichni', value: 'all' }, ...cachedCategories]);
        }
      } catch (error) {
        console.error('❌ Error fetching artists:', error);
      } finally {
        setLoading(false);
      }
    };

    if (config?.last_updates?.artists) {
      fetchInterpretiIfNeeded();
    }
  }, [config]);

  const filteredInterpreti = selectedCategory === 'all'
    ? interpreti
    : interpreti.filter(item => item.fields.category_tag === selectedCategory);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ArtistDetail', { id: item.id })}
    >
      <Image
        source={{ uri: item.fields.photo?.url }}
        style={styles.image}
        resizeMode="cover"        // místo contentFit
        //defaultSource={require('../assets/placeholder.png')} // (volitelné) placeholder
      />
      <View style={styles.overlay}>
        <Text style={styles.name}>{item.fields.name}</Text>
      </View>
    </TouchableOpacity>
  );


  const renderHeader = () => (
    <>
      <Header title="INTERPRETI" />
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.filterButton,
                selectedCategory === cat.value && styles.activeFilter,
              ]}
              onPress={() => setSelectedCategory(cat.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === cat.value && styles.activeFilterText,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EA5178" />
      </View>
    );
  }

  return (
    <View style={styles.background}>
      <FlatList
        data={
          filteredInterpreti.length % 2 === 1
            ? [...filteredInterpreti, { id: 'spacer' }]
            : filteredInterpreti
        }
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) =>
          item.id === 'spacer' ? (
            <View style={[styles.card, { backgroundColor: 'transparent' }]} />
          ) : (
            renderItem({ item })
          )
        }
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#002239',
  },
  container: {
    paddingHorizontal: 20,
  },
  filters: {
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    borderColor: 'white',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 0,
    marginHorizontal: 5,
    marginBottom: 10,
  },
  filterText: {
    color: 'white',
    fontWeight: '500',
    textTransform: 'uppercase',
    fontSize: 14,
  },
  activeFilter: {
    backgroundColor: '#EA5178',
    borderColor: '#EA5178',
  },
  activeFilterText: {
    color: 'white',
  },
  list: {
    paddingBottom: 30,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#002239',
  },
});
