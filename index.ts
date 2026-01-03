/**
 * Background message handler for Firebase Cloud Messaging
 * This MUST be imported/executed before the app initializes
 * Firebase auto-initializes when google-services.json/GoogleService-Info.plist are present
 */
import './index.js';

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
