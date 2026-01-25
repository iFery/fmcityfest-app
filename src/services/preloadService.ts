/**
 * Preload service - loads all critical data into cache on app startup
 */

import { artistsApi, eventsApi, partnersApi, newsApi, faqApi, mapsApi, type TimelineApiResponse } from '../api';
import { saveToCache, hasValidCache, loadFromCache } from '../utils/cacheManager';
import { crashlyticsService } from './crashlytics';
import type { Artist, Event, Partner, News, FAQCategory, MapsData } from '../types';

export interface PreloadProgress {
  total: number;
  completed: number;
  currentTask: string;
}

export type PreloadProgressCallback = (progress: PreloadProgress) => void;

/**
 * Transform artists API response to our format
 */
function transformArtists(response: { records: {
  id: number;
  fields: {
    nav_id: number;
    category_id: number;
    category_name: string;
    category_tag: string;
    photo?: { url: string };
    name: string;
    description: string;
  };
  show_on_website: number;
}[] }): Artist[] {
  return response.records
    .filter((record) => record.show_on_website === 1)
    .map((record) => ({
      id: record.id.toString(),
      name: record.fields.name,
      genre: record.fields.category_name,
      category_tag: record.fields.category_tag,
      image: record.fields.photo?.url || null,
      bio: record.fields.description,
    }));
}

/**
 * Preload all critical data into cache
 * Returns timeline data if available for immediate use in TimelineContext
 */
