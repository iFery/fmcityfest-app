# Deep Link & Notification Navigation Implementation

## Overview

Complete deep link and notification navigation system with:
- ✅ Cold start URL handling
- ✅ Navigation queue system
- ✅ Parameter validation
- ✅ Error handling and fallbacks
- ✅ Support for all app states (foreground, background, closed)

## Architecture

### Core Components

1. **`navigationQueue.ts`** - Queues navigation actions until React Navigation is ready
2. **`navigationValidation.ts`** - Validates and sanitizes navigation parameters
3. **`deepLinkService.ts`** - Handles initial URL and ongoing deep link events
4. **`notificationNavigation.ts`** - Processes notification payloads for navigation
5. **`AppNavigator.tsx`** - Updated to use queue system and mark navigation ready

## Implementation Details

### 1. Navigation Queue System

**File:** `src/navigation/navigationQueue.ts`

- Queues navigation actions if navigation container not ready
- Automatically drains queue when navigation becomes ready
- Prevents race conditions during app startup

**Key Methods:**
- `setReady()` - Marks navigation ready, drains queue
- `enqueue(screen, params)` - Adds action to queue or executes immediately
- `clear()` - Clears all queued actions

### 2. Parameter Validation

**File:** `src/utils/navigationValidation.ts`

- Validates required parameters before navigation
- Sanitizes parameters (trim, type conversion)
- Returns validation result with error messages

**Validation Rules:**
- ArtistDetail: Requires valid `artistId` (non-empty string)
- NewsDetail: Requires valid `newsId` (non-empty string)
- Other screens: No parameters required

### 3. Deep Link Service

**File:** `src/services/deepLinkService.ts`

- Processes initial URL on cold start (`Linking.getInitialURL()`)
- Sets up listener for deep links while app running
- Parses URLs to navigation params
- Validates and sanitizes before navigation

**URL Patterns:**
- `fmcityfest://artist/:artistId?artistName=...`
- `fmcityfest://news/:newsId?newsTitle=...`
- `fmcityfest://home`, `fmcityfest://program`, etc.

### 4. Notification Navigation

**File:** `src/services/notificationNavigation.ts`

- Processes notification data payloads
- Validates parameters
- Uses navigation queue (no timing issues)
- Works in all app states (foreground, background, closed)

**Notification Data Format:**
```typescript
{
  artistId: string;
  artistName?: string;
  eventId?: string; // Navigates to ArtistDetail using artistId
  newsId?: string;
  newsTitle?: string;
}
```

### 5. App Navigator Updates

**File:** `src/navigation/AppNavigator.tsx`

- Uses `onReady` callback to mark navigation ready
- All navigation goes through queue system
- Queue drains automatically when ready

### 6. Bootstrap Integration

**File:** `src/providers/BootstrapProvider.tsx`

- Initializes deep link service when app becomes ready
- Waits for `ready-online` or `ready-offline` state
- 1 second delay to ensure navigation container is mounted

## Flow Diagrams

### Cold Start Deep Link Flow

```
App Closed
  ↓
User taps deep link
  ↓
App starts → Bootstrap begins
  ↓
Deep link service initialized (after app ready)
  ↓
getInitialURL() called
  ↓
URL parsed → Navigation params extracted
  ↓
Params validated
  ↓
Action queued (navigation not ready yet)
  ↓
Navigation container ready → Queue drained
  ↓
Navigate to target screen
```

### Notification Tap Flow

```
Notification received
  ↓
User taps notification
  ↓
Notification listener fires
  ↓
Data extracted from notification
  ↓
parseNotificationToNavParams() called
  ↓
Params validated
  ↓
Action queued (or executed if ready)
  ↓
Navigate to target screen
```

## Error Handling

### Invalid Parameters
- Validation fails → Navigate to `HomeMain` as fallback
- Error logged to console
- No crash, graceful degradation

### Missing Parameters
- Required params missing → Navigate to `HomeMain`
- User sees home screen instead of error

### Navigation Not Ready
- Actions queued automatically
- Executed when navigation ready
- No lost navigation actions

### Malformed URLs
- Parse error caught → Navigate to `HomeMain`
- Error logged
- App continues normally

## Testing

See `DEEP_LINK_TEST_CASES.md` for comprehensive test scenarios.

**Key Test Areas:**
1. Cold start deep links
2. Foreground deep links
3. Background deep links
4. Notification navigation (all states)
5. Parameter validation
6. Error handling
7. Navigation queue
8. Cross-platform (iOS/Android)

## Usage Examples

### Deep Link Examples

```bash
# Artist detail
fmcityfest://artist/123?artistName=Test%20Artist

# News detail
fmcityfest://news/456?newsTitle=Test%20News

# Home
fmcityfest://home

# Program
fmcityfest://program
```

### Notification Payload Examples

```json
{
  "artistId": "123",
  "artistName": "Test Artist"
}

{
  "eventId": "456",
  "artistId": "123",
  "artistName": "Event Artist"
}

{
  "newsId": "789",
  "newsTitle": "Test News"
}
```

## Notes

- Navigation queue prevents race conditions
- All navigation goes through queue (even when ready)
- Validation happens before navigation
- Invalid params fallback to HomeMain
- Deep link service initializes after bootstrap completes
- Notification navigation works in all app states

