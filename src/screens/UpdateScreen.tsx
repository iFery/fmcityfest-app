/**
 * UpdateScreen - Fullscreen update prompt screen
 * Supports forced and optional updates
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { UpdateInfo, openStoreForUpdate } from '../services/updateService';
import { crashlyticsService } from '../services/crashlytics';

interface UpdateScreenProps {
  updateInfo: UpdateInfo;
  onUpdate: () => void;
  onLater?: () => void;
}

const HEADLINE = 'Nová verze FM CITY FEST je tady 🎉';
const DESCRIPTION = 'Aktualizuj aplikaci a měj jistotu, že ti neuteče žádná důležitá informace z festivalu.';
const PRIMARY_CTA = 'Aktualizovat nyní';
const SECONDARY_CTA = 'Později';

const DEFAULT_WHATS_NEW = [
  'Rychlejší a stabilnější aplikace',
  'Vylepšený program a přehled interpretů',
  'Opravy drobných chyb',
];

export function UpdateScreen({ updateInfo, onUpdate, onLater }: UpdateScreenProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isForced = updateInfo.type === 'forced';
  const whatsNew = updateInfo.whatsNew || DEFAULT_WHATS_NEW;
  const insets = useSafeAreaInsets();

  const logoImage = require('../../assets/logo.png');

  const handleUpdate = async () => {
    if (isUpdating) return; // Prevent double-tap
    
    setIsUpdating(true);
    crashlyticsService.log('update_accepted');
    
    try {
      await openStoreForUpdate();
      onUpdate();
    } catch (error) {
      console.error('Error opening store:', error);
      setIsUpdating(false);
    }
  };

  const handleLater = () => {
    if (isForced) return; // Should not happen, but safety check
    
    crashlyticsService.log('update_postponed');
    onLater?.();
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top, paddingBottom: insets.bottom + 40 }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Centered content section */}
          <View style={styles.centeredContent}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image source={logoImage} style={styles.logo} resizeMode="contain" />
            </View>

            {/* Headline */}
            <Text style={styles.headline}>{HEADLINE}</Text>

            {/* Description */}
            <Text style={styles.description}>{DESCRIPTION}</Text>

            {/* What's New list */}
            <View style={styles.whatsNewContainer}>
              {whatsNew.map((item: string, index: number) => (
                <View key={index} style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

        {/* Buttons - fixed at bottom */}
        <View style={styles.actionsContainer}>
          {/* Primary CTA */}
          <TouchableOpacity
            style={[styles.primaryButton, isUpdating && styles.primaryButtonDisabled]}
            onPress={handleUpdate}
            disabled={isUpdating}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {isUpdating ? 'Otevírání obchodu...' : PRIMARY_CTA}
            </Text>
          </TouchableOpacity>

          {/* Secondary CTA - only show for optional updates */}
          {!isForced && onLater && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleLater}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>{SECONDARY_CTA}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002239',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 20,
  },
  logoContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
  },
  headline: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  description: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  whatsNewContainer: {
    width: '100%',
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    fontSize: 18,
    color: '#EA5178',
    marginRight: 12,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  actionsContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
    marginTop: 'auto',
    paddingTop: 20,
  },
  primaryButton: {
    backgroundColor: '#EA5178',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    ...Platform.select({
      ios: {
        shadowColor: '#EA5178',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#CCCCCC',
    fontSize: 16,
    fontWeight: '500',
  },
});

