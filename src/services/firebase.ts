/**
 * Firebase initialization
 * React Native Firebase auto-initializes when google-services.json (Android)
 * and GoogleService-Info.plist (iOS) are present, but we ensure it's ready here
 */
import { firebase } from '@react-native-firebase/app';

// Firebase should auto-initialize, but we can check if it's initialized
export function ensureFirebaseInitialized(): void {
  try {
    // Try to get the default app - if it fails, Firebase isn't initialized
    firebase.app();
  } catch (error) {
    console.warn('[Firebase] App not initialized, but should auto-initialize with config files');
    // Firebase should auto-initialize with google-services.json/GoogleService-Info.plist
    // If this error occurs, check that config files are in the correct locations
  }
}

