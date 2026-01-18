/**
 * Custom hook for fetching FAQ
 * Uses useCachedData pattern for consistent behavior and loading states
 */

import { faqApi } from '../api';
import { useCachedData } from './useCachedData';
import type { FAQCategory } from '../types';

const CACHE_KEY = 'faq';

/**
 * Hook to fetch and manage FAQ
 * Uses useCachedData for consistent caching and loading state management
 * 
 * Note: FAQ API returns FAQCategory[] directly, so no transformation needed
 */
export function useFAQ() {
  const result = useCachedData<FAQCategory[]>({
    cacheKey: CACHE_KEY,
    fetchFn: async () => {
      const response = await faqApi.getAll();
      return response.data;
    },
    defaultData: [],
    errorMessage: 'Nepodařilo se načíst FAQ',
  });

  return {
    faq: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}
