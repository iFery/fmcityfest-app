/**
 * Expo app configuration with environment variable support
 * This file replaces app.json to enable dynamic configuration
 */

const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  // Environment detection priority:
  // 1. APP_ENV (explicit control - set in package.json scripts)
  // 2. EAS_BUILD_PROFILE (EAS cloud builds)
  // 3. NODE_ENV (fallback)
  // 4. .xcode-build-env marker file (created by xcode-firebase-config.sh for Xcode builds)
  // 5. Auto-detect from Firebase config comparison (if prod Firebase config matches)
  // 6. 'development' (default fallback)
  //
  // WORKFLOW SUMMARY:
  // - Development: npx expo run:android | run:ios (automatically sets APP_ENV=development)
  // - Production Android: npm run build:aab (automatically sets APP_ENV=production)
  // - Production iOS: npm run build:ios:prod (sets APP_ENV=production, then build in Xcode)
  //   OR: Build directly in Xcode with Release config (xcode-firebase-config.sh will copy prod config)
  //
  // NOTE: app.config.js automatically copies correct Firebase config based on detected environment
  
  const rootDir = path.resolve(__dirname);
  let environment = process.env.APP_ENV || 
                    process.env.EAS_BUILD_PROFILE || 
                    process.env.NODE_ENV;
  
  // Auto-detect from Xcode build marker file if environment is not explicitly set
  // This handles the case when Xcode build script sets environment but APP_ENV is not set
  if (!environment) {
    const xcodeEnvMarker = path.join(rootDir, '.xcode-build-env');
    if (fs.existsSync(xcodeEnvMarker)) {
      try {
        const markerContent = fs.readFileSync(xcodeEnvMarker, 'utf8').trim();
        if (markerContent === 'production' || markerContent === 'development') {
          environment = markerContent;
          console.log(`✅ [app.config.js] Detected environment from Xcode build marker: ${environment}`);
        }
      } catch (_e) {
        // If reading marker fails, continue to Firebase config detection
      }
    }
  }
  
  // Auto-detect from Firebase config if environment is still not set
  // This handles the case when Xcode build script copies prod Firebase config
  // but APP_ENV is not set and marker file doesn't exist
  if (!environment) {
    try {
      const iosConfigPath = path.join(rootDir, 'GoogleService-Info.plist');
      const prodConfigPath = path.join(rootDir, 'config', 'firebase', 'prod', 'GoogleService-Info.plist');
      
      if (fs.existsSync(iosConfigPath) && fs.existsSync(prodConfigPath)) {
        // Read both configs and compare project_id
        const iosConfigContent = fs.readFileSync(iosConfigPath, 'utf8');
        const prodConfigContent = fs.readFileSync(prodConfigPath, 'utf8');
        
        // Extract PROJECT_ID from plist (simple regex match for PLIST_BUCKET format)
        const extractProjectId = (content) => {
          const match = content.match(/<key>PROJECT_ID<\/key>\s*<string>([^<]+)<\/string>/);
          return match ? match[1] : null;
        };
        
        const currentProjectId = extractProjectId(iosConfigContent);
        const prodProjectId = extractProjectId(prodConfigContent);
        
        if (currentProjectId && prodProjectId && currentProjectId === prodProjectId) {
          environment = 'production';
          console.log(`✅ [app.config.js] Auto-detected PRODUCTION environment from Firebase config (project_id: ${currentProjectId})`);
        }
      }
    } catch (e) {
      // If detection fails, fall back to development
      console.warn(`⚠️  [app.config.js] Could not auto-detect environment from Firebase config: ${e.message}`);
    }
  }
  
  // Final fallback to development
  environment = environment || 'development';  
  const isProduction = environment === 'production';
  const isDevelopment = environment === 'development';
  
  // Automatically copy correct Firebase config files to root directory
  // This ensures correct config is used even when running `npx expo run:android` directly
  // CRITICAL: This runs BEFORE plugins, so Firebase plugin will use the correct config
  const envFolder = isProduction ? 'prod' : 'dev';
  const configDir = path.join(rootDir, 'config', 'firebase', envFolder);
  const androidTarget = path.join(rootDir, 'google-services.json');
  const iosTarget = path.join(rootDir, 'GoogleService-Info.plist');
  const androidSource = path.join(configDir, 'google-services.json');
  const iosSource = path.join(configDir, 'GoogleService-Info.plist');
  
  // Copy Android config - ALWAYS copy to ensure correct config is used
  if (fs.existsSync(androidSource)) {
    // Check if target exists and has different project_id (to avoid unnecessary copies)
    let shouldCopy = true;
    if (fs.existsSync(androidTarget)) {
      try {
        const targetContent = JSON.parse(fs.readFileSync(androidTarget, 'utf8'));
        const sourceContent = JSON.parse(fs.readFileSync(androidSource, 'utf8'));
        if (targetContent.project_info?.project_id === sourceContent.project_info?.project_id) {
          shouldCopy = false; // Already correct
        }
    } catch (_e) {
      // If parsing fails, copy anyway
      shouldCopy = true;
      }
    }
    
    if (shouldCopy) {
      fs.copyFileSync(androidSource, androidTarget);
      console.log(`✅ [app.config.js] Copied ${envFolder} Firebase config: google-services.json`);
    }
    
    // CRITICAL: Also copy to android/app/ if it exists (for when android/ folder already exists)
    // This ensures correct config is used even when prebuild doesn't run
    const androidAppDir = path.join(rootDir, 'android', 'app');
    const androidAppTarget = path.join(androidAppDir, 'google-services.json');
    if (fs.existsSync(androidAppDir)) {
      fs.copyFileSync(androidSource, androidAppTarget);
      console.log(`✅ [app.config.js] Copied ${envFolder} Firebase config to android/app/: google-services.json`);
    }
  }
  
  // Copy iOS config - ALWAYS copy to ensure correct config is used
  if (fs.existsSync(iosSource)) {
    fs.copyFileSync(iosSource, iosTarget);
    console.log(`✅ [app.config.js] Copied ${envFolder} Firebase config: GoogleService-Info.plist`);
    
    // CRITICAL: Also copy to iOS project if it exists (for when ios/ folder already exists)
    // This ensures correct config is used even when prebuild doesn't run
    const iosDir = path.join(rootDir, 'ios');
    if (fs.existsSync(iosDir)) {
      // Try common iOS project locations - copy to ALL found locations
      const possibleIOSTargets = [
        path.join(iosDir, 'FMCityFest', 'GoogleService-Info.plist'),
        path.join(iosDir, 'GoogleService-Info.plist'),
      ];
      
      // Copy to all found iOS project locations (not just first)
      for (const iosAppTarget of possibleIOSTargets) {
        const iosAppDir = path.dirname(iosAppTarget);
        if (fs.existsSync(iosAppDir)) {
          fs.copyFileSync(iosSource, iosAppTarget);
          console.log(`✅ [app.config.js] Copied ${envFolder} Firebase config to iOS: ${path.relative(rootDir, iosAppTarget)}`);
        }
      }
    }
  }

  // API URL - can be overridden by EAS Secrets
  const apiUrl = process.env.API_URL || 'https://www.fmcityfest.cz/api/mobile-app';
  const feedbackApiUrl = process.env.FEEDBACK_API_URL || 'https://www.fmcityfest.cz/api/mobile-app/feedback-form.php';
  const feedbackApiKey = process.env.FEEDBACK_API_KEY || 'dev-feedback-key';

  // Firebase configuration files
  // Build script copies files from config/firebase/{env}/ to root
  // Firebase plugin copies them to correct native folders during prebuild:
  // - Android: ./google-services.json (root) → android/app/google-services.json
  // - iOS: ./GoogleService-Info.plist (root) → ios/{project}/GoogleService-Info.plist
  const androidGoogleServicesFile = './google-services.json';
  const iosGoogleServicesFile = './GoogleService-Info.plist';


  const enableFirebase = process.env.SKIP_FIREBASE !== '1';

  return {
    ...config,
    ios: {
      appDelegateLanguage: 'objc',
    },
    expo: {
      ...config.expo,
      name: 'FM CITY FEST',
      slug: 'fmcityfest-app',
      version: '1.1.6',
      orientation: 'portrait',
      scheme: 'fmcityfest',
      icon: './assets/icon.png',
      userInterfaceStyle: 'light',
      splash: {
        image: './assets/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#002239',
      },
      assetBundlePatterns: ['**/*'],
      ios: {
        supportsTablet: false,
        bundleIdentifier: 'com.fmcityfest.app',
        googleServicesFile: iosGoogleServicesFile,
      },
      android: {
        adaptiveIcon: {
          foregroundImage: './assets/adaptive-icon.png',
          backgroundColor: '#002239',
        },
        package: 'com.fmcityfest.app',
        googleServicesFile: androidGoogleServicesFile,
        versionCode: 28, // Increment this for each release to Google Play
        permissions: [
          // Keep Expo defaults for scheduling local notifications in release builds
          'android.permission.POST_NOTIFICATIONS',
          'android.permission.WAKE_LOCK',
          'android.permission.RECEIVE_BOOT_COMPLETED',
          'com.google.android.gms.permission.AD_ID', // Required for advertising ID usage (Android 13+)
        ],
      },
      androidNavigationBar: {
        backgroundColor: '#092533',
        barStyle: 'light-content',
        enforceContrast: false,
      },
      web: {
        favicon: './assets/favicon.png',
      },
      plugins: [
        'expo-asset',
        'expo-font',

        [
          'expo-build-properties',
          {
            android: {
              // Google Play requirement: targetSdkVersion 35 (Android 15) from August 31, 2025
              compileSdkVersion: 35,
              targetSdkVersion: 35, // KRITICKÉ - požadavek Google Play
              buildToolsVersion: '35.0.0',
              minSdkVersion: 24, // Expo SDK 52 default (was 23 in SDK 51)
            },
            ios: {
              // Force Objective-C AppDelegate for Firebase compatibility
              // Firebase plugin requires Objective-C, not Swift
              // Expo SDK 52 requires iOS 15.1+ (was 13.4 in SDK 51)
              deploymentTarget: '15.1',
            },
          },
        ],
        [
          'expo-notifications',
          {
            icon: './assets/notification-icon.png',
            color: '#002239',
            sounds: [],
          },
        ],

        ...(enableFirebase
          ? [
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
              './plugins/withSwiftFirebaseAppDelegate.js',
            ]
          : []),

        // Custom plugin to ensure AD_ID permission is added to AndroidManifest.xml
        './plugins/withAndroidAdIdPermission.js',
        // Custom plugin to configure iOS app settings (display name, category, capabilities)
        './plugins/withIosAppConfig.js',
        // Custom plugin to add use_modular_headers! to Podfile (Firebase Swift pods)
        './plugins/withIosModularHeaders.js',
        // Custom plugin to add release signing configuration
        './plugins/withAndroidSigning.js',
        // Custom plugin to add Firebase Crashlytics Gradle plugin
        './plugins/withAndroidCrashlytics.js',
        // Custom plugin to fix AndroidManifest merge conflict for FCM notification color
        './plugins/withAndroidManifestFix.js',
      ],
      extra: {
        eas: {
          projectId: process.env.EAS_PROJECT_ID || 'your-project-id',
        },
        // Environment variables accessible via Constants.expoConfig.extra
        apiUrl,
        feedbackApiUrl,
        feedbackApiKey,
        environment,
        isProduction,
        isDevelopment,
      },
    },
  };
};
