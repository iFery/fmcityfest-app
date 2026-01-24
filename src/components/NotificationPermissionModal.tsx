/**
 * Notification Permission Modal
 * Custom "soft ask" screen with festival-style design
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { logEvent } from '../services/analytics';

const { width, height } = Dimensions.get('window');

interface NotificationPermissionModalProps {
  visible: boolean;
  onAllowNotifications: () => void;
  onDismiss: () => void;
  source?: string;
}

export default function NotificationPermissionModal({
  visible,
  onAllowNotifications,
  onDismiss,
  source,
}: NotificationPermissionModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hasLoggedShown = useRef(false);

  useEffect(() => {
    if (visible) {
      if (!hasLoggedShown.current) {
        hasLoggedShown.current = true;
        logEvent('notification_prompt', {
          action: 'shown',
          source: source || 'unknown',
        });
      }
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      pulseAnim.setValue(1);

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

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      pulseAnim.setValue(1);
      hasLoggedShown.current = false;
    }
  }, [visible, fadeAnim, slideAnim, pulseAnim, source]);

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
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Ionicons name="notifications" size={56} color="#4ECAC6" />
            </Animated.View>

            <Text style={styles.title}>Nezmeškej nic z FM CITY FESTu 🔔</Text>

            <Text style={styles.bodyText}>
              Povol notifikace a dostávej důležité informace o festivalu – změny programu, začátky koncertů a speciální akce.
            </Text>

            <TouchableOpacity
              onPress={() => {
                logEvent('notification_prompt', {
                  action: 'accepted',
                  source: source || 'unknown',
                });
                onAllowNotifications();
              }}
              activeOpacity={0.85}
              style={styles.primaryButton}
            >
              <View style={styles.primaryButtonInner}>
                <Text style={styles.primaryButtonText}>Ano, chci být v obraze</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                logEvent('notification_prompt', {
                  action: 'dismissed',
                  source: source || 'unknown',
                });
                onDismiss();
              }}
              activeOpacity={0.6}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Možná později</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
    height: height,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 25, 40, 0.85)',
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#0B2A3A',
    padding: 28,
    alignItems: 'center',
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
  iconContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 28,
  },
  bodyText: {
    fontSize: 16,
    color: '#D0D0D0',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  primaryButton: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 15,
    overflow: 'hidden',
  },
  primaryButtonInner: {
    backgroundColor: '#2BC0E4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 15,
    shadowColor: '#2BC0E4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    color: 'rgba(208, 208, 208, 0.6)',
    fontSize: 16,
    fontWeight: '500',
  },
});
