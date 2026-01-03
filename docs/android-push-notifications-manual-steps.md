# Android Push Notifications - Manual Steps After Prebuild

After running `npx expo prebuild --platform android`, you need to manually add the `POST_NOTIFICATIONS` permission to the AndroidManifest.xml file.

## Quick Method (Using Script)

Run the provided script:

```bash
bash scripts/add-android-post-notifications-permission.sh
```

## Manual Method

1. Open `android/app/src/main/AndroidManifest.xml`
2. Find the `<uses-permission android:name="android.permission.INTERNET"/>` line
3. Add the following line right after it:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

The manifest should look like:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
  <!-- ... other permissions ... -->
</manifest>
```

## Why This is Needed

- Android 13 (API level 33) and above require the `POST_NOTIFICATIONS` permission to be declared in the manifest
- The permission must also be requested at runtime (handled in `App.tsx`)
- This permission is only required for Android 13+, but declaring it won't hurt on older versions

## Verify

After adding the permission, you can verify it's correct:

```bash
grep -i "POST_NOTIFICATIONS" android/app/src/main/AndroidManifest.xml
```

You should see:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

