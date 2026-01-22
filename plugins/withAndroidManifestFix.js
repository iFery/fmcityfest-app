const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin to fix AndroidManifest.xml merge conflict for Firebase messaging notification color
 * Adds xmlns:tools namespace and tools:replace attribute to meta-data element
 * This plugin must run AFTER expo-notifications and @react-native-firebase/app plugins
 */
const withAndroidManifestFix = (config) => {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const manifestPath = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'AndroidManifest.xml'
      );

      if (!fs.existsSync(manifestPath)) {
        console.warn(`⚠️ AndroidManifest.xml not found at ${manifestPath}`);
        return modConfig;
      }

      let manifestContent = fs.readFileSync(manifestPath, 'utf8');
      const originalContent = manifestContent;

      // 1. Add xmlns:tools to manifest tag if not present
      if (!manifestContent.includes('xmlns:tools')) {
        manifestContent = manifestContent.replace(
          /<manifest\s+xmlns:android="http:\/\/schemas\.android\.com\/apk\/res\/android">/,
          '<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools">'
        );
      }

      // 2. Add tools:replace to meta-data element - use line-by-line approach for reliability
      const lines = manifestContent.split('\n');
      let lineModified = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Check if this is the notification color meta-data line
        if (line.includes('com.google.firebase.messaging.default_notification_color') && 
            line.includes('@color/notification_icon_color') &&
            !line.includes('tools:replace')) {
          // Add tools:replace before the closing />
          lines[i] = line.replace(
            /(\s*android:resource="@color\/notification_icon_color")(\s*\/>)/,
            '$1 tools:replace="android:resource"$2'
          );
          lineModified = true;
          break;
        }
      }
      
      manifestContent = lines.join('\n');

      // Only write if content changed
      if (manifestContent !== originalContent || lineModified) {
        fs.writeFileSync(manifestPath, manifestContent, 'utf8');
        console.log('✅ Fixed AndroidManifest.xml: added xmlns:tools and tools:replace for notification color');
      }

      return modConfig;
    },
  ]);
};

module.exports = withAndroidManifestFix;
