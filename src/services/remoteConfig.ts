import remoteConfig from '@react-native-firebase/remote-config';
import crashlytics from '@react-native-firebase/crashlytics';
import { ensureFirebaseInitialized, isFirebaseReady } from './firebase';

class RemoteConfigService {
  private defaultConfig = {
    // App version management
    update_message: 'A new version is available. Please update. Ahoj.',
    min_required_version: '1.0.5',
    min_app_version: '1.0.0',
    latest_app_version: '1.0.0',
    force_update_enabled: 'false',
    update_required_message: 'Je nutné aktualizovat na novější verzi aplikace.',
    update_button_label: 'Aktualizovat',
    update_whats_new: '["Rychlejší a stabilnější aplikace","Vylepšený program a přehled interpretů","Opravy drobných chyb"]',
    app_update_url_android: 'https://www.fmcityfest.cz/download/fmcityfest-app.apk',
    
    // Chat feature
    chat_icon_allowed: 'true',
    chat_url: 'https://widget-page.smartsupp.com/widget/d018080e30eda14c4d90516c6cbd849c698624c2',
    
    // Festival info
    festival_edition: '7',
    festival_date_from: '',
    festival_date_to: '',
  };

  /**
   * Inicializuje Remote Config s výchozími hodnotami
   * @param skipFetch - Pokud true, pouze nastaví defaultní hodnoty bez fetchování z serveru
   */
  async initialize(skipFetch: boolean = false): Promise<void> {
    try {
      // Zajisti, že Firebase je inicializován
      await ensureFirebaseInitialized();
      
      await remoteConfig().setDefaults(this.defaultConfig);
      
      if (!skipFetch) {
        await remoteConfig().fetch();
        const activated = await remoteConfig().activate();
        console.log('Remote Config activated:', activated);
      }
    } catch (error) {
      console.error('Error initializing Remote Config:', error);
      // Log to Crashlytics if available
      try {
        if (isFirebaseReady()) {
          crashlytics().recordError(error as Error);
        }
      } catch (e) {
        // Crashlytics možná ještě není inicializován
        console.error('Could not record error to Crashlytics:', e);
      }
    }
  }

  /**
   * Fetchuje a aktivuje nové hodnoty z Remote Config
   */
  async fetchAndActivate(): Promise<boolean> {
    try {
      // Zajisti, že Firebase je inicializován
      await ensureFirebaseInitialized();
      
      await remoteConfig().fetch();
      const activated = await remoteConfig().activate();
      return activated;
    } catch (error) {
      console.error('Error fetching Remote Config:', error);
      // Log to Crashlytics if available
      try {
        if (isFirebaseReady()) {
          crashlytics().recordError(error as Error);
        }
      } catch (e) {
        // Crashlytics možná není dostupný
      }
      return false;
    }
  }

  /**
   * Získá string hodnotu z Remote Config
   */
  getString(key: string, defaultValue: string = ''): string {
    try {
      if (!isFirebaseReady()) {
        console.warn('Remote Config: Firebase not ready, returning default value');
        return defaultValue;
      }
      return remoteConfig().getValue(key).asString();
    } catch (error) {
      console.error(`Error getting Remote Config string for key ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Získá boolean hodnotu z Remote Config
   */
  getBoolean(key: string, defaultValue: boolean = false): boolean {
    try {
      if (!isFirebaseReady()) {
        console.warn('Remote Config: Firebase not ready, returning default value');
        return defaultValue;
      }
      const value = remoteConfig().getValue(key);
      // Remote Config boolean může být uložen jako string "true"/"false" nebo jako boolean
      if (value.getSource() === 'static') {
        // Pokud je to default hodnota (static), použijeme defaultValue
        return defaultValue;
      }
      return value.asBoolean();
    } catch (error) {
      console.error(`Error getting Remote Config boolean for key ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Získá number hodnotu z Remote Config
   */
  getNumber(key: string, defaultValue: number = 0): number {
    try {
      if (!isFirebaseReady()) {
        console.warn('Remote Config: Firebase not ready, returning default value');
        return defaultValue;
      }
      return remoteConfig().getValue(key).asNumber();
    } catch (error) {
      console.error(`Error getting Remote Config number for key ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Získá všechny hodnoty z Remote Config jako objekt
   */
  getAll(): Record<string, string | number | boolean> {
    try {
      if (!isFirebaseReady()) {
        console.warn('Remote Config: Firebase not ready, returning empty object');
        return {};
      }
      const all = remoteConfig().getAll();
      const result: Record<string, string | number | boolean> = {};
      
      for (const [key, value] of Object.entries(all)) {
        try {
          // Zkusíme získat hodnotu jako string, number nebo boolean
          const stringValue = value.asString();
          
          // Pokud je to JSON, zkusíme parsovat
          if (stringValue.startsWith('{') || stringValue.startsWith('[')) {
            try {
              result[key] = JSON.parse(stringValue);
            } catch {
              result[key] = stringValue;
            }
          } else {
            // Zkusíme number
            const numValue = parseFloat(stringValue);
            if (!isNaN(numValue) && isFinite(numValue) && stringValue === numValue.toString()) {
              result[key] = numValue;
            } else if (stringValue === 'true' || stringValue === 'false') {
              result[key] = stringValue === 'true';
            } else {
              result[key] = stringValue;
            }
          }
        } catch {
          // Pokud selže parsing, použijeme string hodnotu
          result[key] = value.asString();
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error getting all Remote Config values:', error);
      return {};
    }
  }
}

export const remoteConfigService = new RemoteConfigService();
