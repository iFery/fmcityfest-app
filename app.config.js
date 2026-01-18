/**
 * Expo app configuration with environment variable support
 * This file replaces app.json to enable dynamic configuration
 */

module.exports = ({ config }) => {
  // Get environment from EAS build profile or default to 'development'
  const environment = process.env.EAS_BUILD_PROFILE || process.env.NODE_ENV || 'development';
  const isProduction = environment === 'production';
  const isDevelopment = environment === 'development';

  // API URL - can be overridden by EAS Secrets
  const apiUrl = process.env.API_URL || 'https://www.fmcityfest.cz/api/mobile-app';

  // Firebase configuration files
  // Build script copies files from config/firebase/{env}/ to standard locations
  // Standard locations (used by native builds):
  // - Android: android/app/google-services.json
  // - iOS: ios/FMCityFest/GoogleService-Info.plist
  const androidGoogleServicesFile = './android/app/google-services.json';
  const iosGoogleServicesFile = './ios/FMCityFest/GoogleService-Info.plist';

  return {
    ...config,
    expo: {
      ...config.expo,
      name: 'FMCityFest',
      slug: 'fmcityfest-app',
      version: '1.0.0',
      orientation: 'portrait',
      scheme: 'fmcityfest',
      icon: './assets/icon.png',
      userInterfaceStyle: 'light',
      splash: {
        image: './assets/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
      assetBundlePatterns: ['**/*'],
      ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.fmcityfest.app',
        googleServicesFile: iosGoogleServicesFile,
      },
      android: {
        adaptiveIcon: {
          foregroundImage: './assets/adaptive-icon.png',
          backgroundColor: '#ffffff',
        },
        package: 'com.fmcityfest.app',
        googleServicesFile: androidGoogleServicesFile,
      },
      web: {
        favicon: './assets/favicon.png',
      },
      plugins: [
        [
          'expo-notifications',
          {
            icon: './assets/notification-icon.png',
            color: '#ffffff',
            sounds: [],
          },
        ],
        [
          '@react-native-firebase/app',
          {
            android: {
              googleServicesFile: androidGoogleServicesFile,
            },
            ios: {
              googleServicesFile: iosGoogleServicesFile,
            },
          },
        ],
      ],
      extra: {
        eas: {
          projectId: process.env.EAS_PROJECT_ID || 'your-project-id',
        },
        // Environment variables accessible via Constants.expoConfig.extra
        apiUrl,
        environment,
        isProduction,
        isDevelopment,
      },
    },
  };
};

