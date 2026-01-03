# iOS Push Notifications Configuration Summary

## ✅ What Has Been Configured

1. **app.json Configuration**
   - Added `NSUserNotificationsUsageDescription` in `ios.infoPlist` section
   - This will be automatically added to Info.plist when you run `npx expo prebuild` or build the app

2. **Documentation**
   - Created comprehensive setup guide: [ios-push-notifications-setup.md](./ios-push-notifications-setup.md)
   - Updated README with reference to setup guide

3. **Test Code**
   - Added FCM token retrieval code in `App.tsx`
   - Code requests permission and retrieves FCM token on iOS

## ⚠️ Manual Steps Required

### 1. Add Capabilities in Xcode (REQUIRED)

After running `npx expo prebuild --platform ios` or `npm run ios`, you **must** add capabilities in Xcode:

1. Open `ios/fmcityfestapp.xcworkspace` in Xcode (use `.xcworkspace`, not `.xcodeproj`)
2. Select the project in the navigator
3. Select the **fmcityfestapp** target
4. Go to **Signing & Capabilities** tab
5. Click **+ Capability** and add:
   - **Push Notifications**
   - **Background Modes** (then check "Remote notifications")

**Why?** Expo doesn't automatically add these capabilities. React Native Firebase requires them but doesn't add them automatically either. This is a one-time setup per project.

### 2. Create and Upload APNs Key

Follow the instructions in [ios-push-notifications-setup.md](./ios-push-notifications-setup.md) to:
1. Create APNs Authentication Key in Apple Developer Portal
2. Upload it to Firebase Console

### 3. Test on Physical Device

Push notifications require a physical iOS device (simulators don't support push notifications, except iOS 16+ on Apple Silicon Macs).

## Next Steps

1. Run `npx expo prebuild --platform ios` to generate iOS project (if not already done)
2. Open the workspace in Xcode and add the capabilities (see above)
3. Create and upload APNs key to Firebase
4. Build and test on a physical device: `npm run ios`
5. Verify FCM token is retrieved (check console/logs)

## Verification Checklist

- [ ] Capabilities added in Xcode (Push Notifications + Background Modes)
- [ ] APNs key created and uploaded to Firebase
- [ ] Info.plist contains NSUserNotificationsUsageDescription (verified after prebuild)
- [ ] App builds successfully
- [ ] Permission prompt appears on first launch
- [ ] FCM token is retrieved and logged

