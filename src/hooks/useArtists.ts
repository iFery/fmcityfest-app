/**
 * Custom hook for fetching artists
 * Uses useCachedData pattern for consistent behavior and loading states
 */

import { artistsApi, type ArtistsApiResponse } from '../api';
import { useCachedData } from './useCachedData';
import type { Artist } from '../types';

const CACHE_KEY = 'artists';

/**
 * Transform artists API response to our format
 */
function transformArtists(response: ArtistsApiResponse): Artist[] {
  return response.records
    .filter((record) => record.show_on_website === 1) // Only show artists marked for website
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
 * Hook to fetch and manage artists with 24h cache
 * Uses useCachedData for consistent caching and loading state management
 */
export function useArtists() {
  const result = useCachedData<Artist[]>({
    cacheKey: CACHE_KEY,
    fetchFn: async () => {
      const response = await artistsApi.getAll();
      return transformArtists(response.data);
    },
    defaultData: [],
    errorMessage: 'Nepodařilo se načíst interprety',
  });

  return {
    artists: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}
