import { registerRootComponent } from 'expo';
import messaging from '@react-native-firebase/messaging';
import App from './App';

// Registrace background message handleru pro FCM
// Musí být před registrací root komponenty
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Background notification received:', remoteMessage);
  // Zde můžete zpracovat notifikaci na pozadí
  // Např. aktualizovat lokální databázi, zobrazit lokální notifikaci, atd.
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

