import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Alert, Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';

export default function App() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<string>('checking');

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
                  message: 'We need permission to send you push notifications about important updates and events.',
                  buttonNeutral: 'Ask Me Later',
                  buttonNegative: 'Cancel',
                  buttonPositive: 'OK',
                }
              );
              setNotificationPermission(granted === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied');
            } catch (error) {
              console.error('Error requesting notification permission:', error);
              setNotificationPermission('error');
            }
          } else {
            // Android 12 and below don't require runtime permission
            setNotificationPermission('granted');
          }
        }

        // Get FCM token (works on both iOS and Android)
        const token = await messaging().getToken();
        if (token) {
          setFcmToken(token);
          console.log('FCM Token:', token);
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
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FM City Fest App</Text>
      <Text style={styles.subtitle}>Push Notifications Setup</Text>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Platform:</Text>
        <Text style={styles.value}>{Platform.OS}</Text>
        <Text style={styles.label}>Notification Permission:</Text>
        <Text style={styles.value}>{notificationPermission}</Text>
        {fcmToken && (
          <>
            <Text style={styles.label}>FCM Token:</Text>
            <Text style={styles.tokenValue} numberOfLines={2}>
              {fcmToken}
            </Text>
          </>
        )}
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 32,
  },
  infoContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    color: '#333',
  },
  value: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tokenValue: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
});
