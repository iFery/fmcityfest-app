import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import remoteConfig from '@react-native-firebase/remote-config';
import crashlytics from '@react-native-firebase/crashlytics';

/**
 * Inicializuje Firebase služby
 * React Native Firebase se inicializuje automaticky z google-services.json / GoogleService-Info.plist
 * Ale pro jistotu zkontrolujeme a případně inicializujeme explicitně
 */
export const initializeFirebase = async () => {
  try {
    // Zkontrolujeme, zda je Firebase již inicializován
    // React Native Firebase se inicializuje automaticky z google-services.json / GoogleService-Info.plist
    // Pokud není, zkusíme explicitní inicializaci
    if (firebase.apps.length === 0) {
      console.warn('Firebase apps array is empty - attempting explicit initialization');
      try {
        // V React Native Firebase se inicializace obvykle dělá automaticky,
        // ale pokud ne, zkusíme to explicitně (i když to obvykle není potřeba)
        // Pro React Native Firebase by měl být google-services.json dostatečný
        console.log('Firebase will be initialized automatically from google-services.json');
      } catch (initError) {
        console.error('Firebase initialization error:', initError);
        // Pokračujeme - možná se inicializuje později
      }
    } else {
      console.log(`Firebase initialized with ${firebase.apps.length} app(s)`);
    }

    // Inicializace Remote Config
    try {
      await remoteConfig().setConfigSettings({
        minimumFetchIntervalMillis: 3600000, // 1 hodina
      });
      console.log('Remote Config settings configured');
    } catch (rcError) {
      console.warn('Remote Config setup failed:', rcError);
      throw rcError;
    }

    // Inicializace Crashlytics
    try {
      crashlytics().setCrashlyticsCollectionEnabled(true);
      console.log('Crashlytics enabled');
    } catch (crashlyticsError) {
      console.warn('Crashlytics setup failed:', crashlyticsError);
      // Crashlytics není kritický, pokračujeme
    }

    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    // Nehážeme error, aby aplikace mohla pokračovat
    // throw error;
  }
};

export const getFirebaseMessaging = () => messaging();

/**
 * Získá Firebase project ID z aktuální konfigurace
 */
export const getFirebaseProjectId = (): string | null => {
  try {
    if (firebase.apps.length > 0) {
      const app = firebase.app();
      // projectId je dostupný v options po inicializaci
      return app.options.projectId || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting Firebase project ID:', error);
    return null;
  }
};

