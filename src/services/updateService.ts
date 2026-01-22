/**
 * Update Service - Handles app update checking via Firebase Remote Config
 * Uses semantic versioning to compare app versions
 */

import Constants from 'expo-constants';
import { Platform, Linking } from 'react-native';
import { remoteConfigService } from './remoteConfig';
import { crashlyticsService } from './crashlytics';
import NetInfo from '@react-native-community/netinfo';

export type UpdateType = 'forced' | 'optional' | 'none';

export interface UpdateInfo {
  type: UpdateType;
  latestVersion: string;
  whatsNew?: string[];
}

/**
 * Compare semantic versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  const maxLength = Math.max(parts1.length, parts2.length);
  
  for (let i = 0; i < maxLength; i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

/**
 * Get current app version from Constants
 */
function getCurrentVersion(): string {
  const version = Constants.expoConfig?.version || Constants.manifest2?.extra?.expoClient?.version || '1.0.0';
  return version;
}

/**
 * Parse "What's New" list from Remote Config
 * Expected format: JSON array of strings or comma-separated string
 */
function parseWhatsNew(value: string): string[] {
  if (!value || value.trim() === '') {
    return [
      'Rychlejší a stabilnější aplikace',
      'Vylepšený program a přehled interpretů',
      'Opravy drobných chyb',
    ];
  }

  try {
    // Try parsing as JSON first
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // If not JSON, try comma-separated
    const items = value.split(',').map((item) => item.trim()).filter((item) => item.length > 0);
    if (items.length > 0) {
      return items;
    }
  }

  // Fallback to default
  return [
    'Rychlejší a stabilnější aplikace',
    'Vylepšený program a přehled interpretů',
    'Opravy drobných chyb',
  ];
}

/**
 * Check if update is required
 * Returns UpdateInfo with type (forced, optional, or none)
 */
export async function checkForUpdate(): Promise<UpdateInfo> {
  try {
    // Check if offline - don't block app if offline
    const netInfoState = await NetInfo.fetch();
    const isOffline = !netInfoState.isInternetReachable;
    
    if (isOffline) {
      crashlyticsService.log('update_check_skipped_offline');
      return { type: 'none', latestVersion: getCurrentVersion() };
    }

    const currentVersion = getCurrentVersion();
    const latestVersion = remoteConfigService.getString('latest_app_version', currentVersion);
    const minRequiredVersion = remoteConfigService.getString('min_required_version', currentVersion);
    const forceUpdateEnabled = remoteConfigService.getBoolean('force_update_enabled', false);

    // Enhanced logging for debugging
    console.log(`[UpdateService] Version check:`, {
      current: currentVersion,
      latest: latestVersion,
      minRequired: minRequiredVersion,
      forceEnabled: forceUpdateEnabled,
    });
    crashlyticsService.log(`update_check: current=${currentVersion}, latest=${latestVersion}, min=${minRequiredVersion}, force=${forceUpdateEnabled}`);

    // Compare current version with minimum required version
    const isBelowMinRequired = compareVersions(currentVersion, minRequiredVersion) < 0;
    
    // Compare current version with latest version
    const isBelowLatest = compareVersions(currentVersion, latestVersion) < 0;

    // Forced update: user is below minimum required version AND force update is enabled
    if (isBelowMinRequired && forceUpdateEnabled) {
      const whatsNew = parseWhatsNew(remoteConfigService.getString('update_whats_new', ''));
      crashlyticsService.log('update_required: forced');
      return {
        type: 'forced',
        latestVersion,
        whatsNew,
      };
    }

    // Optional update: user is below latest version but above minimum required
    if (isBelowLatest) {
      const whatsNew = parseWhatsNew(remoteConfigService.getString('update_whats_new', ''));
      crashlyticsService.log('update_required: optional');
      return {
        type: 'optional',
        latestVersion,
        whatsNew,
      };
    }

    // No update needed
    crashlyticsService.log('update_check: no_update_needed');
    return {
      type: 'none',
      latestVersion: currentVersion,
    };
  } catch (error) {
    console.error('Error checking for update:', error);
    crashlyticsService.recordError(error instanceof Error ? error : new Error('Update check failed'));
    // On error, allow app to continue (don't block)
    return {
      type: 'none',
      latestVersion: getCurrentVersion(),
    };
  }
}

/**
 * Get store URL for the current platform
 */
function getStoreUrl(): string {
  if (Platform.OS === 'ios') {
    // App Store URL format: https://apps.apple.com/app/id{APP_ID}
    // App Store ID is unique per app and same across all regions/languages
    // Hardcoded App Store ID: 6747171420 (from https://apps.apple.com/cz/app/fm-city-fest/id6747171420)
    const APP_STORE_ID = '6747171420';
    return `https://apps.apple.com/app/id${APP_STORE_ID}`;
  } else {
    // Google Play Store URL format: https://play.google.com/store/apps/details?id={PACKAGE_NAME}
    const bundleId = Constants.expoConfig?.android?.package || 'com.fmcityfest.app';
    return `https://play.google.com/store/apps/details?id=${bundleId}`;
  }
}

/**
 * Open app store for update
 */
export async function openStoreForUpdate(): Promise<void> {
  try {
    const url = getStoreUrl();
    crashlyticsService.log(`opening_store: ${url}`);
    const canOpen = await Linking.canOpenURL(url);
    
    if (canOpen) {
      await Linking.openURL(url);
      crashlyticsService.log('store_opened_successfully');
    } else {
      console.error('Cannot open store URL:', url);
      crashlyticsService.log('store_url_cannot_open');
    }
  } catch (error) {
    console.error('Error opening store:', error);
    crashlyticsService.recordError(error instanceof Error ? error : new Error('Failed to open store'));
  }
}

