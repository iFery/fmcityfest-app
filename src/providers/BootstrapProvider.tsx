/**
 * BootstrapProvider - Controls app startup with offline-first logic
 * Ensures app only starts when data is available (online or cached)
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { preloadAllData } from '../services/preloadService';
import { hasAnyValidCache, getOldestCacheAge, loadFromCache, checkAndClearCacheOnVersionUpgrade } from '../utils/cacheManager';
import { crashlyticsService } from '../services/crashlytics';
import { initializeFirebase, ensureFirebaseInitialized } from '../services/firebase';
import { remoteConfigService } from '../services/remoteConfig';
import { notificationService } from '../services/notifications';
import { Platform } from 'react-native';
import { TimelineApiResponse } from '../api/endpoints';
import { checkForUpdate, UpdateInfo } from '../services/updateService';

const UPDATE_SKIP_KEY = '@update_skip_version';

export type BootstrapState = 
  | 'loading' 
  | 'update-required' 
  | 'update-optional' 
  | 'ready-online' 
  | 'ready-offline' 
  | 'offline-blocked';

interface BootstrapContextValue {
  state: BootstrapState;
  retry: () => void;
  timelineData: TimelineApiResponse | null;
  updateInfo: UpdateInfo | null;
  skipUpdate: () => Promise<void>;
}

const BootstrapContext = createContext<BootstrapContextValue | undefined>(undefined);

// Required cache keys for app to function
const REQUIRED_CACHE_KEYS = ['artists', 'events', 'partners', 'news', 'faq'];

interface BootstrapProviderProps {
  children: ReactNode;
}

export function BootstrapProvider({ children }: BootstrapProviderProps) {
  const [state, setState] = useState<BootstrapState>('loading');
  const [retryKey, setRetryKey] = useState(0);
  const [timelineData, setTimelineData] = useState<TimelineApiResponse | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  // Run bootstrap with proper cleanup and mounted checks
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const runBootstrap = async () => {
      try {
        if (!isMounted || abortController.signal.aborted) return;
        setState('loading');
        
        crashlyticsService.log('bootstrap_start');
        crashlyticsService.setAttribute('bootstrap_attempt', String(retryKey + 1));

        // Initialize Firebase first (required for Crashlytics)
        // We use ensureFirebaseInitialized which waits for auto-initialization
        try {
          await ensureFirebaseInitialized();
          if (!isMounted || abortController.signal.aborted) return;
          await initializeFirebase();
          if (!isMounted || abortController.signal.aborted) return;
          crashlyticsService.log('Firebase initialized');
        } catch (firebaseError) {
          console.warn('Firebase initialization failed, continuing anyway:', firebaseError);
          // Continue even if Firebase fails
        }

        // Setup Crashlytics attributes
        try {
          crashlyticsService.setAttribute('platform', Platform.OS);
        } catch (e) {
          // Ignore if Crashlytics is not available
        }

        // Check for app version upgrade and clear cache if needed
        // This should happen before any cache operations
        try {
          const cacheCleared = await checkAndClearCacheOnVersionUpgrade();
          if (cacheCleared) {
            crashlyticsService.log('cache_cleared_on_version_upgrade');
            console.log('[Bootstrap] Cache cleared due to app version upgrade');
          }
        } catch (versionCheckError) {
          console.warn('Error checking version upgrade:', versionCheckError);
          // Continue bootstrap even if version check fails
        }

        // Check internet connectivity first (before Remote Config fetch)
        const netInfoState = await NetInfo.fetch();
        if (!isMounted || abortController.signal.aborted) return;
        
        const isInternetReachable = netInfoState.isInternetReachable ?? false;
        
        crashlyticsService.setAttribute('internet_reachable', String(isInternetReachable));
        crashlyticsService.log(`Internet reachable: ${isInternetReachable}`);

        // Initialize Remote Config (skip fetch if no internet)
        try {
          await remoteConfigService.initialize(!isInternetReachable);
          if (!isMounted || abortController.signal.aborted) return;
          crashlyticsService.log('Remote Config initialized');
        } catch (rcError) {
          console.warn('Remote Config initialization failed:', rcError);
        }

        // Check for app updates (after Remote Config is initialized)
        // Only check if online (offline mode should not block app)
        if (isInternetReachable) {
          try {
            console.log('[Bootstrap] Checking for app updates...');
            const updateCheckResult = await checkForUpdate();
            if (!isMounted || abortController.signal.aborted) return;
            
            console.log('[Bootstrap] Update check result:', updateCheckResult);
            
            // Check if user has skipped this version
            const skippedVersion = await AsyncStorage.getItem(UPDATE_SKIP_KEY);
            const isSkipped = skippedVersion === updateCheckResult.latestVersion;
            
            setUpdateInfo(updateCheckResult);
            
            if (updateCheckResult.type === 'forced') {
              console.log('[Bootstrap] Forced update required - blocking app');
              crashlyticsService.log('bootstrap_blocked_by_forced_update');
              setState('update-required');
              return; // Stop bootstrap, show update screen (cannot skip forced updates)
            } else if (updateCheckResult.type === 'optional' && !isSkipped) {
              console.log('[Bootstrap] Optional update available');
              crashlyticsService.log('bootstrap_optional_update_available');
              setState('update-optional');
              return; // Stop bootstrap, show update screen (user can skip)
            }
            console.log('[Bootstrap] No update required, continuing bootstrap');
            // Continue with normal bootstrap if no update needed or update was skipped
          } catch (updateError) {
            console.error('[Bootstrap] Update check failed, continuing bootstrap:', updateError);
            crashlyticsService.recordError(updateError instanceof Error ? updateError : new Error('Update check failed'));
            // Continue with bootstrap even if update check fails
          }
        } else {
          console.log('[Bootstrap] Skipping update check - offline mode');
        }

        // Setup notifications (only listeners, don't request permission here)
        if (Platform.OS !== 'web') {
          try {
            const token = await notificationService.getToken();
            if (!isMounted || abortController.signal.aborted) return;
            if (token) {
              crashlyticsService.log('FCM Token registered');
            }
            // Store listeners (they live for app lifetime, no cleanup needed)
            await notificationService.setupNotificationListeners();
          } catch (notifError) {
            console.warn('Notification setup failed:', notifError);
          }
        }

        // Check for existing cache
        const hasCache = await hasAnyValidCache(REQUIRED_CACHE_KEYS);
        if (!isMounted || abortController.signal.aborted) return;
        
        // Preload timeline data from cache if available (for immediate use in TimelineContext)
        if (hasCache) {
          try {
            const cachedTimeline = await loadFromCache<TimelineApiResponse>('timeline');
            if (cachedTimeline && isMounted && !abortController.signal.aborted) {
              setTimelineData(cachedTimeline);
            }
          } catch (err) {
            // Silently fail - timeline will be loaded later if needed
            console.warn('Failed to preload timeline from cache:', err);
          }
        }
        
        const cacheAge = hasCache ? await getOldestCacheAge(REQUIRED_CACHE_KEYS) : null;
        
        if (cacheAge !== null) {
          const cacheAgeHours = Math.floor(cacheAge / (60 * 60 * 1000));
          crashlyticsService.setAttribute('cache_age_hours', String(cacheAgeHours));
          crashlyticsService.log(`Cache age: ${cacheAgeHours} hours`);
        }

        // Decision flow
        if (isInternetReachable) {
          // Internet is available - try to fetch data
          try {
            crashlyticsService.log('Fetching app data...');
            
            const preloadResult = await preloadAllData();
            
            if (!isMounted || abortController.signal.aborted) return;
            
            // Store timeline data from preload for immediate use in TimelineContext
            if (preloadResult.timelineData && isMounted && !abortController.signal.aborted) {
              setTimelineData(preloadResult.timelineData);
            }
            
            if (preloadResult.errors.length > 0) {
              console.warn('Some data failed to preload:', preloadResult.errors);
              crashlyticsService.log(`Preload errors: ${preloadResult.errors.join(', ')}`);
            }

            // After fetch attempt, check if we have cache now
            const hasCacheAfterFetch = await hasAnyValidCache(REQUIRED_CACHE_KEYS);
            
            if (!isMounted || abortController.signal.aborted) return;
            
            if (hasCacheAfterFetch) {
              crashlyticsService.log('bootstrap_online_success');
              setState('ready-online');
            } else if (hasCache) {
              // Fetch failed but we had old cache
              crashlyticsService.log('bootstrap_offline_cache_used');
              crashlyticsService.setAttribute('fetch_failed', 'true');
              setState('ready-offline');
            } else {
              // Fetch failed and no cache
              crashlyticsService.log('bootstrap_offline_blocked');
              crashlyticsService.setAttribute('blocked_reason', 'fetch_failed_no_cache');
              setState('offline-blocked');
            }
          } catch (fetchError) {
            if (!isMounted || abortController.signal.aborted) return;
            
            console.error('Error fetching app data:', fetchError);
            crashlyticsService.log('bootstrap_fetch_failed');
            crashlyticsService.recordError(
              fetchError instanceof Error ? fetchError : new Error('Bootstrap fetch failed')
            );

            // Check if we have cache to fall back to
            if (hasCache) {
              crashlyticsService.log('bootstrap_offline_cache_used');
              crashlyticsService.setAttribute('fetch_failed', 'true');
              setState('ready-offline');
            } else {
              crashlyticsService.log('bootstrap_offline_blocked');
              crashlyticsService.setAttribute('blocked_reason', 'fetch_error_no_cache');
              setState('offline-blocked');
            }
          }
        } else {
          // Internet is NOT available
          if (!isMounted || abortController.signal.aborted) return;
          
          if (hasCache) {
            crashlyticsService.log('bootstrap_offline_cache_used');
            setState('ready-offline');
          } else {
            crashlyticsService.log('bootstrap_offline_blocked');
            crashlyticsService.setAttribute('blocked_reason', 'no_internet_no_cache');
            setState('offline-blocked');
          }
        }
      } catch (error) {
        if (!isMounted || abortController.signal.aborted) return;
        
        console.error('Bootstrap error:', error);
        crashlyticsService.recordError(
          error instanceof Error ? error : new Error('Bootstrap failed')
        );
        
        // Last resort: check if we have any cache
        const hasCache = await hasAnyValidCache(REQUIRED_CACHE_KEYS);
        if (!isMounted || abortController.signal.aborted) return;
        
        if (hasCache) {
          crashlyticsService.log('bootstrap_offline_cache_used');
          setState('ready-offline');
        } else {
          crashlyticsService.log('bootstrap_offline_blocked');
          crashlyticsService.setAttribute('blocked_reason', 'bootstrap_error');
          setState('offline-blocked');
        }
      }
    };

    runBootstrap();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [retryKey]);

  const retry = useCallback(() => {
    setRetryKey((prev) => prev + 1);
  }, []);

  const skipUpdate = useCallback(async () => {
    if (updateInfo?.latestVersion) {
      await AsyncStorage.setItem(UPDATE_SKIP_KEY, updateInfo.latestVersion);
      crashlyticsService.log('update_skipped_by_user');
      // Retry bootstrap - it will see the skipped version and continue
      setRetryKey((prev) => prev + 1);
    }
  }, [updateInfo]);

  // Optional: Listen for internet connectivity changes when blocked
  useEffect(() => {
    if (state === 'offline-blocked') {
      const unsubscribe = NetInfo.addEventListener((netInfoState: NetInfoState) => {
        if (netInfoState.isInternetReachable) {
          crashlyticsService.log('Internet became reachable, retrying bootstrap');
          retry();
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [state, retry]);

  // Initialize deep link service when app becomes ready
  useEffect(() => {
    if (state === 'ready-online' || state === 'ready-offline') {
      // Delay to ensure navigation container is mounted
      const timer = setTimeout(async () => {
        try {
          const { deepLinkService } = await import('../services/deepLinkService');
          await deepLinkService.initialize();
          crashlyticsService.log('Deep link service initialized');
        } catch (deepLinkError) {
          console.warn('Deep link service initialization failed:', deepLinkError);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [state]);

  const value: BootstrapContextValue = {
    state,
    retry,
    timelineData,
    updateInfo,
    skipUpdate,
  };

  return <BootstrapContext.Provider value={value}>{children}</BootstrapContext.Provider>;
}

export function useBootstrap(): BootstrapContextValue {
  const context = useContext(BootstrapContext);
  if (context === undefined) {
    throw new Error('useBootstrap must be used within a BootstrapProvider');
  }
  return context;
}

