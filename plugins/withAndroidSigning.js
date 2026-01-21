const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to add release signing configuration to Android build.gradle
 * This plugin automatically applies release signing config during prebuild,
 * so you don't need to manually edit build.gradle after each prebuild.
 */
const withAndroidSigning = (config) => {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      // Get version values from config
      const versionCode = config.expo?.android?.versionCode;
      const versionName = config.expo?.version;
      
      // Copy keystore and keystore.properties from config/keystore/ to android/app/ if they exist
      const rootDir = path.resolve(__dirname, '..');
      const sourceKeystore = path.join(rootDir, 'config', 'keystore', 'upload-keystore.jks');
      const sourceKeystoreProps = path.join(rootDir, 'config', 'keystore', 'keystore.properties');
      const targetKeystore = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app',
        'upload-keystore.jks'
      );
      const targetKeystoreProps = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app',
        'keystore.properties'
      );
      
      if (fs.existsSync(sourceKeystore)) {
        if (!fs.existsSync(targetKeystore) || 
            fs.statSync(sourceKeystore).mtime > fs.statSync(targetKeystore).mtime) {
          fs.copyFileSync(sourceKeystore, targetKeystore);
          console.log('✅ Copied keystore from config/keystore/ to android/app/');
        }
      } else {
        console.warn('⚠️  Keystore not found at config/keystore/upload-keystore.jks');
        console.warn('   Place your upload-keystore.jks in config/keystore/ directory');
      }
      
      // Copy keystore.properties if it exists in config/keystore/
      if (fs.existsSync(sourceKeystoreProps)) {
        if (!fs.existsSync(targetKeystoreProps) || 
            fs.statSync(sourceKeystoreProps).mtime > fs.statSync(targetKeystoreProps).mtime) {
          fs.copyFileSync(sourceKeystoreProps, targetKeystoreProps);
          console.log('✅ Copied keystore.properties from config/keystore/ to android/app/');
        }
      } else if (!fs.existsSync(targetKeystoreProps)) {
        console.warn('⚠️  keystore.properties not found');
        console.warn('   Create config/keystore/keystore.properties with your signing credentials');
      }
      
      const buildGradlePath = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app',
        'build.gradle'
      );

      if (!fs.existsSync(buildGradlePath)) {
        console.warn('⚠️  build.gradle not found, skipping signing config');
        return modConfig;
      }

      let content = fs.readFileSync(buildGradlePath, 'utf8');

      // Check if changes are already applied
      if (
        content.includes('def keystorePropertiesFile = file("keystore.properties")') &&
        content.includes('signingConfig signingConfigs.release')
      ) {
        console.log('✅ Release signing configuration already applied');
        // Still update version if needed
        if (versionCode !== undefined || versionName) {
          let needsUpdate = false;
          if (versionCode !== undefined && !content.match(new RegExp(`versionCode\\s+${versionCode}`))) {
            content = content.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
            needsUpdate = true;
          }
          if (versionName && !content.includes(`versionName "${versionName}"`)) {
            content = content.replace(/versionName\s+"[^"]+"/, `versionName "${versionName}"`);
            needsUpdate = true;
          }
          if (needsUpdate) {
            fs.writeFileSync(buildGradlePath, content, 'utf8');
            console.log(`   Updated version: ${versionName || 'N/A'} (Code: ${versionCode || 'N/A'})`);
          }
        }
        return modConfig;
      }

      console.log('📝 Applying release signing configuration to build.gradle...');

      // 2. Add keystore properties loading after plugins
      if (!content.includes('def keystorePropertiesFile = file("keystore.properties")')) {
        // Add after react plugin
        content = content.replace(
          /(apply plugin: "com\.facebook\.react"\n)/,
          `$1\n// Load keystore properties if the file exists\ndef keystorePropertiesFile = file("keystore.properties")\ndef keystoreProperties = new Properties()\nif (keystorePropertiesFile.exists()) {\n    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))\n}\n\n`
        );
      }

      // 3. Add release signing config
      if (!content.includes('signingConfigs.release')) {
        // Check if release config already exists in signingConfigs block
        const signingConfigsMatch = content.match(/(signingConfigs\s+\{[\s\S]*?)(\n\s*\})/);
        if (signingConfigsMatch && !signingConfigsMatch[1].includes('release {')) {
          const releaseConfig = `
        release {
            // Try to load from keystore.properties first, then fall back to project properties
            def storeFileProp = keystoreProperties['MYAPP_UPLOAD_STORE_FILE'] ?: findProperty('MYAPP_UPLOAD_STORE_FILE')
            if (storeFileProp) {
                storeFile file(storeFileProp)
                storePassword keystoreProperties['MYAPP_UPLOAD_STORE_PASSWORD'] ?: findProperty('MYAPP_UPLOAD_STORE_PASSWORD')
                keyAlias keystoreProperties['MYAPP_UPLOAD_KEY_ALIAS'] ?: findProperty('MYAPP_UPLOAD_KEY_ALIAS')
                keyPassword keystoreProperties['MYAPP_UPLOAD_KEY_PASSWORD'] ?: findProperty('MYAPP_UPLOAD_KEY_PASSWORD')
            }
        }`;
          
          // Replace the closing brace of signingConfigs with release config + closing brace
          content = content.replace(
            /(signingConfigs\s+\{[\s\S]*?debug\s+\{[^}]*\})\s*(\n\s*\})/,
            `$1${releaseConfig}$2`
          );
        }
      }

      // 4. Change release buildType to use release signing
      if (content.includes('signingConfig signingConfigs.debug') && content.includes('buildTypes')) {
        content = content.replace(
          /(\s+release \{[^}]*?signingConfig )signingConfigs\.debug/m,
          '$1signingConfigs.release'
        );
      }

      // Note: Firebase Crashlytics plugin is handled by @react-native-firebase/crashlytics automatically

      // 6. Update versionCode and versionName from app.config.js
      if (versionCode !== undefined) {
        // Replace versionCode if it exists
        content = content.replace(
          /versionCode\s+\d+/,
          `versionCode ${versionCode}`
        );
        // If versionCode doesn't exist, add it after versionName
        if (!content.includes('versionCode')) {
          content = content.replace(
            /(versionName\s+"[^"]+")\n/,
            `$1\n        versionCode ${versionCode}\n`
          );
        }
      }
      
      if (versionName) {
        // Replace versionName
        content = content.replace(
          /versionName\s+"[^"]+"/,
          `versionName "${versionName}"`
        );
        // If versionName doesn't exist, add it
        if (!content.includes('versionName')) {
          content = content.replace(
            /(versionCode\s+\d+)\n/,
            `$1\n        versionName "${versionName}"\n`
          );
        }
      }

      fs.writeFileSync(buildGradlePath, content, 'utf8');
      console.log('✅ Release signing configuration applied successfully');
      if (versionCode !== undefined || versionName) {
        console.log(`   Version: ${versionName || 'N/A'} (Code: ${versionCode || 'N/A'})`);
      }

      return modConfig;
    },
  ]);
};

module.exports = withAndroidSigning;
