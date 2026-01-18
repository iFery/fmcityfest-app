import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Event } from '../types';

interface EventCardProps {
  event: Event;
  onPress: () => void;
  showFavoriteButton?: boolean;
  isFavorite?: boolean;
  onFavoritePress?: () => void;
}

function EventCard({ event, onPress, showFavoriteButton = false, isFavorite = false, onFavoritePress }: EventCardProps) {
  const handleFavoritePress = useCallback(
    (e: any) => {
      e.stopPropagation();
      onFavoritePress?.();
    },
    [onFavoritePress]
  );

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={20} color="#007AFF" />
          <Text style={styles.time}>{event.time}</Text>
        </View>
        <Text style={styles.name}>{event.name}</Text>
        <Text style={styles.artist}>{event.artist}</Text>
      </View>
      <View style={styles.rightSection}>
        {showFavoriteButton && onFavoritePress && (
          <TouchableOpacity
            onPress={handleFavoritePress}
            style={styles.favoriteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? '#EA5178' : '#999'}
            />
          </TouchableOpacity>
        )}
        <Ionicons name="chevron-forward" size={24} color="#999" />
      </View>
    </TouchableOpacity>
  );
}

export default memo(EventCard);

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
  content: {
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  artist: {
    fontSize: 14,
    color: '#666',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    padding: 4,
  },
});
