import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Artist } from '../types';

interface ArtistCardProps {
  artist: Artist;
  onPress: () => void;
  showFavoriteButton?: boolean;
  isFavorite?: boolean;
  onFavoritePress?: () => void;
}

function ArtistCard({ artist, onPress, showFavoriteButton = false, isFavorite = false, onFavoritePress }: ArtistCardProps) {
  const handleFavoritePress = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onFavoritePress?.();
    },
    [onFavoritePress]
  );

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {artist.image ? (
          <Image source={{ uri: artist.image }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="musical-notes" size={32} color="#999" />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{artist.name}</Text>
        <Text style={styles.genre}>{artist.genre}</Text>
      </View>
      {showFavoriteButton && onFavoritePress ? (
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavoritePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? '#EA5178' : '#999'}
          />
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-forward" size={24} color="#999" />
      )}
    </TouchableOpacity>
  );
}

export default memo(ArtistCard);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: '#e0e0e0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  genre: {
    fontSize: 14,
    color: '#666',
  },
  favoriteButton: {
    padding: 4,
  },
});
