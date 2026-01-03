# iOS Push Notifications Setup Guide

This guide explains how to set up push notifications for iOS using APNs (Apple Push Notification service) and FCM (Firebase Cloud Messaging).

## Prerequisites

- Apple Developer account (paid membership required)
- Firebase project with iOS app configured
- Xcode installed (latest version recommended)
- Physical iOS device for testing (push notifications don't work on simulator for iOS < 16, or require Apple Silicon Mac)

## Step 1: Create APNs Authentication Key

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click on **Keys** in the left sidebar
4. Click the **+** button to create a new key
5. Enter a name for the key (e.g., "FM City Fest APNs Key")
6. Check the box for **Apple Push Notifications service (APNs)**
7. Click **Continue** and then **Register**
8. **Important**: Download the `.p8` key file immediately (you can only download it once!)
9. Note the **Key ID** (you'll need this)
10. Note your **Team ID** (found at the top right of the Apple Developer portal)

## Step 2: Upload APNs Key to Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** (gear icon) → **Cloud Messaging** tab
4. Under **Apple app configuration**, find your iOS app (`com.fmcityfest.app`)
5. Click **Upload** under "APNs Authentication Key"
6. Upload the `.p8` file you downloaded
7. Enter the **Key ID** (from Step 1)
8. Enter the **Team ID** (from Step 1)
9. Click **Upload**

Firebase will now be able to send push notifications to iOS devices through APNs.

## Step 3: Configure Xcode Project Capabilities

After running `npx expo prebuild --platform ios` or `npm run ios`, you need to verify/add the required capabilities:

1. Run `npx expo prebuild --platform ios` to generate the iOS project (if not already done)
2. Open `ios/fmcityfestapp.xcworkspace` in Xcode (note: use `.xcworkspace`, not `.xcodeproj`)
3. Select the project in the navigator (top-level "fmcityfestapp" item)
4. Select the **fmcityfestapp** target
5. Go to the **Signing & Capabilities** tab
6. Click the **+ Capability** button and add the following if not already present:
   - **Push Notifications** - Add this capability
   - **Background Modes** - Add this capability, then check the box for **Remote notifications**

**Note**: React Native Firebase should configure these automatically, but you may need to add them manually if they're missing. These capabilities are required for push notifications to work properly.

## Step 4: Verify Info.plist

The `Info.plist` file should contain:

```xml
<key>NSUserNotificationsUsageDescription</key>
<string>We need permission to send you push notifications about important updates and events.</string>
```

This description will be shown to users when requesting notification permission.

## Step 5: Build and Test

1. Connect a physical iOS device (push notifications require a real device for iOS < 16)
2. Build and run the app: `npm run ios`
3. The app should request notification permission on first launch
4. Grant permission and check the console/logs for the FCM token

## Troubleshooting

### Push Notifications Not Working

- **Ensure you're testing on a real device**: Simulators (except iOS 16+ on Apple Silicon) don't support push notifications
- **Verify APNs key is uploaded**: Check Firebase Console → Project Settings → Cloud Messaging
- **Check capabilities in Xcode**: Ensure Push Notifications and Background Modes are enabled
- **Verify bundle ID matches**: The bundle ID in Xcode must match `com.fmcityfest.app` and match Firebase configuration
- **Check provisioning profile**: Ensure your development/distribution profile includes push notification entitlement

### APNs Key Issues

- **Can't download key again**: If you lose the `.p8` file, you'll need to create a new key and upload it to Firebase
- **Invalid Key ID or Team ID**: Double-check these values in Apple Developer portal
- **Key not working**: Ensure the key has "Apple Push Notifications service (APNs)" enabled

### Testing

To test push notifications:

1. Get the FCM token from the app (should be logged in console)
2. Go to Firebase Console → Cloud Messaging
3. Click **Send your first message**
4. Enter a title and message
5. Click **Send test message**
6. Enter the FCM token from your device
7. The notification should appear on the device

## Additional Resources

- [Firebase Cloud Messaging iOS Setup](https://firebase.google.com/docs/cloud-messaging/ios/client)
- [Apple Push Notification Service Documentation](https://developer.apple.com/documentation/usernotifications)
- [React Native Firebase Messaging](https://rnfirebase.io/messaging/usage)

