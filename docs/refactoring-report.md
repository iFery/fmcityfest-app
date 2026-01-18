# 🔍 FMCityFest App - Architecture Review & Refactoring Report

**Date**: 2024  
**Reviewer**: Senior Mobile Software Architect  
**Scope**: Deep systematic review for production readiness (10k+ users)

---

## 📊 Executive Summary

The codebase shows **good foundational structure** with clean service separation, but lacks critical production-ready patterns. The app is currently in early development with mock data and missing core infrastructure.

### Critical Findings
- ✅ **Strengths**: Clean service layer, TypeScript, good navigation structure
- ⚠️ **Critical**: No API client, Zustand installed but unused, no error boundaries
- ⚠️ **High Priority**: Missing state management, no deep linking, notification navigation incomplete

---

## 1️⃣ Project Structure & Architecture

### Current Structure
```
src/
├── components/        ✅ Good separation
├── navigation/        ✅ Clean navigation setup
├── screens/           ⚠️ Mixed concerns (data fetching in screens)
├── services/          ✅ Well-structured service layer
└── utils/             ✅ Basic utilities
```

### Issues Identified

#### ❌ P0 - Critical Issues

1. **Missing API Layer**
   - No centralized API client
   - No network error handling
   - Data fetching scattered in components
   - **Impact**: Cannot scale, difficult to maintain, no retry logic

2. **State Management Not Utilized**
   - Zustand installed but unused
   - All state is local (`useState` in components)
   - Favorites stored nowhere (will be lost on app restart)
   - **Impact**: Poor UX, data loss, prop drilling risk

3. **No Error Boundaries**
   - Uncaught errors will crash entire app
   - No graceful degradation
   - **Impact**: Poor user experience, increased crash rate

#### ⚠️ P1 - High Priority

4. **App Initialization Complexity**
   - Large `useEffect` in `App.tsx`
   - Error handling could be improved
   - No initialization state management
   - **Impact**: Race conditions possible, hard to debug

5. **Notification Navigation Missing**
   - Notification tap handler doesn't navigate
   - No deep linking setup
   - **Impact**: Broken user flow from notifications

#### 🔶 P2 - Medium Priority

6. **Type Safety Gaps**
   - Some `any` types (`notificationListeners: any`)
   - Missing shared type definitions
   - **Impact**: Reduced type safety, harder refactoring

7. **Component Performance**
   - Inline functions/objects causing re-renders
   - No memoization
   - Missing `React.memo` where beneficial
   - **Impact**: Unnecessary renders, battery drain

---

## 2️⃣ State Management

### Current State
- ❌ **Zustand installed but unused**
- ❌ **All state is local** (`useState` in screens)
- ❌ **No persistence** for favorites
- ❌ **No global app state** (loading, errors, user preferences)

### What Should Be Global vs Local

**Global State (Zustand)**:
- ✅ Favorites (events, artists)
- ✅ App initialization status
- ✅ User preferences (notifications enabled, theme)
- ✅ Cached API data (optional, for offline support)

**Local State (useState)**:
- ✅ Screen-specific loading states
- ✅ Form inputs
- ✅ UI-only state (modal visibility, dropdowns)
- ✅ Temporary selections

### Recommended Store Structure
```typescript
// stores/appStore.ts
interface AppStore {
  isInitialized: boolean;
  initError: string | null;
  // ...
}

// stores/favoritesStore.ts
interface FavoritesStore {
  favoriteEvents: string[];
  favoriteArtists: string[];
  toggleEventFavorite: (id: string) => void;
  // ...
}
```

---

## 3️⃣ Networking & Data Flow

### Current State
- ❌ **No API client** - all data is mock/hardcoded
- ❌ **No error handling** for network calls
- ❌ **No retry logic**
- ❌ **No caching**
- ❌ **No request/response typing**

### Required Infrastructure

#### API Client Requirements
1. **Centralized HTTP client** (using `fetch` or `axios`)
2. **Request interceptors** (auth, headers)
3. **Response interceptors** (error handling, logging)
4. **Retry logic** for transient failures
5. **Timeout handling**
6. **Typed endpoints** with TypeScript

#### Error Handling Strategy
```typescript
// api/client.ts
class ApiError extends Error {
  statusCode: number;
  data?: unknown;
}

// Unified error response
interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  isLoading: boolean;
}
```

---

## 4️⃣ Push Notifications & App Lifecycle

### Current State
- ✅ **Notifications service well-structured**
- ❌ **Navigation not connected** - tap handler does nothing
- ❌ **No deep linking** setup
- ⚠️ **Race condition risk** - notifications may arrive before navigation ready

### Issues

1. **Notification Navigation**
   ```typescript
   // Current (broken):
   const notificationListener = Notifications.addNotificationResponseReceivedListener((response) => {
     console.log('Notification tapped:', response);
     // ❌ No navigation logic
   });
   ```

2. **Deep Linking Missing**
   - No expo-linking integration
   - No URL scheme configured
   - Cannot handle notification data → screen mapping

### Required Fixes
- Connect notification handler to navigation
- Add deep linking support
- Map notification data to screen params
- Handle navigation race conditions

---

## 5️⃣ Performance

### Issues Found

1. **Unnecessary Re-renders**
   ```typescript
   // ❌ BAD: Inline object created on every render
   <EventCard event={event} onPress={() => navigation.navigate(...)} />
   
   // ✅ GOOD: Memoized callback
   const handlePress = useCallback(() => navigation.navigate(...), [navigation]);
   ```

2. **Missing Memoization**
   - `TabNavigator.tsx`: `screenOptions` function recreated every render
   - `HomeScreen.tsx`: `tiles` array recreated
   - Component props not memoized

3. **Heavy Components**
   - `HomeScreen` does too much (data fetching, rendering, business logic)
   - Could be split into smaller components

