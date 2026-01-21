import crashlytics from '@react-native-firebase/crashlytics';
import { isFirebaseReady } from './firebase';

class CrashlyticsService {
  /**
   * Povolí nebo zakáže Crashlytics
   */
  setEnabled(enabled: boolean): void {
    try {
      if (!isFirebaseReady()) {
        return;
      }
      crashlytics().setCrashlyticsCollectionEnabled(enabled);
    } catch (e: any) {
      console.error('❌ [crashlytics.ts] Error setting Crashlytics enabled:', e);
    }
  }

  /**
   * Zaznamená chybu do Crashlytics
   */
  recordError(error: Error, jsErrorName?: string): void {
    try {
      if (!isFirebaseReady()) {
        return;
      }
      crashlytics().recordError(error, jsErrorName);
    } catch (e: any) {
      console.error('❌ [crashlytics.ts] Error recording to Crashlytics:', e);
    }
  }

  /**
   * Nastaví vlastní atributy pro Crashlytics
   */
  setAttribute(key: string, value: string): void {
    try {
      if (!isFirebaseReady()) {
        console.warn('Crashlytics: Firebase not ready, skipping setAttribute');
        return;
      }
      crashlytics().setAttribute(key, value);
    } catch (e) {
      console.error('Error setting Crashlytics attribute:', e);
    }
  }

  /**
   * Nastaví uživatelské ID pro Crashlytics
   */
  setUserId(userId: string): void {
    try {
      if (!isFirebaseReady()) {
        console.warn('Crashlytics: Firebase not ready, skipping setUserId');
        return;
      }
      crashlytics().setUserId(userId);
    } catch (e) {
      console.error('Error setting Crashlytics user ID:', e);
    }
  }

  /**
   * Přidá log do Crashlytics
   */
  log(message: string): void {
    try {
      if (!isFirebaseReady()) {
        console.warn('Crashlytics: Firebase not ready, skipping log');
        return;
      }
      crashlytics().log(message);
    } catch (e) {
      console.error('Error logging to Crashlytics:', e);
    }
  }

  /**
   * Vynutí testovací crash (pouze pro testování)
   */
  forceCrash(): void {
    try {
      if (!isFirebaseReady()) {
        console.warn('Crashlytics: Firebase not ready, cannot force crash');
        return;
      }
      crashlytics().crash();
    } catch (e) {
      console.error('Error forcing crash:', e);
    }
  }
}

// Lazy initialization - create instance only when needed
let crashlyticsServiceInstance: CrashlyticsService | null = null;

export const crashlyticsService = new Proxy({} as CrashlyticsService, {
  get(target, prop) {
    if (!crashlyticsServiceInstance) {
      crashlyticsServiceInstance = new CrashlyticsService();
    }
    const value = crashlyticsServiceInstance[prop as keyof CrashlyticsService];
    if (typeof value === 'function') {
      return value.bind(crashlyticsServiceInstance);
    }
    return value;
  }
});
