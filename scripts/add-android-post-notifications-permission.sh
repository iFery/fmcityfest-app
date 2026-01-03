#!/bin/bash

# Script to add POST_NOTIFICATIONS permission to AndroidManifest.xml
# Run this after npx expo prebuild --platform android

ANDROID_MANIFEST="android/app/src/main/AndroidManifest.xml"

if [ ! -f "$ANDROID_MANIFEST" ]; then
    echo "Error: $ANDROID_MANIFEST not found."
    echo "Please run 'npx expo prebuild --platform android' first."
    exit 1
fi

# Check if permission already exists
if grep -q "android.permission.POST_NOTIFICATIONS" "$ANDROID_MANIFEST"; then
    echo "POST_NOTIFICATIONS permission already exists in AndroidManifest.xml"
    exit 0
fi

# Add permission after INTERNET permission
if grep -q "android.permission.INTERNET" "$ANDROID_MANIFEST"; then
    # Use sed to add POST_NOTIFICATIONS permission after INTERNET
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' '/android.permission.INTERNET/a\
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
' "$ANDROID_MANIFEST"
    else
        # Linux
        sed -i '/android.permission.INTERNET/a\  <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>' "$ANDROID_MANIFEST"
    fi
    echo "Added POST_NOTIFICATIONS permission to AndroidManifest.xml"
else
    echo "Error: INTERNET permission not found. Please check AndroidManifest.xml manually."
    exit 1
fi

