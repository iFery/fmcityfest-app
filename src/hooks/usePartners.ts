/**
 * Custom hook for fetching partners
 * Uses useCachedData pattern for consistent behavior and loading states
 */

import { partnersApi } from '../api';
import { useCachedData } from './useCachedData';
import type { Partner } from '../types';

const CACHE_KEY = 'partners';

/**
 * Hook to fetch and manage partners
 * Uses useCachedData for consistent caching and loading state management
 * 
 * Note: Partners API already transforms the response in the API layer,
 * so no additional transformation needed here
 */
export function usePartners() {
  const result = useCachedData<Partner[]>({
    cacheKey: CACHE_KEY,
    fetchFn: async () => {
      const response = await partnersApi.getAll();
      return response.data;
    },
    defaultData: [],
    errorMessage: 'Nepodařilo se načíst partnery',
  });

  return {
    partners: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}
