import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, ScrollView, ActivityIndicator, StatusBar
} from 'react-native';
import { Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import { useRemoteConfig } from '../context/RemoteConfigProvider';
import { getAllArtists, getArtistCategories } from '../utils/dataLoader';

export default function ArtistsScreen() {
  const [artists, setArtists] = useState([]);
  const [categories, setCategories] = useState([{ label: 'Všichni', value: 'all' }]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const { config } = useRemoteConfig();

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 ArtistsScreen: Začínám načítat data...');
        setLoading(true);
        setError(null);

        // Načtení interpretů
        console.log('📥 ArtistsScreen: Načítám interprety...');
        const artistsData = await getAllArtists(config);
        console.log('📊 ArtistsScreen: Načteno interpretů:', artistsData.length);
        setArtists(artistsData);

        // Načtení kategorií
        console.log('📥 ArtistsScreen: Načítám kategorie...');
        const categoriesData = await getArtistCategories();
        console.log('📊 ArtistsScreen: Načteno kategorií:', categoriesData.length);
        setCategories([{ label: 'Všichni', value: 'all' }, ...categoriesData]);

        console.log('✅ ArtistsScreen: Data byla úspěšně načtena');
      } catch (err) {
        console.error('❌ ArtistsScreen: Chyba při načítání dat:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (config?.last_updates?.artists) {
      loadData();
    } else {
      console.warn('⚠️ config.last_updates.artists není dostupný, načítání se neprovádí.');
    }
  }, [config]);

  const filteredArtists = Array.isArray(artists)
    ? selectedCategory === 'all'
      ? artists
      : artists.filter(item => item?.fields?.category_tag === selectedCategory)
    : [];

  const renderItem = ({ item }) => {
    if (!item || !item.fields) {
      console.warn('⚠️ Invalid artist item:', item);
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ArtistDetail', { artist: item })}
      >
        <Image
          source={{ uri: item.fields.photo?.url }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.overlay}>
          <Text style={styles.name}>{item.fields.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <>
      <Header title="INTERPRETI" />
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {categories.map((cat, index) => (
            <TouchableOpacity
              key={`${cat.value}-${index}`}
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
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.background}>
        <FlatList
          data={
            filteredArtists.length % 2 === 1
              ? [...filteredArtists, { id: 'spacer' }]
              : filteredArtists
          }
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) =>
            item?.id === 'spacer' ? (
              <View style={[styles.card, { backgroundColor: 'transparent' }]} />
            ) : (
              renderItem({ item })
            )
          }
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.list}
        />
      </View>
    </>
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
