# Deep Link & Notification Navigation Test Cases

## Test Scenarios

### 1. Cold Start Deep Links

#### 1.1 Artist Deep Link (Cold Start)
- **Setup:** App completely closed
- **Action:** Open `fmcityfest://artist/123?artistName=Test%20Artist`
- **Expected:** 
  - App opens
  - After bootstrap completes, navigates to ArtistDetail screen
  - Shows artist with ID 123 and name "Test Artist"
- **Validation:** Check that navigation happens after app is ready

#### 1.2 News Deep Link (Cold Start)
- **Setup:** App completely closed
- **Action:** Open `fmcityfest://news/456?newsTitle=Test%20News`
- **Expected:**
  - App opens
  - After bootstrap completes, navigates to NewsDetail screen
  - Shows news with ID 456
- **Validation:** Check that navigation happens after app is ready

#### 1.3 Home Deep Link (Cold Start)
- **Setup:** App completely closed
- **Action:** Open `fmcityfest://home`
- **Expected:**
  - App opens
  - Navigates to HomeMain screen
- **Validation:** App opens to home screen

### 2. Deep Links While App Running

#### 2.1 Artist Deep Link (Foreground)
- **Setup:** App running, user on Home screen
- **Action:** Open `fmcityfest://artist/789?artistName=Running%20Artist`
- **Expected:**
  - App stays in foreground
  - Immediately navigates to ArtistDetail screen
- **Validation:** Navigation happens immediately

#### 2.2 Invalid Artist ID
- **Setup:** App running
- **Action:** Open `fmcityfest://artist/`
- **Expected:**
  - Navigation fails validation
  - Falls back to HomeMain screen
  - No crash
- **Validation:** Error handling works, app doesn't crash

### 3. Notification Navigation

#### 3.1 Foreground Notification Tap
- **Setup:** App in foreground, notification received
- **Action:** Tap notification with `{ artistId: "123", artistName: "Test Artist" }`
- **Expected:**
  - Notification appears
  - On tap, navigates to ArtistDetail screen
- **Validation:** Navigation works from foreground notification

#### 3.2 Background Notification Tap
- **Setup:** App in background (not killed)
- **Action:** Tap notification with `{ artistId: "456", artistName: "Background Artist" }`
- **Expected:**
  - App comes to foreground
  - Navigates to ArtistDetail screen
- **Validation:** Navigation works when app resumes from background

#### 3.3 Closed App Notification Tap
- **Setup:** App completely closed
- **Action:** Tap notification with `{ artistId: "789", artistName: "Closed Artist" }`
- **Expected:**
  - App opens
  - After bootstrap, navigates to ArtistDetail screen
- **Validation:** Navigation queues and executes after app is ready

#### 3.4 Notification with Event ID
- **Setup:** App in any state
- **Action:** Tap notification with `{ eventId: "123", artistId: "456", artistName: "Event Artist" }`
- **Expected:**
  - Navigates to ArtistDetail (not EventDetail, as EventDetail was removed)
  - Uses artistId from notification
- **Validation:** Event notifications navigate to artist correctly

#### 3.5 Invalid Notification Data
- **Setup:** App running
- **Action:** Tap notification with invalid/missing data
- **Expected:**
  - Validation fails
  - Falls back to HomeMain screen
  - No crash
- **Validation:** Error handling works

### 4. Parameter Validation

#### 4.1 Missing Artist ID
- **Setup:** Deep link or notification
- **Action:** Navigate with `{ artistName: "Test" }` but no artistId
- **Expected:**
  - Validation fails
  - Falls back to HomeMain
- **Validation:** Invalid params are caught

#### 4.2 Empty Artist ID
- **Setup:** Deep link or notification
- **Action:** Navigate with `{ artistId: "", artistName: "Test" }`
- **Expected:**
  - Validation fails
  - Falls back to HomeMain
- **Validation:** Empty IDs are rejected

#### 4.3 Missing News ID
- **Setup:** Deep link or notification
- **Action:** Navigate with `{ newsTitle: "Test" }` but no newsId
- **Expected:**
  - Validation fails
  - Falls back to HomeMain
- **Validation:** Invalid params are caught

### 5. Navigation Queue

#### 5.1 Multiple Queued Actions
- **Setup:** App starting, navigation not ready
- **Action:** 
  - Deep link received immediately
  - Notification tapped before navigation ready
- **Expected:**
  - Both actions queued
  - Last action executed (first may be overridden)
  - No errors
- **Validation:** Queue handles multiple actions

#### 5.2 Queue Drain on Ready
- **Setup:** App starting
- **Action:** Deep link received before navigation ready
- **Expected:**
  - Action queued
  - When navigation ready, action executed
  - Navigation happens correctly
- **Validation:** Queue drains when navigation becomes ready

### 6. Edge Cases

#### 6.1 Rapid Deep Links
- **Setup:** App running
- **Action:** Open multiple deep links rapidly
- **Expected:**
  - Each link processed
  - Last navigation wins
  - No crashes
- **Validation:** Rapid navigation handled gracefully

#### 6.2 Deep Link During Bootstrap
- **Setup:** App starting, bootstrap in progress
- **Action:** Open deep link
- **Expected:**
  - Deep link queued
  - Executed after bootstrap completes
- **Validation:** Deep links work during bootstrap

#### 6.3 Notification During Bootstrap
- **Setup:** App starting
- **Action:** Tap notification
- **Expected:**
  - Navigation queued
  - Executed after app ready
- **Validation:** Notifications work during bootstrap

#### 6.4 Malformed URL
- **Setup:** App running
- **Action:** Open malformed deep link URL
- **Expected:**
  - Error caught
  - Falls back to HomeMain
  - No crash
- **Validation:** Malformed URLs handled safely

### 7. Cross-Platform

#### 7.1 iOS Deep Link
- **Setup:** iOS device
- **Action:** Open deep link from Safari/other app
- **Expected:**
  - App opens
  - Navigates correctly
- **Validation:** iOS deep links work

#### 7.2 Android Deep Link
- **Setup:** Android device
- **Action:** Open deep link from browser/other app
- **Expected:**
  - App opens
  - Navigates correctly
- **Validation:** Android deep links work

#### 7.3 iOS Notification
- **Setup:** iOS device, app closed
- **Action:** Tap notification
- **Expected:**
  - App opens
  - Navigates correctly
- **Validation:** iOS notifications work

#### 7.4 Android Notification
- **Setup:** Android device, app closed
- **Action:** Tap notification
- **Expected:**
  - App opens
  - Navigates correctly
- **Validation:** Android notifications work

## Test Checklist

- [ ] Cold start deep links work
- [ ] Foreground deep links work
- [ ] Background deep links work
- [ ] Foreground notification navigation works
- [ ] Background notification navigation works
- [ ] Closed app notification navigation works
- [ ] Invalid parameters handled gracefully
- [ ] Missing parameters handled gracefully
- [ ] Navigation queue works correctly
- [ ] No race conditions
- [ ] No crashes on invalid data
- [ ] Works on iOS
- [ ] Works on Android
- [ ] Rapid navigation handled
- [ ] Malformed URLs handled

