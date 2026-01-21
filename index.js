import { registerRootComponent } from 'expo';
import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import App from './App';

// Global error handler for Firebase initialization errors
// This catches errors that might occur during module import or early initialization
if (typeof ErrorUtils !== 'undefined') {
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    // Check if it's a Firebase initialization error
    const errorMessage = error?.message || '';
    
    if (
      errorMessage.includes('No Firebase App') ||
      errorMessage.includes('has been created') ||
      errorMessage.includes('initializeApp')
    ) {
      console.warn('⚠️ [index.js] Caught Firebase initialization error globally:', errorMessage);
      // Don't crash the app - Firebase will be initialized later
      // Just log it and continue
      if (originalHandler) {
        // Call original handler for other errors
        if (!errorMessage.includes('No Firebase App')) {
          originalHandler(error, isFatal);
        }
      }
    } else {
      // For other errors, use original handler
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    }
  });
}

// Helper funkce pro bezpečnou kontrolu firebase.apps
const safeGetFirebaseAppsLength = () => {
  try {
    return firebase.apps.length;
  } catch (error) {
    const errorMessage = error?.message || '';
    if (!errorMessage.includes('No Firebase App') && !errorMessage.includes('has been created')) {
      console.warn('⚠️ [index.js] Unexpected error checking firebase.apps:', error);
    }
    return 0;
  }
};

// Registrace background message handleru pro FCM
// Musí být před registrací root komponenty
// Používáme lazy inicializaci - zkontrolujeme, zda je Firebase připravena
const setupBackgroundMessaging = async () => {
  try {
    // Počkej, až se Firebase inicializuje automaticky (max 15 sekund)
    // React Native Firebase se inicializuje automaticky z google-services.json
    let attempts = 0;
    const maxAttempts = 150; // 150 * 100ms = 15 sekund
    
    let appsLength = safeGetFirebaseAppsLength();
    
    while (appsLength === 0 && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
      appsLength = safeGetFirebaseAppsLength();
      
      if (appsLength > 0) {
        break;
      }
    }

    // Zkontrolujeme, zda je Firebase inicializována
    appsLength = safeGetFirebaseAppsLength();
    
    if (appsLength > 0) {
      try {
        messaging().setBackgroundMessageHandler(async (remoteMessage) => {
          console.log('Background notification received:', remoteMessage);
          // Zde můžete zpracovat notifikaci na pozadí
          // Např. aktualizovat lokální databázi, zobrazit lokální notifikaci, atd.
        });
      } catch (msgError) {
        console.error('❌ [index.js] Error setting background message handler:', msgError);
        // Pokračujeme - aplikace by měla fungovat
      }
    } else {
      console.warn('⚠️ [index.js] Firebase not initialized after waiting 15s, background messaging may not work');
      // Pokračujeme - aplikace by měla fungovat, ale background messaging nemusí fungovat
    }
  } catch (error) {
    console.error('❌ [index.js] Error setting up background messaging:', error);
    // Pokračujeme bez background messaging - aplikace by měla fungovat
  }
};

// Zkusíme nastavit background messaging (asynchronně, neblokuje start aplikace)
setupBackgroundMessaging().catch(err => {
  console.error('❌ [index.js] Failed to setup background messaging:', err);
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
