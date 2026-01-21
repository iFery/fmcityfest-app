import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, StatusBar, Animated, Image, Easing, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BootstrapProvider, useBootstrap } from './src/providers/BootstrapProvider';
import { TimelineProvider } from './src/contexts/TimelineContext';
import AppNavigator from './src/navigation/AppNavigator';
import { OfflineBlockedScreen } from './src/screens/OfflineBlockedScreen';
import { UpdateScreen } from './src/screens/UpdateScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import * as NavigationBar from 'expo-navigation-bar';

const MIN_LOADING_TIME = 300;
const FADE_DURATION = 300;

function LoadingScreen() {
  const logoImage = require('./assets/logo.png');

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.content}>
        <Image source={logoImage} style={styles.logo} resizeMode="contain" />
      </View>
    </View>
  );
}

function AppContent() {
  const { state, timelineData, updateInfo, skipUpdate } = useBootstrap();
  const loadingOpacity = useRef(new Animated.Value(1)).current;
  const appOpacity = useRef(new Animated.Value(0)).current;
  const updateScreenOpacity = useRef(new Animated.Value(0)).current;
  const [showLoading, setShowLoading] = useState(true);
  const [showApp, setShowApp] = useState(false);
  const [showUpdateScreen, setShowUpdateScreen] = useState(false);
  const loadingStartTime = useRef<number | null>(null);

  const isLoading = state === 'loading';
  const isBlocked = state === 'offline-blocked';
  const isUpdateRequired = state === 'update-required';
  const isUpdateOptional = state === 'update-optional';
  const isReady = state === 'ready-online' || state === 'ready-offline';

  // Debug logging
  useEffect(() => {
    console.log('[AppContent] State changed:', { state, updateInfo, showUpdateScreen });
  }, [state, updateInfo, showUpdateScreen]);

  // Handle update screen fade-in
  useEffect(() => {
    if ((isUpdateRequired || isUpdateOptional) && updateInfo && !showUpdateScreen) {
      console.log('[AppContent] Setting up update screen animation');
      setShowUpdateScreen(true);
      // Fade out loading screen, fade in update screen
      Animated.parallel([
        Animated.timing(loadingOpacity, {
          toValue: 0,
          duration: FADE_DURATION,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(updateScreenOpacity, {
          toValue: 1,
          duration: FADE_DURATION,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowLoading(false);
        console.log('[AppContent] Update screen animation completed');
      });
    }
  }, [isUpdateRequired, isUpdateOptional, updateInfo, showUpdateScreen, updateScreenOpacity, loadingOpacity]);

  // Handle loading screen timing
  useEffect(() => {
    if (isLoading && loadingStartTime.current === null) {
      loadingStartTime.current = Date.now();
    }
  }, [isLoading]);

  // Handle app fade-in when ready (not showing update screen)
  useEffect(() => {
    if (!isLoading && isReady && showLoading && !showApp && !isUpdateRequired && !isUpdateOptional) {
      const now = Date.now();
      const elapsed = loadingStartTime.current ? now - loadingStartTime.current : 0;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);

      setTimeout(() => {
        setShowApp(true);

        Animated.parallel([
          Animated.timing(loadingOpacity, {
            toValue: 0,
            duration: FADE_DURATION,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(appOpacity, {
            toValue: 1,
            duration: FADE_DURATION,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowLoading(false);
        });
      }, remainingTime);
    }
  }, [isLoading, isReady, showLoading, showApp, isUpdateRequired, isUpdateOptional, loadingOpacity, appOpacity]);

  // Handle optional update skip (when user clicks "Later")
  const handleUpdateLater = async () => {
    await skipUpdate();
  };

  // Handle update action (opens store)
  const handleUpdate = () => {
    // For forced updates, we still open store but don't change state
    // User must update to continue
    // For optional updates, opening store is enough - they can update or not
  };

  // Update screen - show for forced or optional updates
  if ((isUpdateRequired || isUpdateOptional) && updateInfo && showUpdateScreen) {
    return (
      <View style={styles.appContainer}>
        <Animated.View
          style={[
            styles.updateWrapper,
            {
              opacity: updateScreenOpacity,
            },
          ]}
          pointerEvents="auto"
        >
          <UpdateScreen
            updateInfo={updateInfo}
            onUpdate={handleUpdate}
            onLater={isUpdateOptional ? handleUpdateLater : undefined}
          />
        </Animated.View>
        {/* Keep loading screen behind for smooth transition */}
        {showLoading && (
          <Animated.View
            style={[
              styles.loadingWrapper,
              {
                opacity: loadingOpacity,
              },
            ]}
            pointerEvents="none"
          >
            <LoadingScreen />
          </Animated.View>
        )}
      </View>
    );
  }

  // Offline blocked - show blocking screen only
  if (isBlocked) {
    return <OfflineBlockedScreen />;
  }

  // Loading or ready states
  return (
    <View style={styles.appContainer}>
      {showApp && isReady && (
        <Animated.View
          testID="app-navigator"
          style={[
            styles.appWrapper,
            {
              opacity: appOpacity,
            },
          ]}
          pointerEvents={showLoading ? 'none' : 'auto'}
        >
          <ErrorBoundary>
            <AppNavigator />
          </ErrorBoundary>
        </Animated.View>
      )}
      
      {showLoading && (
        <Animated.View
          style={[
            styles.loadingWrapper,
            {
              opacity: loadingOpacity,
            },
          ]}
          pointerEvents="auto"
        >
          <LoadingScreen />
        </Animated.View>
      )}
    </View>
  );
}

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#002239');
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);
  return (
    <SafeAreaProvider>
      <BootstrapProvider>
        <AppContentWithTimeline />
      </BootstrapProvider>
    </SafeAreaProvider>
  );
}

function AppContentWithTimeline() {
  const { timelineData } = useBootstrap();
  
  return (
    <TimelineProvider initialData={timelineData}>
      <AppContent />
    </TimelineProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#002239',
  },
  appWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  updateWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    backgroundColor: '#002239',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
  },
});
