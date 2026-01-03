# Android Push Notifications Setup Guide

This guide explains how to set up push notifications for Android using Firebase Cloud Messaging (FCM).

## Prerequisites

- Firebase project with Android app configured
- Android Studio or Android SDK installed
- Android device or emulator with Google Play Services (push notifications don't work on emulators without Google Play Services)
- `google-services.json` file placed in `android/app/google-services.json`

## Overview

React Native Firebase automatically handles most of the Android configuration through autolinking. However, you need to:

1. Ensure `google-services.json` is in place (already configured in `app.json`)
2. Add `POST_NOTIFICATIONS` permission for Android 13+ (API level 33+)
3. Request runtime permission in your code for Android 13+
4. Verify FCM token retrieval

## Step 1: Verify Firebase Configuration

1. Ensure `google-services.json` is in `android/app/google-services.json`
2. The file is referenced in `app.json`:
   ```json
   "android": {
     "googleServicesFile": "./android/app/google-services.json"
   }
   ```
3. Run `npx expo prebuild --platform android` to generate the Android project (if not already done)

## Step 2: Add POST_NOTIFICATIONS Permission (Android 13+)

After running `npx expo prebuild --platform android`, add the permission to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <!-- Existing permissions -->
  <uses-permission android:name="android.permission.INTERNET"/>
  
  <!-- Add this for Android 13+ (API 33+) -->
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
  
  <!-- WAKE_LOCK is automatically added by Firebase Messaging library -->
  
  <!-- ... rest of manifest ... -->
</manifest>
```

**Note**: The `POST_NOTIFICATIONS` permission is only required for Android 13 (API level 33) and above. For older Android versions, notifications work without this permission.

## Step 3: Verify Google Services Plugin

React Native Firebase and Expo should automatically configure the Google Services plugin. After prebuild, verify that `android/app/build.gradle` includes:

```gradle
apply plugin: 'com.google.gms.google-services'
```

This should be at the bottom of the file. If it's missing, add it manually.

Also verify that `android/build.gradle` includes the Google Services classpath:

```gradle
buildscript {
  dependencies {
    classpath 'com.google.gms:google-services:4.4.2' // or newer version
  }
}
```

**Note**: Expo may handle this automatically. If the build works, this is already configured.

## Step 4: Request Runtime Permission (Android 13+)

The app code in `App.tsx` already includes permission handling for Android 13+. It uses `PermissionsAndroid` to request the `POST_NOTIFICATIONS` permission at runtime.

## Step 5: Notification Channel Setup

Android 8.0+ (API level 26+) requires notification channels. React Native Firebase automatically creates a default channel. You can customize it in your code or use the default "Miscellaneous" channel.

To create a custom channel, you can use:

```typescript
import notifee from '@react-native-firebase/messaging';
// Or use React Native's PushNotificationIOS equivalent for Android

// React Native Firebase handles channels automatically
// You can customize in firebase.json if needed
```

## Step 6: Build and Test

1. Build and run the app: `npm run android`
2. On Android 13+ devices, the app will request notification permission
3. Grant permission and check the console/logs for the FCM token
4. The FCM token should be printed to the console and displayed in the app UI

## Step 7: Test Push Notifications

1. Get the FCM token from the app logs or UI
2. Go to Firebase Console → Cloud Messaging
3. Click **Send your first message**
4. Enter a title and message
5. Click **Send test message**
6. Enter the FCM token from your device
7. The notification should appear on the device

### Testing States

- **Foreground**: Notification is received and handled by `onMessage` handler
- **Background**: Notification appears in the notification tray
- **Quit/Killed**: Notification appears in the notification tray

## Troubleshooting

### FCM Token Not Received

- Ensure `google-services.json` is in the correct location
- Check that the package name in `google-services.json` matches `com.fmcityfest.app`
- Verify Google Play Services is installed and up to date on the device/emulator
- Check device logs: `adb logcat | grep -i firebase`

### Permission Not Requested (Android 13+)

- Verify `POST_NOTIFICATIONS` permission is in AndroidManifest.xml
- Check that `targetSdkVersion` is 33 or higher
- Ensure the permission request code is being called

### Notifications Not Received

- Verify FCM token is valid (check in Firebase Console)
- Ensure the app is registered in Firebase Console with the correct package name
- Check that Google Play Services is available on the device
- Verify the notification payload format is correct

### Build Errors

- Clean the build: `cd android && ./gradlew clean`
- Ensure Google Services plugin is applied correctly
- Verify all Firebase dependencies are installed: `npm list @react-native-firebase/messaging`

## React Native Firebase Configuration

React Native Firebase automatically:
- Configures the Firebase Messaging service
- Handles notification channels (uses default channel if not specified)
- Sets up message handlers for foreground, background, and quit states
- Disables Play Services notification delegation by default (to ensure `onMessage` handlers work on Android 12+)

## Additional Resources

- [Firebase Cloud Messaging Android Setup](https://firebase.google.com/docs/cloud-messaging/android/client)
- [React Native Firebase Messaging Documentation](https://rnfirebase.io/messaging/usage)
- [Android Notification Channels](https://developer.android.com/develop/ui/views/notifications/channels)

