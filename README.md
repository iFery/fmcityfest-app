# FM City Fest App

React Native mobile application (iOS & Android) built with Expo, TypeScript, and Firebase.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **iOS Development** (macOS only):
  - Xcode (latest version)
  - CocoaPods: `sudo gem install cocoapods`
  - iOS Simulator (via Xcode)
- **Android Development**:
  - Android Studio
  - Android SDK
  - Android Emulator (via Android Studio)
- **Firebase Account**: [Firebase Console](https://console.firebase.google.com)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fmcityfest-app
```

### 2. Install Dependencies

```bash
npm install
```

For iOS, install CocoaPods dependencies:

```bash
cd ios
pod install
cd ..
```

### 3. Firebase Setup

**Note**: Firebase configuration files are required for native builds (iOS/Android) and Firebase features. You can run the app in Expo Go without them, but native Firebase features (push notifications, etc.) will not work.

#### iOS Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create a new one)
3. Go to **Project Settings** (gear icon) → **Your apps**
4. Add an iOS app if not already added
   - Bundle ID: `com.fmcityfest.app`
5. Download `GoogleService-Info.plist`
6. Copy it to: `ios/GoogleService-Info.plist`
7. After adding the file, update `app.json` to include:
   ```json
   "ios": {
     "googleServicesFile": "./ios/GoogleService-Info.plist"
   }
   ```

#### Android Configuration

1. In the same Firebase project, add an Android app:
   - Package name: `com.fmcityfest.app`
2. Download `google-services.json`
3. Copy it to: `android/app/google-services.json`
4. After adding the file, update `app.json` to include:
   ```json
   "android": {
     "googleServicesFile": "./android/app/google-services.json"
   }
   ```

**Note**: 
- Example files (`.example`) are provided in `ios/` and `android/app/` directories for reference
- These config files are git-ignored for security reasons
- After adding the config files and updating `app.json`, run `npx expo prebuild --clean` to regenerate native code with Firebase integration

### 4. Run the App

#### Development Server

```bash
npm start
```

This starts the Expo development server. Then:

- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app (for physical devices)

#### Platform-Specific Commands

```bash
# iOS
npm run ios

# Android
npm run android

# Web (if needed)
npm run web
```

## Project Structure

```
fmcityfest-app/
├── android/              # Android native code
├── ios/                  # iOS native code
├── assets/               # Images, fonts, etc.
├── src/                  # Source code (to be organized)
│   ├── api/             # API clients
│   ├── components/      # Reusable components
│   ├── features/        # Feature modules
│   ├── navigation/      # Navigation config
│   ├── screens/         # Screen components
│   ├── services/        # Business logic services
│   ├── state/           # Redux store & slices
│   └── utils/           # Utility functions
├── App.tsx              # Main app component
├── app.json             # Expo configuration
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

## Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint and fix issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Technology Stack

- **Framework**: React Native (via Expo)
- **Language**: TypeScript
- **State Management**: Redux Toolkit (to be configured)
- **Navigation**: React Navigation (to be configured)
- **Firebase Services**:
  - Cloud Messaging (FCM) for push notifications
  - Remote Config for feature flags
  - Crashlytics for crash reporting
  - Analytics for user analytics
- **Code Quality**: ESLint + Prettier

## Development

### Code Style

This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting

Run linting and formatting before committing:

```bash
npm run lint:fix
npm run format
```

### Building for Production

For production builds, use EAS Build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Firebase Services Setup

### Push Notifications

- Configured via Firebase Cloud Messaging (FCM)
- Requires APNs key for iOS (upload to Firebase Console)
- See Firebase documentation for detailed setup

### Remote Config

- Used for feature flags and minimum app version enforcement
- Configure parameters in Firebase Console → Remote Config

### Crashlytics

- Automatic crash reporting
- View crashes in Firebase Console → Crashlytics

### Analytics

- Automatic event tracking
- View analytics in Firebase Console → Analytics

## Troubleshooting

### iOS Build Issues

- Ensure CocoaPods are installed: `sudo gem install cocoapods`
- Run `pod install` in the `ios/` directory
- Clean build folder in Xcode: Product → Clean Build Folder
- Reset Metro bundler cache: `npm start -- --reset-cache`

### Android Build Issues

- Ensure Android SDK is properly installed
- Check that `ANDROID_HOME` environment variable is set
- Clean Gradle cache: `cd android && ./gradlew clean`

### Firebase Not Working

- Verify `GoogleService-Info.plist` (iOS) and `google-services.json` (Android) are in the correct locations
- Ensure bundle ID / package name matches Firebase project configuration
- Check Firebase Console to verify the app is registered

### Metro Bundler Issues

- Clear cache: `npm start -- --reset-cache`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and tests: `npm run lint`
4. Commit your changes
5. Push to the branch
6. Create a Pull Request

## License

[Add your license here]

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Native Firebase Documentation](https://rnfirebase.io/)
- [Firebase Console](https://console.firebase.google.com)

