import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import remoteConfig from '@react-native-firebase/remote-config';
import crashlytics from '@react-native-firebase/crashlytics';

let initializationPromise: Promise<void> | null = null;

/**
 * Zkontroluje a zajistí, že Firebase je inicializován
 * React Native Firebase se inicializuje automaticky z google-services.json / GoogleService-Info.plist
 * Ale někdy to může trvat, takže počkáme a případně zkusíme explicitní inicializaci
 * @internal - exportováno pro použití v jiných službách
 */
export const ensureFirebaseInitialized = async (): Promise<void> => {
  // Pokud už je inicializován, vrať se okamžitě
  // Kontrolujeme skutečný stav, ne jen interní flag
  try {
    // Zkusíme zkontrolovat, zda je Firebase inicializován
    // Toto může vyhodit chybu, pokud Firebase není inicializován
    const apps = firebase.apps;
    
    if (apps && apps.length > 0) {
      return;
    }
  } catch (error: any) {
    // Pokud firebase.apps vyhodí chybu (např. "No Firebase App"), pokračujeme s inicializací
    const errorMessage = error?.message || '';
    
    if (!errorMessage.includes('No Firebase App') && !errorMessage.includes('has been created')) {
      console.warn('⚠️ [firebase.ts] Unexpected error checking firebase.apps:', error);
    }
  }

  // Pokud už probíhá inicializace, počkej na ni
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // Začni novou inicializaci
  initializationPromise = (async () => {
    try {
      // Počkej, až se Firebase inicializuje automaticky (max 15 sekund)
      // React Native Firebase se inicializuje automaticky z google-services.json
      // při startu aplikace, ale může to trvat
      let attempts = 0;
      const maxAttempts = 150; // 150 * 100ms = 15 sekund
      
      // Bezpečně kontrolujeme firebase.apps (může vyhodit chybu "No Firebase App")
      // Helper funkce pro bezpečnou kontrolu
      const safeGetAppsLength = (): number => {
        try {
          const length = firebase.apps.length;
          return length;
        } catch (error: any) {
          // Pokud firebase.apps vyhodí chybu "No Firebase App", Firebase není inicializován
          const errorMessage = error?.message || '';
          
          if (!errorMessage.includes('No Firebase App') && !errorMessage.includes('has been created')) {
            console.warn('⚠️ [firebase.ts] Unexpected error checking firebase.apps:', error);
          }
          return 0;
        }
      };
      
      let appsLength = safeGetAppsLength();
      
      while (appsLength === 0 && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        
        // Zkontrolujeme znovu
        appsLength = safeGetAppsLength();
        
        if (appsLength > 0) {
          break; // Firebase je inicializován
        }
      }
      
      // Pokud jsme čekali dlouho, logneme to
      if (attempts >= maxAttempts) {
        console.warn(`⚠️ [firebase.ts] Firebase auto-initialization timeout after ${maxAttempts * 100}ms`);
      }
      
      // Finální kontrola
      appsLength = safeGetAppsLength();

      // Pokud stále není inicializován, zkus explicitní inicializaci
      if (appsLength === 0) {
        console.warn('⚠️ [firebase.ts] Firebase not auto-initialized after waiting, attempting explicit initialization');
        
        try {
          // V React Native Firebase se inicializace dělá automaticky z google-services.json
          // Pokud to nefunguje, zkusíme získat default app (což může vyhodit chybu)
          // firebase.app() vyhodí chybu, pokud není inicializován, ale zkusíme to
          try {
            firebase.app();
            // Pokud jsme sem došli, Firebase je inicializován
            return;
          } catch (appError: any) {
            // firebase.app() vyhodí chybu, pokud není inicializován
            console.error('❌ [firebase.ts] Firebase app() failed - this means Firebase is NOT initialized');
            console.error('❌ [firebase.ts] Error details:', appError?.message);
            console.error('❌ [firebase.ts] Please check google-services.json configuration');
            
            // Nehážeme error - aplikace by měla pokračovat i bez Firebase
            return; // Vrátíme se bez erroru, aplikace může pokračovat
          }
        } catch (initError: any) {
          console.error('❌ [firebase.ts] Firebase explicit initialization failed:', initError);
          // Nehážeme error - aplikace by měla pokračovat i bez Firebase
          return;
        }
      }

      // Ověř, že Firebase je skutečně inicializován
      let finalAppsLength = 0;
      try {
        finalAppsLength = firebase.apps.length;
      } catch {
        finalAppsLength = 0;
      }
      
      if (finalAppsLength === 0) {
        console.error('❌ Firebase apps array is still empty after initialization attempt');
        console.error('❌ Please check google-services.json configuration');
        // Nehážeme error - aplikace by měla pokračovat i bez Firebase
        return; // Vrátíme se bez erroru
      }

    } catch (error: any) {
      console.error('❌ [firebase.ts] Error ensuring Firebase initialization:', error);
      console.error('❌ [firebase.ts] Error details:', error?.message, error?.stack?.substring(0, 300));
      initializationPromise = null;
      // Nehážeme error - aplikace by měla pokračovat i bez Firebase
      // throw error;
    }
  })();

  return initializationPromise;
};

