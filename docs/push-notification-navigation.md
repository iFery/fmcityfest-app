# Push Notification Navigation Guide

This guide explains how push notifications are handled in the app and how to configure notification payloads for navigation.

## Overview

The app implements push notification handling with automatic navigation to specific screens based on the notification payload. Notifications work in all app states:
- **Foreground**: Shows alert and navigates when user taps
- **Background**: Navigates when user taps notification
- **Quit/Killed**: Navigates when app is opened from notification

## Notification Payload Schema

Notifications must include a `data` payload (not just `notification`) to trigger navigation. The data payload should follow this schema:

```typescript
{
  targetScreen: 'Home' | 'Post' | 'NotificationTest',
  postId?: string,        // Required for Post screen
  itemId?: string,        // Alternative to postId
  [key: string]: string   // Additional custom data
}
```

### Required Fields

- `targetScreen`: The screen to navigate to. Must be one of: `Home`, `Post`, `NotificationTest`

### Optional Fields

- `postId` or `itemId`: Required when `targetScreen` is `Post`
- Additional custom fields: Any other string fields can be included

## Example Notification Payloads

### Navigate to Post Screen

```json
{
  "notification": {
    "title": "New Post",
    "body": "Check out this new post!"
  },
  "data": {
    "targetScreen": "Post",
    "postId": "123"
  }
}
```

### Navigate to Home Screen

```json
{
  "notification": {
    "title": "Welcome",
    "body": "Welcome to FM City Fest!"
  },
  "data": {
    "targetScreen": "Home"
  }
}
```

### Navigate to Test Screen

```json
{
  "notification": {
    "title": "Test",
    "body": "This is a test notification"
  },
  "data": {
    "targetScreen": "NotificationTest"
  }
}
```

## Sending Test Notifications

### Via Firebase Console

1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message" or "New notification"
3. Enter notification title and body
4. Click "Send test message"
5. Enter your FCM token (shown in app when it starts)
6. Click "Test" to send

**Important**: Firebase Console UI doesn't allow setting `data` payload directly. You need to use:
- Firebase Admin SDK (backend)
- Firebase Cloud Functions
- curl command (see below)

### Via curl (Command Line)

```bash
# Replace YOUR_FCM_TOKEN and YOUR_SERVER_KEY with actual values
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "YOUR_FCM_TOKEN",
    "notification": {
      "title": "New Post",
      "body": "Check out this new post!"
    },
    "data": {
      "targetScreen": "Post",
      "postId": "123"
    }
  }'
```

To get your Server Key:
1. Firebase Console → Project Settings → Cloud Messaging
2. Find "Cloud Messaging API (Legacy)" → Server Key

### Via Firebase Admin SDK (Node.js)

```javascript
const admin = require('firebase-admin');

const message = {
  notification: {
    title: 'New Post',
    body: 'Check out this new post!',
  },
  data: {
    targetScreen: 'Post',
    postId: '123',
  },
  token: 'YOUR_FCM_TOKEN',
};

admin.messaging().send(message)
  .then((response) => {
    console.log('Successfully sent message:', response);
  })
  .catch((error) => {
    console.log('Error sending message:', error);
  });
```

## Testing Scenarios

### Test 1: Foreground Notification

1. Open the app (keep it in foreground)
2. Send a notification with data payload
3. An alert should appear
4. Tap "View" to navigate to the target screen

### Test 2: Background Notification

1. Open the app, then press home button (app goes to background)
2. Send a notification
3. Tap the notification in the notification tray
4. App should open and navigate to the target screen

### Test 3: Quit State Notification

1. Force quit the app (swipe away from recent apps)
2. Send a notification
3. Tap the notification
4. App should launch and navigate to the target screen

### Test 4: Deep Link (Direct Navigation)

Test deep links directly using:

```bash
# iOS
npx uri-scheme open myapp://post/123 --ios

# Android
npx uri-scheme open myapp://post/123 --android
```

**Note**: You may need to install `uri-scheme` CLI first:
```bash
npm install -g uri-scheme
```

## Error Handling

The app handles various error scenarios:

1. **Missing `targetScreen`**: Logs warning, navigates to Home screen
2. **Invalid `targetScreen`**: Logs warning, navigates to Home screen
3. **Missing `postId` for Post screen**: Logs warning, navigates to Home screen
4. **Navigation errors**: Logs error, falls back to Home screen

All errors are logged to the console for debugging.

## Deep Linking Configuration

The app is configured with deep linking scheme `myapp://`. Routes are mapped as:

- `myapp://home` → Home screen
- `myapp://post/:postId` → Post screen with postId parameter
- `myapp://test` → NotificationTest screen

This is configured in:
- `app.json` (iOS and Android URL schemes)
- `src/navigation/AppNavigator.tsx` (React Navigation linking config)

## Background Message Handler

Background messages (when app is completely closed) are handled by a separate handler in `index.js`. This handler logs the message but doesn't perform navigation (navigation happens when user taps the notification).

## Platform-Specific Notes

### iOS

- Requires a real device for testing (simulators don't support push notifications, except iOS 16+ on Apple Silicon Macs)
- APNs key must be uploaded to Firebase Console
- Push Notifications and Background Modes capabilities must be enabled in Xcode

### Android

- Can test on emulator if it has Google Play Services
- Requires `POST_NOTIFICATIONS` permission on Android 13+
- `google-services.json` must be properly configured

## Troubleshooting

### Notification Not Navigating

1. Check that notification includes `data` payload (not just `notification`)
2. Verify `targetScreen` is one of the valid screens
3. Check console logs for warnings/errors
4. Ensure navigation ref is ready (should be automatic)

### Deep Link Not Working

1. Verify URL scheme is configured in `app.json`
2. Run `npx expo prebuild` after changing `app.json`
3. Rebuild the app (native changes require rebuild)
4. Check that the URL format matches: `myapp://post/123`

### Foreground Alert Not Showing

1. Verify notification permission is granted
2. Check that `remoteMessage.notification` exists
3. Look for errors in console

## Adding New Screens

To add a new screen that can be navigated to from notifications:

1. Add screen to `src/types/navigation.ts` (`RootStackParamList`)
2. Create screen component in `src/screens/`
3. Add route to `src/navigation/AppNavigator.tsx`
4. Update `notificationDataToRoute` in `src/services/notificationNavigation.ts` if needed
5. Add deep link mapping in `AppNavigator.tsx` linking config
6. Update this documentation

## Code Structure

```
src/
├── types/
│   └── navigation.ts          # Type definitions and schemas
├── services/
│   └── notificationNavigation.ts  # Notification to route conversion
├── navigation/
│   └── AppNavigator.tsx       # Navigation setup with deep linking
├── screens/
│   ├── HomeScreen.tsx
│   ├── PostScreen.tsx
│   └── NotificationTestScreen.tsx
App.tsx                        # Notification handlers and setup
index.js                       # Background message handler
```

