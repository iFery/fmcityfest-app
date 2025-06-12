import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { getApp } from '@react-native-firebase/app';
import { getMessaging } from '@react-native-firebase/messaging';

// Headless task pro zprávy na pozadí
const messagingInstance = getMessaging(getApp());
messagingInstance.setBackgroundMessageHandler(async remoteMessage => {
  console.log('Zpráva přijata na pozadí:', remoteMessage);
  // Zde můžete zpracovat data, uložit do storage apod.
});

AppRegistry.registerComponent(appName, () => App);
