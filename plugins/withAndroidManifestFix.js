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
      const manifestPaths = [
        path.join(modConfig.modRequest.platformProjectRoot, 'app', 'src', 'main', 'AndroidManifest.xml'),
        path.join(modConfig.modRequest.platformProjectRoot, 'app', 'src', 'debug', 'AndroidManifest.xml'),
      ];

      for (const manifestPath of manifestPaths) {
        if (!fs.existsSync(manifestPath)) {
          continue;
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

        // 2. Ensure meta-data element exists and has tools:replace for notification color.
        const metaName = 'com.google.firebase.messaging.default_notification_color';
        const hasMeta = manifestContent.includes(`android:name="${metaName}"`);
        const hasToolsReplace = manifestContent.includes(`android:name="${metaName}"`) &&
          manifestContent.includes('tools:replace="android:resource"');

        if (hasMeta && !hasToolsReplace) {
          // Add tools:replace to existing meta-data line.
          const lines = manifestContent.split('\n');
          let lineModified = false;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes(metaName) && line.includes('@color/notification_icon_color') && !line.includes('tools:replace')) {
              lines[i] = line.replace(
                /(\s*android:resource="@color\/notification_icon_color")(\s*\/>)/,
                '$1 tools:replace="android:resource"$2'
              );
              lineModified = true;
              break;
            }
          }

          if (lineModified) {
            manifestContent = lines.join('\n');
          }
        } else if (!hasMeta) {
          // Inject the meta-data into the application tag if missing.
          const injection =
            '\n    <meta-data android:name="com.google.firebase.messaging.default_notification_color" android:resource="@color/notification_icon_color" tools:replace="android:resource" />\n';
          if (manifestContent.includes('<application') && manifestContent.includes('</application>')) {
            manifestContent = manifestContent.replace(/<application([^>]*)>/, '<application$1>' + injection);
          }
        }

        // Only write if content changed
        if (manifestContent !== originalContent) {
          fs.writeFileSync(manifestPath, manifestContent, 'utf8');
          console.log(`✅ Fixed AndroidManifest.xml: added xmlns:tools and tools:replace for notification color (${path.relative(modConfig.modRequest.platformProjectRoot, manifestPath)})`);
        }
      }

      return modConfig;
    },
  ]);
};

module.exports = withAndroidManifestFix;
