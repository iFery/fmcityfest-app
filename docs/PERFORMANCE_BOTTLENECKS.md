# Performance Bottlenecks Analysis

This document identifies exploitable performance bottlenecks in the React Native app that could impact user experience, especially on lower-end devices or with large datasets.

## Critical Issues (High Impact)

### 1. **Non-Virtualized Lists Using ScrollView + .map()**

**Location:** `src/screens/NewsScreen.tsx`, `src/screens/HomeScreen.tsx`, `src/screens/FavoritesScreen.tsx`

**Problem:**
- `NewsScreen` renders all news items using `ScrollView` with `.map()` - all items are rendered at once
- `HomeScreen` renders partners grid using `.map()` - could be 20+ items
- `FavoritesScreen` uses nested `.map()` calls for events grouped by day

**Impact:** 
- All items rendered immediately, causing:
  - Slow initial render (especially with images)
  - High memory usage
  - Poor scroll performance
  - UI freezes on lower-end devices

**Recommendation:**
```typescript
// Replace ScrollView + .map() with FlatList
<FlatList
  data={news}
  renderItem={({ item }) => <NewsItem news={item} />}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={10}
/>
```

**Files to fix:**
- `src/screens/NewsScreen.tsx:63-93` - Replace ScrollView with FlatList
- `src/screens/HomeScreen.tsx:107-136` - Use FlatList for partners grid
- `src/screens/FavoritesScreen.tsx:250-392` - Consider FlatList for events list

---

### 2. **Expensive Computations in Render Functions**

**Location:** `src/screens/ProgramScreen.tsx`, `src/screens/ArtistsScreen.tsx`

**Problem:**
- `ProgramScreen` performs complex date calculations (`dayjs` operations) inside render
- `ArtistsScreen.renderArtistCard` filters timeline data on every render for each item
- Multiple `useMemo` hooks but still doing expensive work

**Impact:**
- Recalculations on every scroll/render
- Main thread blocking
- Janky scrolling

**Example from ArtistsScreen:**
```typescript:217:270:src/screens/ArtistsScreen.tsx
const renderArtistCard = ({ item }: { item: Artist & { id?: string } }) => {
  // This runs for EVERY item on EVERY render
  if (timelineData && !isFavorite) {
    const numericArtistId = parseInt(item.id, 10);
    const artistEvents = (timelineData.events as TimelineEvent[]).filter(
      (event) => event.interpret_id === numericArtistId && event.start && event.id
    );
    // ... more filtering
  }
}
```

**Recommendation:**
- Pre-compute favorite status map outside render
- Use `useMemo` with proper dependencies
- Move expensive calculations to `useMemo` hooks
- Consider using `React.memo` for card components with proper comparison

---

### 3. **Sequential Data Preloading**

**Location:** `src/services/preloadService.ts`

**Problem:**
- All data is preloaded sequentially in a loop
- Each API call waits for the previous one to complete

**Impact:**
- Slow app startup (5+ sequential network requests)
- Longer time to "ready" state
- Poor user experience on slow networks

**Current code:**
```typescript:71:102:src/services/preloadService.ts
for (const task of tasks) {
  await task.fn(); // Sequential - waits for each to complete
  completed++;
}
```

**Recommendation:**
```typescript
// Load all data in parallel
const results = await Promise.allSettled(
  tasks.map(task => task.fn())
);
// Handle results...
```

**Expected improvement:** 3-5x faster startup on good networks

---

### 4. **Multiple Cache Reads in useFavorites**

**Location:** `src/hooks/useFavorites.ts`

**Problem:**
- `loadFromCache('timeline')` called multiple times in different `useEffect` hooks
- Timeline data loaded separately in multiple screens
- No shared state for timeline data

**Impact:**
- Redundant AsyncStorage reads (slow I/O)
- Multiple JSON.parse operations
- Memory duplication

**Recommendation:**
- Create a shared `useTimeline` hook or context
- Load timeline once at app level
- Share via context or global state

---

### 5. **Image Loading Without Optimization**

**Location:** Multiple screens (ArtistsScreen, HomeScreen, NewsScreen, etc.)

**Problem:**
- Images loaded without:
  - Caching strategy
  - Size optimization
  - Lazy loading
  - Placeholder handling
  - Progressive loading

**Impact:**
- High memory usage
- Slow initial render
- Network bandwidth waste
- Poor performance on slow connections

**Recommendation:**
- Use `react-native-fast-image` or `expo-image` with caching
- Implement image size optimization (thumbnails)
- Add proper `resizeMode` and size constraints
- Use `getItemLayout` for FlatList with images

---

## Moderate Issues (Medium Impact)

### 6. **Complex Navigation Listeners**

**Location:** `src/navigation/TabNavigator.tsx`

**Problem:**
- Complex `tabPress` listeners on every tab
- Multiple navigation state checks on each press
- `CommonActions.reset` dispatched frequently

**Impact:**
- Slight delay on tab switching
- Unnecessary re-renders

