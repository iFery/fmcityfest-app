import { View, Text, Image, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import Header from '../components/Header'; 
import Ionicons from 'react-native-vector-icons/Ionicons';
import { loadFromCache, saveToCache } from '../utils/cache';

export default function ArtistDetailScreen({ route }) {
  const { id } = route.params;
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        console.log(`🔍 Looking for artist in cache: id = ${id}`);
        const cachedArtists = await loadFromCache('cachedArtists');

        if (cachedArtists && Array.isArray(cachedArtists)) {
          const found = cachedArtists.find(a => parseInt(a.id) === parseInt(id));
          if (found) {
            console.log('✅ Found artist in cache:', found.fields.name); // ✔ správně
            setArtist({ ...found.fields, id: found.id }); // 💡 stejně jako u API
            checkFavorite(found.id);
            return;
          }
        }

        // Fallback na API
        console.log(`🌐 Fetching artist detail from API: id = ${id}`);
        const response = await fetch(`https://www.fmcityfest.cz/api/mobile-app/artist-detail.php?id=${id}`);

        if (!response.ok) {
          console.error('❌ Network response was not OK', response.status);
          setArtist(null);
          return;
        }

        const data = await response.json();
        if (data && data.fields) {
          setArtist({ ...data.fields, id: data.id });
          checkFavorite(data.id);
        } else {
          console.warn('⚠️ API returned no fields');
          setArtist(null);
        }

      } catch (error) {
        console.error('❌ Error loading artist:', error);
        setArtist(null);
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [id]);

  const checkFavorite = async (artistId) => {
    try {
      const favorites = (await loadFromCache('myArtists')) || [];
      setIsFavorite(favorites.includes(artistId));
    } catch (error) {
      console.error('❌ Error checking favorite:', error);
    }
  };

  const toggleFavorite = async (artistId) => {
    try {
      const favorites = (await loadFromCache('myArtists')) || [];
  
      let updatedFavorites;
      if (favorites.includes(artistId)) {
        updatedFavorites = favorites.filter(id => id !== artistId);
        setIsFavorite(false);
      } else {
        updatedFavorites = [...favorites, artistId];
        setIsFavorite(true);
      }
  
      await saveToCache('myArtists', updatedFavorites);
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
    }
  };
  

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2e86de" />
      </View>
    );
  }

  if (!artist) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white' }}>Interpret nenalezen.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#002239' }}>
      <ScrollView style={{ flex: 1 }}>
        <Header title={artist.name} />
  
        <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          <Image
            source={{ uri: artist.photo?.url }}
            style={{ width: '100%', height: 250, marginBottom: 20 }}
            resizeMode="cover"
          />
          <Text style={{ fontSize: 16, lineHeight: 24, color: 'white' }}>
            {artist.description}
          </Text>
        </View>
      </ScrollView>
  
      {/* Floating bookmark button */}
      <TouchableOpacity
        onPress={() => toggleFavorite(artist.id)}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          backgroundColor: '#EA5178',
          borderRadius: 28,
          padding: 14,
          elevation: 5,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowOffset: { width: 0, height: 3 },
          shadowRadius: 4,
        }}
      >
        <Ionicons
          name={isFavorite ? 'bookmark' : 'bookmark-outline'}
          size={28}
          color="#ffffff"
        />
      </TouchableOpacity>
    </View>
  );
  
}