/**
 * Inicializuje Firebase služby
 * React Native Firebase se inicializuje automaticky z google-services.json / GoogleService-Info.plist
 * Ale pro jistotu zkontrolujeme a případně inicializujeme explicitně
 */
export const initializeFirebase = async (): Promise<void> => {
  try {
    // Zajisti, že Firebase je inicializován
    await ensureFirebaseInitialized();

    // Ověř, že Firebase je skutečně připraven
    if (!isFirebaseReady()) {
      console.warn('⚠️ Firebase not ready after ensureFirebaseInitialized, skipping service setup');
      return;
    }

    // Inicializace Remote Config
    try {
      await remoteConfig().setConfigSettings({
        minimumFetchIntervalMillis: 3600000, // 1 hodina
      });
    } catch (rcError) {
      console.warn('⚠️ Remote Config setup failed:', rcError);
      // Remote Config není kritický, pokračujeme
    }

    // Inicializace Crashlytics
    try {
      crashlytics().setCrashlyticsCollectionEnabled(true);
    } catch (crashlyticsError) {
      console.warn('⚠️ Crashlytics setup failed:', crashlyticsError);
      // Crashlytics není kritický, pokračujeme
    }

    //console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
    // Nehážeme error, aby aplikace mohla pokračovat
    // throw error;
  }
};

/**
 * Získá Firebase app instance (s kontrolou inicializace)
 */
export const getFirebaseApp = async () => {
  await ensureFirebaseInitialized();
  return firebase.app();
};

/**
 * Zkontroluje, zda je Firebase inicializován
 * Kontroluje skutečný stav firebase.apps, ne jen naši interní flag
 * Tato funkce je safe - nikdy nevyhodí chybu
 */
export const isFirebaseReady = (): boolean => {
  try {
    // Kontrolujeme skutečný stav Firebase, ne jen naši interní flag
    // Firebase se může inicializovat automaticky z google-services.json
    const apps = firebase.apps;
    const length = apps?.length || 0;
    
    if (length > 0) {
      return true;
    }
    
    return false;
  } catch (error: any) {
    // Pokud kontrola vyhodí chybu (např. "No Firebase App"), Firebase není připraven
    const errorMessage = error?.message || '';
    
    if (!errorMessage.includes('No Firebase App') && !errorMessage.includes('has been created')) {
      // Pro jiné chyby logujeme varování
      console.warn('⚠️ [firebase.ts] Error checking Firebase ready state:', error);
    }
    return false;
  }
};

/**
 * Získá Firebase Messaging instance (s kontrolou inicializace)
 */
export const getFirebaseMessaging = async () => {
  await ensureFirebaseInitialized();
  if (!isFirebaseReady()) {
    throw new Error('Firebase not ready after initialization');
  }
  return messaging();
};

/**
 * Bezpečné volání Firebase Messaging funkce
 * Automaticky čeká na inicializaci před voláním a retry při chybě
 */
export const safeMessagingCall = async <T>(
  fn: (msg: ReturnType<typeof messaging>) => Promise<T> | T,
  retries: number = 2
): Promise<T | null> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await ensureFirebaseInitialized();
      if (!isFirebaseReady()) {
        if (attempt < retries) {
          console.warn(`Firebase not ready, retrying... (attempt ${attempt + 1}/${retries + 1})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        console.warn('Firebase not ready after retries, skipping messaging call');
        return null;
      }
      
      const result = await fn(messaging());
      return result;
    } catch (error: any) {
      const errorMessage = error?.message || '';
      
      // Check if it's the "No Firebase App" error
      if (
        (errorMessage.includes('No Firebase App') ||
         errorMessage.includes('has been created') ||
         errorMessage.includes('initializeApp')) &&
        attempt < retries
      ) {
        console.warn(`Firebase not initialized, retrying... (attempt ${attempt + 1}/${retries + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        await ensureFirebaseInitialized();
        continue;
      }
      
      // If it's a different error or we've exhausted retries, return null
      console.error('Error in safeMessagingCall:', error);
      return null;
    }
  }
  
  return null;
};

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