### Recommendations
- Use `React.memo` for `EventCard`, `ArtistCard`
- `useCallback` for event handlers
- `useMemo` for computed values
- Split large screens into smaller components

---

## 6️⃣ Error Handling & Resilience

### Current State
- ⚠️ **Inconsistent error handling**
- ❌ **No error boundaries**
- ⚠️ **Some silent failures** (Firebase init continues on error, which is good)
- ✅ **Crashlytics integration** present

### Issues

1. **No Error Boundaries**
   ```typescript
   // Missing: Error boundary to catch render errors
   <ErrorBoundary>
     <AppNavigator />
   </ErrorBoundary>
   ```

2. **Inconsistent Error UX**
   - Some errors show user messages
   - Some only log to console
   - No retry mechanisms

3. **Error Types Not Normalized**
   - Different error shapes from different sources
   - Hard to handle uniformly

### Required Improvements
- Add React error boundary component
- Normalize error types
- Create error display component
- Add retry mechanisms
- Better offline handling

---

## 7️⃣ Code Quality & Consistency

### Issues Found

1. **TypeScript `any` Usage**
   ```typescript
   // ❌ App.tsx line 11
   const notificationListeners = useRef<any>(null);
   
   // Should be properly typed
   type NotificationListeners = {
     unsubscribeForeground: () => void;
     notificationListener: import('expo-notifications').Subscription;
   };
   ```

2. **Missing Type Definitions**
   - No shared types for `Event`, `Artist`, `Partner`
   - Types duplicated across files
   - Should have `src/types/` directory

3. **Inconsistent Error Messages**
   - Mix of Czech and English
   - Some console.error, some console.warn
   - Should standardize

4. **File Naming**
   - ✅ Good: PascalCase for components
   - ✅ Good: camelCase for utilities
   - Could add index files for cleaner imports

---

## 8️⃣ Security & Storage

### Current State
- ✅ **No secrets in code** (good)
- ⚠️ **No SecureStore usage** (favorites not persisted securely)
- ✅ **Environment handling** acceptable (no sensitive data)

### Recommendations
- Use `expo-secure-store` for sensitive preferences
- Use `AsyncStorage` for non-sensitive cached data
- Never commit API keys or secrets

---

## 📋 Refactoring Plan

### Phase 1: Critical Infrastructure (Week 1)
**Goal**: Establish foundation for production app

1. **Create API Client** (P0)
   - Files: `src/api/client.ts`, `src/api/endpoints.ts`
   - Risk: Low
   - Impact: High

2. **Implement Zustand Stores** (P0)
   - Files: `src/stores/appStore.ts`, `src/stores/favoritesStore.ts`
   - Risk: Low
   - Impact: High

3. **Add Error Boundary** (P0)
   - Files: `src/components/ErrorBoundary.tsx`
   - Risk: Low
   - Impact: High

4. **Create Types Directory** (P1)
   - Files: `src/types/index.ts`, `src/types/models.ts`
   - Risk: None
   - Impact: Medium

### Phase 2: Integration & Polish (Week 2)
**Goal**: Connect pieces and improve UX

5. **Refactor App Initialization** (P1)
   - Files: `App.tsx`, `src/hooks/useAppInitialization.ts`
   - Risk: Medium
   - Impact: High

6. **Add Deep Linking** (P1)
   - Files: `src/navigation/linking.ts`, `AppNavigator.tsx`
   - Risk: Medium
   - Impact: High

7. **Connect Notification Navigation** (P1)
   - Files: `src/services/notifications.ts`, navigation integration
   - Risk: Medium
   - Impact: Medium

### Phase 3: Performance & Optimization (Week 3)
**Goal**: Optimize for production scale

8. **Component Optimization** (P2)
   - Files: All component files
   - Risk: Low
   - Impact: Medium

9. **Create Custom Hooks** (P2)
   - Files: `src/hooks/useEvents.ts`, `src/hooks/useArtists.ts`
   - Risk: Low
   - Impact: Medium

10. **Add Data Persistence** (P2)
    - Files: `src/stores/favoritesStore.ts` (with AsyncStorage)
    - Risk: Low
    - Impact: Medium

---

## 🎯 Success Criteria

After refactoring:
- ✅ New features are easy to add
- ✅ Errors are gracefully handled
- ✅ App survives crashes with error boundaries
- ✅ State is managed consistently
- ✅ API calls are centralized and typed
- ✅ Navigation works from notifications
- ✅ Performance is optimized (no unnecessary re-renders)
- ✅ Codebase is maintainable for small team

---

## 🚀 Implementation Priority

### Do NOW (P0)
1. API client
2. Zustand stores (favorites)
3. Error boundary
4. Shared types

### Do NEXT (P1)
5. Refactor App.tsx
6. Deep linking
7. Notification navigation

### Do LATER (P2)
8. Component optimization
9. Custom hooks
10. Data persistence

---

## 📈 Architecture Diagram (After Refactoring)

```
┌─────────────────────────────────────────┐
│              App.tsx                     │
│  - Error Boundary                        │
│  - App Initialization Hook               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        AppNavigator                      │
│  - Deep Linking Config                   │
│  - Navigation Container                  │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│Screens│ │Screens│ │Screens│
└───┬───┘ └───┬───┘ └───┬───┘
    │          │          │
    └──────────┼──────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼──────┐      ┌───────▼──────┐
│  Stores  │      │  API Client  │
│ (Zustand)│      │  (Typed)     │
└──────────┘      └──────────────┘
    │                     │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │      Services       │
    │  - Firebase         │
    │  - Notifications    │
    │  - RemoteConfig     │
    └─────────────────────┘
```

---

**Next Steps**: See implementation files created in this refactoring session.






