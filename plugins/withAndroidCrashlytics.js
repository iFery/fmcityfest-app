const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to add Firebase Crashlytics Gradle plugin
 * This plugin automatically configures Crashlytics during prebuild,
 * ensuring the build ID is generated correctly.
 */
const withAndroidCrashlytics = (config) => {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const platformRoot = modConfig.modRequest.platformProjectRoot;
      
      // 1. Add Crashlytics plugin classpath to root build.gradle
      const rootBuildGradlePath = path.join(platformRoot, 'build.gradle');
      
      if (!fs.existsSync(rootBuildGradlePath)) {
        console.warn('⚠️  android/build.gradle not found, skipping Crashlytics config');
        return modConfig;
      }

      let rootBuildGradle = fs.readFileSync(rootBuildGradlePath, 'utf8');

      // Check if Crashlytics classpath already exists
      if (!rootBuildGradle.includes('firebase-crashlytics-gradle')) {
        console.log('📝 Adding Firebase Crashlytics classpath to android/build.gradle...');
        
        // Add classpath after google-services
        if (rootBuildGradle.includes('com.google.gms:google-services')) {
          rootBuildGradle = rootBuildGradle.replace(
            /(classpath\s+['"]com\.google\.gms:google-services[^'"]+['"])/,
            "$1\n        classpath 'com.google.firebase:firebase-crashlytics-gradle:3.0.2'"
          );
        } else {
          // Add it at the beginning of dependencies block
          rootBuildGradle = rootBuildGradle.replace(
            /(dependencies\s+\{)/,
            "$1\n        classpath 'com.google.firebase:firebase-crashlytics-gradle:3.0.2'"
          );
        }

        fs.writeFileSync(rootBuildGradlePath, rootBuildGradle, 'utf8');
        console.log('✅ Added Crashlytics classpath to android/build.gradle');
      }

      // 2. Apply Crashlytics plugin in app/build.gradle
      const appBuildGradlePath = path.join(platformRoot, 'app', 'build.gradle');

      if (!fs.existsSync(appBuildGradlePath)) {
        console.warn('⚠️  android/app/build.gradle not found, skipping Crashlytics plugin');
        return modConfig;
      }

      let appBuildGradle = fs.readFileSync(appBuildGradlePath, 'utf8');

      // Check if Crashlytics plugin already applied
      if (!appBuildGradle.includes('com.google.firebase.crashlytics')) {
        console.log('📝 Applying Firebase Crashlytics plugin to android/app/build.gradle...');
        
        // Add after google-services plugin
        if (appBuildGradle.includes("apply plugin: 'com.google.gms.google-services'")) {
          appBuildGradle = appBuildGradle.replace(
            /(apply plugin: ['"]com\.google\.gms\.google-services['"])/,
            "$1\napply plugin: 'com.google.firebase.crashlytics'"
          );
        } else if (appBuildGradle.includes('apply plugin: "com.google.gms.google-services"')) {
          appBuildGradle = appBuildGradle.replace(
            /(apply plugin: ["']com\.google\.gms\.google-services["'])/,
            '$1\napply plugin: "com.google.firebase.crashlytics"'
          );
        } else {
          // Add at the end of the file
          appBuildGradle += "\napply plugin: 'com.google.firebase.crashlytics'";
        }

        fs.writeFileSync(appBuildGradlePath, appBuildGradle, 'utf8');
        console.log('✅ Applied Crashlytics plugin to android/app/build.gradle');
      } else {
        console.log('✅ Firebase Crashlytics plugin already configured');
      }

      return modConfig;
    },
  ]);
};

module.exports = withAndroidCrashlytics;
