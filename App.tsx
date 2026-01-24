import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Platform, Image, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  Raleway_400Regular,
  Raleway_500Medium,
  Raleway_600SemiBold,
  Raleway_700Bold,
} from '@expo-google-fonts/raleway';
import { BootstrapProvider, useBootstrap } from './src/providers/BootstrapProvider';
import { ThemeProvider } from './src/theme/ThemeProvider'
import { TimelineProvider } from './src/contexts/TimelineContext';
import AppNavigator from './src/navigation/AppNavigator';
import { OfflineBlockedScreen } from './src/screens/OfflineBlockedScreen';
import { UpdateScreen } from './src/screens/UpdateScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import * as NavigationBar from 'expo-navigation-bar';

// Keep native splash visible until we explicitly hide it
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if it was already prevented
});

function AppContent({ fontsReady }: { fontsReady: boolean }) {
  const { state, updateInfo, skipUpdate } = useBootstrap();
  const hasHiddenSplash = useRef(false);
  const [rootLayoutDone, setRootLayoutDone] = useState(false);
  const appOpacity = useRef(new Animated.Value(0)).current;

  const isBlocked = state === 'offline-blocked';
  const isUpdateRequired = state === 'update-required';
  const isUpdateOptional = state === 'update-optional';
  const isReady = state === 'ready-online' || state === 'ready-offline';
  const shouldShowUpdate = (isUpdateRequired || isUpdateOptional) && updateInfo;
  const shouldShowLoading = !isReady && !isBlocked && !shouldShowUpdate;
  const canHideSplash = fontsReady && (isReady || shouldShowUpdate || isBlocked);

  // Debug logging
  useEffect(() => {
    console.log('[AppContent] State changed:', { state, updateInfo, fontsReady });
  }, [state, updateInfo, fontsReady]);

  // Hide native splash only when we can render a first frame
  useEffect(() => {
    if (!rootLayoutDone || !canHideSplash || hasHiddenSplash.current) return;
    SplashScreen.hideAsync()
      .then(() => {
        hasHiddenSplash.current = true;
        if (isReady) {
          Animated.timing(appOpacity, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }).start();
        } else {
          appOpacity.setValue(1);
        }
      })
      .catch(() => {
        // Ignore and retry on next state/layout change
      });
  }, [rootLayoutDone, canHideSplash, isReady, appOpacity]);

  useEffect(() => {
    if (!isReady) return;
    if (!hasHiddenSplash.current) return;
    // In case readiness changes after splash is already hidden
    Animated.timing(appOpacity, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isReady, appOpacity]);

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
  if (shouldShowUpdate) {
    return (
      <View style={styles.appContainer} onLayout={() => setRootLayoutDone(true)}>
        <UpdateScreen
          updateInfo={updateInfo}
          onUpdate={handleUpdate}
          onLater={isUpdateOptional ? handleUpdateLater : undefined}
        />
      </View>
    );
  }

  // Offline blocked - show blocking screen only
  if (isBlocked) {
    return (
      <View style={styles.appContainer} onLayout={() => setRootLayoutDone(true)}>
        <OfflineBlockedScreen />
      </View>
    );
  }

  // Ready state
  return (
    <View style={styles.appContainer} onLayout={() => setRootLayoutDone(true)}>
      {isReady && (
        <Animated.View
          testID="app-navigator"
          style={[styles.appWrapper, { opacity: appOpacity }]}
        >
          <ErrorBoundary>
            <AppNavigator />
          </ErrorBoundary>
        </Animated.View>
      )}
      {shouldShowLoading && <LoadingScreen />}
    </View>
  );
}


export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      // V edge-to-edge režimu lze měnit jen styl ikon
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);

  return (
    <SafeAreaProvider>
      <BootstrapProvider>
        <View style={styles.root}>
          <AppContentWithFonts />
        </View>
      </BootstrapProvider>
    </SafeAreaProvider>
  );
}

function AppContentWithFonts() {
  const [fontsLoaded, fontError] = useFonts({
    'Raleway-Regular': Raleway_400Regular,
    'Raleway-Medium': Raleway_500Medium,
    'Raleway-SemiBold': Raleway_600SemiBold,
    'Raleway-Bold': Raleway_700Bold,
  });

  const [fontsTimeout, setFontsTimeout] = useState(false);

  useEffect(() => {
    if (fontError) {
      console.error('❌ Font loading error:', fontError);
      setFontsTimeout(true);
    }

    const timeout = setTimeout(() => {
      if (!fontsLoaded && !fontError) {
        setFontsTimeout(true);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [fontsLoaded, fontError]);

  const fontsReady = fontsLoaded || fontsTimeout || !!fontError;

  return (
    <View style={styles.appContainer}>
      <ThemeProvider>
        <AppContentWithTimeline fontsReady={fontsReady} />
      </ThemeProvider>
    </View>
  );
}

function AppContentWithTimeline({ fontsReady }: { fontsReady: boolean }) {
  const { timelineData } = useBootstrap();

  return (
    <TimelineProvider initialData={timelineData}>
      <AppContent fontsReady={fontsReady} />
    </TimelineProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#002239',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#002239',
  },
  appWrapper: {
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

function LoadingScreen() {
  const logoImage = require('./assets/logo-lg.png');

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.content}>
        <Image source={logoImage} style={styles.logo} resizeMode="contain" />
      </View>
    </View>
  );
}