export async function preloadAllData(
  onProgress?: PreloadProgressCallback
): Promise<{ success: boolean; errors: string[]; timelineData?: TimelineApiResponse }> {
  const errors: string[] = [];
  const tasks = [
    { name: 'Artists', key: 'artists', fn: preloadArtists },
    { name: 'Events', key: 'events', fn: preloadEvents },
    { name: 'Timeline', key: 'timeline', fn: preloadTimeline },
    { name: 'Partners', key: 'partners', fn: preloadPartners },
    { name: 'News', key: 'news', fn: preloadNews },
    { name: 'FAQ', key: 'faq', fn: preloadFAQ },
    { name: 'Maps', key: 'maps', fn: preloadMaps },
  ];

  const total = tasks.length;
  // Use atomic counter to track completion safely in parallel execution
  let completed = 0;
  const incrementCompleted = () => {
    completed++;
    return completed;
  };

  // Report initial progress
  onProgress?.({
    total,
    completed: 0,
    currentTask: 'Začínám načítání...',
  });

  // Performance optimization: Load all data in parallel instead of sequentially
  // This reduces startup time by 3-5x on good networks
  const startTime = Date.now();

  // Execute all preload tasks in parallel
  // Special handling for Events task to capture timeline data
  let timelineData: TimelineApiResponse | null = null;
  
  const taskPromises = tasks.map(async (task) => {
    try {
      // Report that we're starting this task
      onProgress?.({
        total,
        completed,
        currentTask: `Načítám ${task.name.toLowerCase()}...`,
      });

      const result = await task.fn();
      
      // Capture timeline data from Events task
      if ((task.name === 'Events' || task.name === 'Timeline') && result) {
        timelineData = result as TimelineApiResponse;
      }

      // Task completed successfully - use atomic increment
      const currentCompleted = incrementCompleted();
      onProgress?.({
        total,
        completed: currentCompleted,
        currentTask: `${task.name} načteno`,
      });

      return { task: task.name, success: true, error: null, data: result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${task.name}: ${errorMessage}`);
      
      console.error(`Error preloading ${task.name}:`, error);
      crashlyticsService.recordError(error instanceof Error ? error : new Error(errorMessage));

      // Task failed but we continue - use atomic increment
      const currentCompleted = incrementCompleted();
      onProgress?.({
        total,
        completed: currentCompleted,
        currentTask: `${task.name} - chyba`,
      });

      return { task: task.name, success: false, error: errorMessage, data: null };
    }
  });

  // Wait for all tasks to complete (in parallel)
  const results = await Promise.allSettled(taskPromises);

  // Log results for debugging
  const successfulTasks: string[] = [];
  const failedTasks: string[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      if (result.value.success) {
        successfulTasks.push(result.value.task);
      } else {
        failedTasks.push(result.value.task);
      }
    } else {
      failedTasks.push(tasks[index].name);
    }
  });

  // Extract timeline data from Events task result if not already captured
  if (!timelineData) {
    results.forEach((result, index) => {
      if (
        result.status === 'fulfilled' &&
        (tasks[index].name === 'Events' || tasks[index].name === 'Timeline') &&
        result.value.data
      ) {
        timelineData = result.value.data as TimelineApiResponse | null;
      }
    });
  }

  const endTime = Date.now();
  const duration = endTime - startTime;
  console.log(`Preload completed in ${duration}ms. Successful: [${successfulTasks.join(', ')}]. Failed: [${failedTasks.join(', ')}]`);

  onProgress?.({
    total,
    completed,
    currentTask: 'Dokončeno',
  });

  return {
    success: errors.length === 0,
    errors,
    timelineData: timelineData || undefined,
  };
}

/**
 * Preload artists
 */
async function preloadArtists(): Promise<void> {
  try {
    // Check if cache is valid
    const cacheValid = await hasValidCache('artists');
    if (cacheValid) {
      //console.log('Artists cache is valid, skipping API call');
      return;
    }

    const response = await artistsApi.getAll();
    const transformed = transformArtists(response.data);
    await saveToCache<Artist[]>('artists', transformed);
  } catch (error) {
    // If API fails, try to keep existing cache
    console.warn('Failed to preload artists, keeping existing cache if available');
    throw error;
  }
}

/**
 * Transform timeline API response to events format
 */
function transformTimeline(response: TimelineApiResponse): { events: Event[]; timeline: TimelineApiResponse } {
  // Transform events from timeline API response
  const events: Event[] = response.events.map((event) => ({
    id: event.id || '',
    name: event.name || '',
    time: event.time || '',
    artist: event.artist || '',
    stage: event.stage,
    description: event.description,
    image: event.image,
    date: event.date,
  }));

  return { events, timeline: response };
}

let timelineFetchPromise: Promise<TimelineApiResponse | null> | null = null;

async function fetchAndCacheTimeline(): Promise<TimelineApiResponse | null> {
  if (!timelineFetchPromise) {
    timelineFetchPromise = (async () => {
      const response = await eventsApi.getAll();
      const transformed = transformTimeline(response.data);
      await saveToCache<Event[]>('events', transformed.events);
      await saveToCache<TimelineApiResponse>('timeline', transformed.timeline);
      return transformed.timeline;
    })();
  }

  try {
    return await timelineFetchPromise;
  } finally {
    timelineFetchPromise = null;
  }
}

/**
 * Preload events (timeline)
 * Returns timeline data for immediate use in TimelineContext
 */
async function preloadEvents(): Promise<TimelineApiResponse | null> {
  try {
    const eventsCacheValid = await hasValidCache('events');
    const timelineCacheValid = await hasValidCache('timeline');

    if (eventsCacheValid && timelineCacheValid) {
      //console.log('Events and timeline cache are valid, skipping API call');
      return (await loadFromCache<TimelineApiResponse>('timeline')) || null;
    }

    return await fetchAndCacheTimeline();
  } catch (error) {
    console.warn('Failed to preload events, keeping existing cache if available');
    // Try to return cached timeline data even if API call failed
    try {
      return await loadFromCache<TimelineApiResponse>('timeline') || null;
    } catch {
      throw error;
    }
  }
}

async function preloadTimeline(): Promise<TimelineApiResponse | null> {
  try {
    const timelineCacheValid = await hasValidCache('timeline');
    const eventsCacheValid = await hasValidCache('events');

    if (timelineCacheValid && eventsCacheValid) {
      return (await loadFromCache<TimelineApiResponse>('timeline')) || null;
    }

    return await fetchAndCacheTimeline();
  } catch (error) {
    console.warn('Failed to preload timeline, keeping existing cache if available', error);
    return (await loadFromCache<TimelineApiResponse>('timeline')) || null;
  }
}

/**
 * Preload partners
 */
async function preloadPartners(): Promise<void> {
  try {
    // Check if cache is valid
    const cacheValid = await hasValidCache('partners');
    if (cacheValid) {
      //console.log('Partners cache is valid, skipping API call');
      return;
    }

    const response = await partnersApi.getAll();
    await saveToCache<Partner[]>('partners', response.data);
  } catch (error) {
    console.warn('Failed to preload partners, keeping existing cache if available');
    throw error;
  }
}

async function preloadMaps(): Promise<void> {
  try {
    const cacheValid = await hasValidCache('maps');
    if (cacheValid) {
      //console.log('Maps cache is valid, skipping API call');
      return;
    }

    const response = await mapsApi.getAll();
    await saveToCache<MapsData>('maps', response.data);
  } catch (error) {
    console.warn('Failed to preload maps, keeping existing cache if available');
    throw error;
  }
}

/**
 * Preload news
 */
async function preloadNews(): Promise<void> {
  try {
    // Check if cache is valid
    const cacheValid = await hasValidCache('news');
    if (cacheValid) {
      //console.log('News cache is valid, skipping API call');
      return;
    }

    const response = await newsApi.getAll();
    await saveToCache<News[]>('news', response.data);
  } catch (error) {
    console.warn('Failed to preload news, keeping existing cache if available');
    throw error;
  }
}

/**
 * Preload FAQ
 */
async function preloadFAQ(): Promise<void> {
  try {
    // Check if cache is valid
    const cacheValid = await hasValidCache('faq');
    if (cacheValid) {
      //console.log('FAQ cache is valid, skipping API call');
      return;
    }

    const response = await faqApi.getAll();
    await saveToCache<FAQCategory[]>('faq', response.data);
  } catch (error) {
    console.warn('Failed to preload FAQ, keeping existing cache if available');
    throw error;
  }
}