**Recommendation:**
- Debounce tab press handlers
- Optimize navigation state checks
- Consider using `useFocusEffect` instead of listeners where possible

---

### 7. **Missing Memoization in Components**

**Location:** Various components

**Problem:**
- `renderArtistCard` not memoized properly
- Callback functions recreated on every render
- Missing `React.memo` on list items

**Impact:**
- Unnecessary re-renders
- Performance degradation with large lists

**Recommendation:**
```typescript
const renderArtistCard = React.useCallback(
  ({ item }: { item: Artist }) => {
    // ... render logic
  },
  [timelineData, favoriteEvents, isArtistFavorite] // Dependencies
);

// Memoize the component
const ArtistCardItem = React.memo(ArtistCard, (prev, next) => {
  return prev.artist.id === next.artist.id && 
         prev.isFavorite === next.isFavorite;
});
```

---

### 8. **Heavy useFavorites Hook**

**Location:** `src/hooks/useFavorites.ts`

**Problem:**
- Multiple `useEffect` hooks with async operations
- Timeline data loaded multiple times
- Notification updates triggered frequently
- Migration logic runs on every mount

**Impact:**
- Cascading updates
- Multiple async operations
- Potential race conditions

**Recommendation:**
- Consolidate effects where possible
- Use refs to prevent unnecessary updates
- Debounce notification updates
- Move migration to app initialization

---

### 9. **Date Calculations in Render**

**Location:** `src/screens/ProgramScreen.tsx`, `src/screens/FavoritesScreen.tsx`

**Problem:**
- Multiple `dayjs` operations in render functions
- Date formatting on every render
- Time comparisons in loops

**Impact:**
- CPU overhead
- Battery drain
- Janky animations

**Recommendation:**
- Pre-compute formatted dates in `useMemo`
- Cache date comparisons
- Use native date formatting where possible

---

### 10. **Nested ScrollViews**

**Location:** `src/screens/ProgramScreen.tsx`

**Problem:**
- Horizontal ScrollView nested inside vertical ScrollView
- Complex nested scrolling can cause performance issues

**Impact:**
- Scroll jank
- Gesture conflicts
- Memory overhead

**Recommendation:**
- Use `react-native-gesture-handler` for better gesture handling
- Consider alternative UI patterns (tabs for days instead of nested scroll)

---

## Low Priority Issues (Optimization Opportunities)

### 11. **Cache Manager Synchronous Operations**

**Location:** `src/utils/cacheManager.ts`

**Problem:**
- `hasAnyValidCache` and `getOldestCacheAge` use sequential loops
- Multiple AsyncStorage reads

**Recommendation:**
```typescript
// Use Promise.all for parallel reads
const cacheChecks = await Promise.all(
  keys.map(key => hasValidCache(key))
);
```

---

### 12. **Bootstrap Provider Sequential Initialization**

**Location:** `src/providers/BootstrapProvider.tsx`

**Problem:**
- Firebase, Remote Config, Notifications initialized sequentially
- Could be parallelized where dependencies allow

**Recommendation:**
- Initialize independent services in parallel
- Only wait for dependencies when necessary

---

### 13. **Missing FlatList Optimizations**

**Location:** `src/screens/ArtistsScreen.tsx`

**Problem:**
- FlatList used but missing performance props:
  - `removeClippedSubviews`
  - `maxToRenderPerBatch`
  - `windowSize`
  - `getItemLayout` (if items have fixed height)

**Recommendation:**
```typescript
<FlatList
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={10}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

---

## Performance Testing Recommendations

1. **Profile with React DevTools Profiler**
   - Identify components with longest render times
   - Find unnecessary re-renders

2. **Use React Native Performance Monitor**
   - Monitor FPS during scrolling
   - Check memory usage

3. **Test on Low-End Devices**
   - Older Android devices
   - iPhone SE (1st gen)
   - Simulate slow network conditions

4. **Measure Key Metrics:**
   - Time to interactive (TTI)
   - Time to first render
   - Scroll FPS (should be 60fps)
   - Memory usage with large lists

---

## Priority Fix Order

1. **Immediate (Critical):**
   - Replace ScrollView + .map() with FlatList (NewsScreen, HomeScreen)
   - Fix expensive computations in renderArtistCard
   - Parallelize data preloading

2. **Short-term (High Impact):**
   - Optimize image loading
   - Share timeline data via context
   - Add FlatList performance props

3. **Medium-term (Optimization):**
   - Memoize components properly
   - Optimize useFavorites hook
   - Pre-compute date calculations

4. **Long-term (Polish):**
   - Optimize navigation listeners
   - Improve cache manager
   - Add performance monitoring

---

## Expected Performance Improvements

After implementing critical fixes:
- **Startup time:** 3-5x faster (parallel preloading)
- **Scroll performance:** 60fps on mid-range devices (virtualized lists)
- **Memory usage:** 30-50% reduction (proper list virtualization)
- **Initial render:** 2-3x faster (optimized images and computations)


