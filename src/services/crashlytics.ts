import crashlytics from '@react-native-firebase/crashlytics';

class CrashlyticsService {
  /**
   * Povolí nebo zakáže Crashlytics
   */
  setEnabled(enabled: boolean): void {
    try {
      crashlytics().setCrashlyticsCollectionEnabled(enabled);
    } catch (e) {
      console.error('Error setting Crashlytics enabled:', e);
    }
  }

  /**
   * Zaznamená chybu do Crashlytics
   */
  recordError(error: Error, jsErrorName?: string): void {
    try {
      crashlytics().recordError(error, jsErrorName);
    } catch (e) {
      console.error('Error recording to Crashlytics:', e);
    }
  }

  /**
   * Nastaví vlastní atributy pro Crashlytics
   */
  setAttribute(key: string, value: string): void {
    try {
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
      crashlytics().log(message);
    } catch (e) {
      console.error('Error logging to Crashlytics:', e);
    }
  }

  /**
   * Vynutí testovací crash (pouze pro testování)
   */
  forceCrash(): void {
    crashlytics().crash();
  }
}

export const crashlyticsService = new CrashlyticsService();

