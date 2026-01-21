#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Fix AndroidManifest.xml to add xmlns:tools and tools:replace for Firebase messaging notification color
 * This script should be run after expo prebuild and before gradlew build
 */
const manifestPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

if (!fs.existsSync(manifestPath)) {
  console.warn(`⚠️ AndroidManifest.xml not found at ${manifestPath}`);
  process.exit(0);
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

// 2. Fix tools:replace for notification color - use line-by-line for reliability
const lines = manifestContent.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('com.google.firebase.messaging.default_notification_color') && 
      lines[i].includes('@color/notification_icon_color') &&
      !lines[i].includes('tools:replace')) {
    lines[i] = lines[i].replace(
      'android:resource="@color/notification_icon_color"/>',
      'android:resource="@color/notification_icon_color" tools:replace="android:resource"/>'
    );
    break;
  }
}
manifestContent = lines.join('\n');

// Only write if content changed
if (manifestContent !== originalContent) {
  fs.writeFileSync(manifestPath, manifestContent, 'utf8');
  console.log('✅ Fixed AndroidManifest.xml: added xmlns:tools and tools:replace for notification color');
}
