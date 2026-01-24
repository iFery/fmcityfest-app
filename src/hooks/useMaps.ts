/**
 * Custom hook for fetching maps
 * Uses useCachedData pattern for consistent behavior and loading states
 */

import { mapsApi } from '../api';
import { useCachedData } from './useCachedData';
import type { MapsData } from '../types';

const CACHE_KEY = 'maps';

/**
 * Hook to fetch and manage maps
 * Uses useCachedData for consistent caching and loading state management
 */
export function useMaps() {
  const result = useCachedData<MapsData>({
    cacheKey: CACHE_KEY,
    fetchFn: async () => {
      const response = await mapsApi.getAll();
      return response.data;
    },
    defaultData: {},
    errorMessage: 'Nepodařilo se načíst mapy',
  });

  return {
    maps: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}
