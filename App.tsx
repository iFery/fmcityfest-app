import { useEffect, useState, useRef } from 'react';
import { Alert, Platform, PermissionsAndroid, AppState, AppStateStatus } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { NavigationContainerRef } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import {
  notificationDataToRoute,
  extractNotificationData,
} from './src/services/notificationNavigation';
import { RootStackParamList } from './src/types/navigation';

export default function App() {
  const [notificationPermission, setNotificationPermission] = useState<string>('checking');
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    // Request notification permission and get FCM token
    const setupPushNotifications = async () => {
      try {
        if (Platform.OS === 'ios') {
          const authStatus = await messaging().requestPermission();
          const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

          setNotificationPermission(enabled ? 'granted' : 'denied');

          if (enabled) {
            // Register for remote messages (required for iOS)
            await messaging().registerDeviceForRemoteMessages();
          }
        } else if (Platform.OS === 'android') {
          // Android 13+ (API 33+) requires runtime permission for POST_NOTIFICATIONS
          if (Platform.Version >= 33) {
            try {
              const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
                {
                  title: 'Notification Permission',
                  message:
                    'We need permission to send you push notifications about important updates and events.',
                  buttonNeutral: 'Ask Me Later',
                  buttonNegative: 'Cancel',
                  buttonPositive: 'OK',
                }
              );
              setNotificationPermission(
                granted === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied'
              );
            } catch (error) {
              console.error('Error requesting notification permission:', error);
              setNotificationPermission('error');
            }
          } else {
            // Android 12 and below don't require runtime permission
            setNotificationPermission('granted');
          }
        }

        // Get FCM token
        const token = await messaging().getToken();
        if (token) {
          console.log('[App] FCM Token:', token);
          if (__DEV__) {
            Alert.alert('FCM Token', `Token: ${token.substring(0, 50)}...`);
          }
        }
      } catch (error) {
        console.error('Error setting up push notifications:', error);
        setNotificationPermission('error');
      }
    };

    setupPushNotifications();

    // Handle foreground messages
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('[App] Foreground message received:', remoteMessage);

      // Show an alert or local notification when app is in foreground
      // Note: System notification won't show in foreground by default
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || 'Notification',
          remoteMessage.notification.body || 'You have a new message',
          [
            {
              text: 'View',
              onPress: () => {
                handleNotificationNavigation(remoteMessage);
              },
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
      } else {
        // Data-only message - handle navigation immediately
        handleNotificationNavigation(remoteMessage);
      }
    });

    // Handle notification opened from background/quitted state
    const unsubscribeBackground = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('[App] Notification opened from background:', remoteMessage);
      handleNotificationNavigation(remoteMessage);
    });

    // Check if app was opened from a quit state via notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('[App] App opened from quit state via notification:', remoteMessage);
          // Small delay to ensure navigation is ready
          setTimeout(() => {
            handleNotificationNavigation(remoteMessage);
          }, 1000);
        }
      });

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground - check for pending notifications if needed
        console.log('[App] App came to foreground');
      }
      appState.current = nextAppState;
    });

    return () => {
      unsubscribeForeground();
      unsubscribeBackground();
      subscription.remove();
    };
  }, []);

  /**
   * Handles navigation based on notification data
   */
  const handleNotificationNavigation = (remoteMessage: any) => {
    if (!navigationRef.current) {
      console.warn('[App] Navigation ref not ready yet');
      return;
    }

    const notificationData = extractNotificationData(remoteMessage);
    const route = notificationDataToRoute(notificationData);

    if (!route) {
      console.warn('[App] Could not create route from notification data');
      // Navigate to home as fallback
      navigationRef.current.navigate('Home');
      return;
    }

    try {
      navigationRef.current.navigate(route.screen as any, route.params as any);
      console.log('[App] Navigated to:', route.screen, route.params);
    } catch (error) {
      console.error('[App] Navigation error:', error);
      // Fallback to home screen
      navigationRef.current.navigate('Home');
    }
  };

  return <AppNavigator ref={navigationRef} />;
}
