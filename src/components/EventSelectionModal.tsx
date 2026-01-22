/**
 * Event Selection Modal
 * Modal for selecting specific concerts when an artist has multiple concerts
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from './Toast';
import dayjs from 'dayjs';
import 'dayjs/locale/cs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.locale('cs');
dayjs.extend(localizedFormat);

const { width } = Dimensions.get('window');

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

interface EventSelectionModalProps {
  visible: boolean;
  artistName: string;
  events: TimelineEvent[];
  favoriteEventIds: string[];
  onToggleEvent: (eventId: string, eventName?: string) => void;
  onDismiss: () => void;
  toastVisible?: boolean;
  toastMessage?: string;
  toastDuration?: number;
  toastAction?: {
    label: string;
    onPress: () => void;
  };
  onToastDismiss?: () => void;
}

export default function EventSelectionModal({
  visible,
  artistName,
  events,
  favoriteEventIds,
  onToggleEvent,
  onDismiss,
  toastVisible = false,
  toastMessage = '',
  toastDuration = 2000,
  toastAction,
  onToastDismiss,
}: EventSelectionModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
    }
  }, [visible, fadeAnim, slideAnim]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onDismiss}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        />
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onDismiss}
        />
        
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.modalCard}>
            <View style={styles.header}>
              <Text style={styles.title}>Vyber koncerty</Text>
              <TouchableOpacity
                onPress={onDismiss}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.artistName}>{artistName}</Text>
            
            <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
              {events.map((event) => {
                if (!event.id || !event.start) return null;
                
                const isFavorite = favoriteEventIds.includes(event.id);
                const startDate = dayjs(event.start);
                const endDate = event.end ? dayjs(event.end) : null;
                
                return (
                  <TouchableOpacity
                    key={event.id}
                    style={[styles.eventItem, isFavorite && styles.eventItemFavorite]}
                    onPress={() => onToggleEvent(event.id!, event.name || artistName)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.eventContent}>
                      <View style={styles.eventHeader}>
                        <Text style={styles.eventName} numberOfLines={1}>
                          {event.name || artistName}
                        </Text>
                        <Ionicons
                          name={isFavorite ? 'heart' : 'heart-outline'}
                          size={22}
                          color={isFavorite ? '#EA5178' : '#666'}
                        />
                      </View>
                      
                      <View style={styles.eventDetails}>
                        <View style={styles.eventDetailRow}>
                          <Ionicons name="location" size={16} color="#EA5178" />
                          <Text style={styles.eventDetailText}>
                            {event.stage_name || event.stage || 'Neznámé pódium'}
                          </Text>
                        </View>
                        
                        <View style={styles.eventDetailRow}>
                          <Ionicons name="time" size={16} color="#EA5178" />
                          <Text style={styles.eventDetailText}>
                            {startDate.format('dddd D. MMMM')} • {startDate.format('HH:mm')}
                            {endDate ? ` - ${endDate.format('HH:mm')}` : ''}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Animated.View>
        {onToastDismiss && (
          <Toast
            visible={toastVisible}
            message={toastMessage}
            onDismiss={onToastDismiss}
            duration={toastDuration}
            actionButton={toastAction}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 25, 40, 0.85)',
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 500,
    maxHeight: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#0B2A3A',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(78, 202, 198, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  artistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EA5178',
    marginBottom: 20,
  },
  eventsList: {
    maxHeight: 400,
  },
  eventItem: {
    backgroundColor: '#0A3652',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1a3a5a',
  },
  eventItemFavorite: {
    borderColor: '#EA5178',
    borderWidth: 2,
    backgroundColor: '#0F2A3D',
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  eventDetails: {
    gap: 8,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#CCC',
    flex: 1,
  },
});

