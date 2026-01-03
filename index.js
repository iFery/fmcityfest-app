/**
 * Background message handler
 * This must be a separate file and registered before the app initializes
 */
import messaging from '@react-native-firebase/messaging';

// Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[BackgroundHandler] Message handled in the background!', remoteMessage);
  // Background messages are handled by the OS notification system
  // Navigation will happen when user taps the notification
});
