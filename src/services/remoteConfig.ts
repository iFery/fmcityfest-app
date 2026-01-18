import remoteConfig from '@react-native-firebase/remote-config';
import crashlytics from '@react-native-firebase/crashlytics';

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
      await remoteConfig().setDefaults(this.defaultConfig);
      if (!skipFetch) {
        await this.fetchAndActivate();
      } else {
        console.log('Remote Config initialized with defaults only (skipping fetch)');
      }
    } catch (error) {
      console.error('Error initializing Remote Config:', error);
      try {
        crashlytics().recordError(error as Error);
      } catch (e) {
        // Crashlytics možná ještě není inicializován
        console.error('Could not record error to Crashlytics:', e);
      }
    }
  }

  /**
   * Načte a aktivuje hodnoty z Remote Config
   */
  async fetchAndActivate(): Promise<boolean> {
    try {
      await remoteConfig().fetch();
      const activated = await remoteConfig().activate();
      console.log('Remote Config activated:', activated);
      return activated;
    } catch (error) {
      console.error('Error fetching Remote Config:', error);
      crashlytics().recordError(error as Error);
      return false;
    }
  }

  /**
   * Získá string hodnotu z Remote Config
   */
  getString(key: string, defaultValue: string = ''): string {
    try {
      return remoteConfig().getValue(key).asString();
    } catch (error) {
      console.error(`Error getting Remote Config string for key ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Získá boolean hodnotu z Remote Config
   * Podporuje jak boolean hodnoty, tak string hodnoty ("true"/"false")
   */
  getBoolean(key: string, defaultValue: boolean = false): boolean {
    try {
      const value = remoteConfig().getValue(key);
      // Pokud je hodnota boolean, použij ji přímo
      if (value.getSource() === 'default' || value.getSource() === 'remote') {
        const stringValue = value.asString().toLowerCase();
        // Pokud je hodnota string "true" nebo "false", převeď ji
        if (stringValue === 'true') return true;
        if (stringValue === 'false') return false;
        // Jinak zkus použít asBoolean()
        return value.asBoolean();
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
      return remoteConfig().getValue(key).asNumber();
    } catch (error) {
      console.error(`Error getting Remote Config number for key ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Získá všechny hodnoty z Remote Config
   */
  getAll(): Record<string, any> {
    try {
      const all = remoteConfig().getAll();
      const result: Record<string, any> = {};
      
      Object.keys(all).forEach((key) => {
        const value = all[key];
        if (value.getSource() === 'remote') {
          // Pouze hodnoty z Remote Config (ne defaultní)
          result[key] = value.asString();
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error getting all Remote Config values:', error);
      return {};
    }
  }
}

export const remoteConfigService = new RemoteConfigService();

