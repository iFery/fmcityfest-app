/**
 * Custom hook for fetching news
 * Uses useCachedData pattern for consistent behavior and loading states
 */

import { newsApi } from '../api';
import { useCachedData } from './useCachedData';
import type { News } from '../types';

const CACHE_KEY = 'news';

/**
 * Hook to fetch and manage news
 * Uses useCachedData for consistent caching and loading state management
 * 
 * Note: News API returns News[] directly, so no transformation needed
 */
export function useNews() {
  const result = useCachedData<News[]>({
    cacheKey: CACHE_KEY,
    fetchFn: async () => {
      const response = await newsApi.getAll();
      return response.data;
    },
    defaultData: [],
    errorMessage: 'Nepodařilo se načíst novinky',
  });

  return {
    news: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}
