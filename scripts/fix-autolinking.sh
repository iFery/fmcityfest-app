#!/bin/bash
AUTOLINKING_FILE="android/app/build/generated/autolinking/src/main/java/com/facebook/react/ReactNativeApplicationEntryPoint.java"
if [ -f "$AUTOLINKING_FILE" ]; then
  sed -i '' 's/com\.fmcityfestapp/com.fmcityfest.app/g' "$AUTOLINKING_FILE"
fi
