/**
 * Custom hook for fetching events
 * Uses useCachedData pattern for consistent behavior and loading states
 */

import { eventsApi, type TimelineApiResponse } from '../api';
import { saveToCache } from '../utils/cacheManager';
import { useCachedData } from './useCachedData';
import type { Event } from '../types';

const CACHE_KEY = 'events';
const TIMELINE_CACHE_KEY = 'timeline';

/**
 * Transform timeline API response to events format
 */
function transformTimeline(response: TimelineApiResponse): Event[] {
  return response.events.map((event) => ({
    id: event.id || '',
    name: event.name || '',
    time: event.time || '',
    artist: event.artist || '',
    stage: event.stage,
    description: event.description,
    image: event.image,
    date: event.date,
  }));
}

/**
 * Hook to fetch and manage events
 * Uses useCachedData for consistent caching and loading state management
 * 
 * Note: Also saves full timeline data to separate cache key for other parts of the app
 */
export function useEvents() {
  const result = useCachedData<Event[]>({
    cacheKey: CACHE_KEY,
    fetchFn: async () => {
      // Fetch timeline data
      const response = await eventsApi.getAll();
      
      // Save full timeline data to separate cache (needed for ProgramScreen)
      // This happens during fetch, so no extra API call needed
      await saveToCache<TimelineApiResponse>(TIMELINE_CACHE_KEY, response.data).catch((error) => {
        // Silently fail - timeline cache is not critical for events display
        console.warn('Failed to save timeline cache:', error);
      });
      
      // Transform and return events array
      return transformTimeline(response.data);
    },
    defaultData: [],
    errorMessage: 'Nepodařilo se načíst události',
  });

  return {
    events: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}
