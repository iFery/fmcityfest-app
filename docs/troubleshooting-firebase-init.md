# Troubleshooting Firebase Initialization

If you see the error: `No Firebase App '[DEFAULT]' has been created - call firebase.initializeApp()`

## Cause

React Native Firebase auto-initializes when the configuration files are present and properly configured. This error typically means:

1. Configuration files are missing or in the wrong location
2. The app hasn't been rebuilt after adding config files
3. Config files are not being picked up by the native build

## Solution

### Step 1: Verify Configuration Files Exist

Check that the files are in the correct locations:

```bash
# iOS
ls -la ios/GoogleService-Info.plist

# Android
ls -la android/app/google-services.json
```

### Step 2: Verify app.json Configuration

Ensure `app.json` references the config files:

```json
{
  "expo": {
    "ios": {
      "googleServicesFile": "./ios/GoogleService-Info.plist"
    },
    "android": {
      "googleServicesFile": "./android/app/google-services.json"
    }
  }
}
```

### Step 3: Rebuild the App

After adding or updating config files, you must rebuild:

```bash
# Clean build
npx expo prebuild --clean

# Then rebuild (full native rebuild required)
npm run android  # or npm run ios
```

**Important**: 
- Simply restarting Metro bundler is NOT enough - you need a full native rebuild
- The app must be completely rebuilt, not just refreshed
- Close the app completely and rebuild from scratch if you're still seeing the error

### Step 4: Verify Package Name / Bundle ID

Ensure the package name (Android) and bundle ID (iOS) in the config files match your app configuration:

- Android: Check `android/app/build.gradle` - `applicationId` should match the package in `google-services.json`
- iOS: Check `app.json` - `bundleIdentifier` should match the bundle ID in `GoogleService-Info.plist`

### Step 5: Check Native Build Logs

Look for Firebase-related errors in the build logs:

```bash
# Android
cd android && ./gradlew clean && ./gradlew :app:assembleDebug

# iOS (in Xcode)
# Check the build output for Firebase-related errors
```

## Common Issues

### Config Files Not in Git

The config files are git-ignored (as they should be). Make sure you've added them manually:
- Download from Firebase Console
- Place them in the correct locations
- Rebuild the app

### Expo Prebuild Not Run

If you're using Expo, you must run `npx expo prebuild` to generate native code with the config files integrated.

### Config Files Added After Initial Build

If you added config files after the initial build:
1. Run `npx expo prebuild --clean` (or delete `ios/` and `android/` folders)
2. Rebuild the app

### Package Name Mismatch

The package name in `google-services.json` must exactly match your Android `applicationId`. Similarly, the bundle ID in `GoogleService-Info.plist` must match your iOS `bundleIdentifier`.

## Verification

After fixing the issue, you should see:
- No Firebase initialization errors in console
- FCM token is retrieved successfully
- Firebase services work correctly

## Still Having Issues?

1. Check Firebase Console to ensure the app is properly registered
2. Verify you downloaded the correct config files for your project
3. Check React Native Firebase documentation: https://rnfirebase.io/
4. Ensure you're using compatible versions of React Native Firebase packages

