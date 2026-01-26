/**
 * Reusable hook for data fetching with cache support
 * Reduces duplication across data hooks (useArtists, useEvents, etc.)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '../api/client';
import { loadFromCache, saveToCache } from '../utils/cacheManager';

export interface UseCachedDataResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseCachedDataOptions<T> {
  cacheKey: string;
  fetchFn: () => Promise<T>;
  defaultData: T;
  errorMessage: string;
  transformResponse?: (response: unknown) => T;
}

/**
 * Generic hook for fetching data with cache support
 * Used by useArtists, useEvents, useNews, usePartners, useFAQ
 */
export function useCachedData<T>({
  cacheKey,
  fetchFn,
  defaultData,
  errorMessage,
  transformResponse,
}: UseCachedDataOptions<T>): UseCachedDataResult<T> {
  const [data, setData] = useState<T>(defaultData);
  // Start with loading: false - we'll check cache first before showing loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  
  // CRITICAL FIX: Store fetchFn in ref to prevent infinite loops
  // fetchFn from parent hooks is recreated on every render, which would cause
  // fetchData to change, triggering useEffect, causing infinite fetch loop
  const fetchFnRef = useRef(fetchFn);
  const transformResponseRef = useRef(transformResponse);
  
  // Update refs when props change (but don't trigger re-renders)
  useEffect(() => {
    fetchFnRef.current = fetchFn;
    transformResponseRef.current = transformResponse;
  }, [fetchFn, transformResponse]);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      try {
        if (forceRefresh && isMountedRef.current) {
          setLoading(true);
        }
        if (isMountedRef.current) {
          setError(null);
        }

        // Use ref to get latest fetchFn without causing dependency changes
        const response = await fetchFnRef.current();
        const transformedData = transformResponseRef.current 
          ? transformResponseRef.current(response) 
          : (response as T);
        
        await saveToCache<T>(cacheKey, transformedData);
        
        if (isMountedRef.current) {
          setData(transformedData);
          setLoading(false);
        }
      } catch (err) {
        const apiError = err as ApiError;

        // If we have cached data and API fails, use cache
        if (!forceRefresh) {
          const cachedData = await loadFromCache<T>(cacheKey);
          if (cachedData !== null) {
            // Check if cached data is array and has items, or if it's object
            const hasValidCache = Array.isArray(cachedData) 
              ? cachedData.length > 0 
              : cachedData !== null && typeof cachedData === 'object' && Object.keys(cachedData).length > 0;
            
            if (hasValidCache) {
              if (isMountedRef.current) {
                setData(cachedData);
                setError(null);
                setLoading(false);
              }
              return;
            }
          }
        }

        if (isMountedRef.current) {
          setError(apiError.message || errorMessage);
          console.error(`Error fetching ${cacheKey}:`, err);
          setData(defaultData);
          setLoading(false);
        }
      }
    },
    [cacheKey, defaultData, errorMessage] // Removed fetchFn and transformResponse from deps
  );

  // Load from cache immediately on mount - check cache FIRST before showing loading
  // CRITICAL FIX: Only depend on cacheKey, not fetchData, to prevent infinite loops
  // fetchData is stable (doesn't change) because it only depends on cacheKey, defaultData, errorMessage
  useEffect(() => {
    let isMounted = true;

    const loadCacheFirst = async () => {
      // Check cache FIRST before setting any loading state
      const cachedData = await loadFromCache<T>(cacheKey);
      if (isMounted) {
        if (cachedData !== null) {
          // Check if cached data is valid
          const hasValidCache = Array.isArray(cachedData) 
            ? cachedData.length > 0 
            : cachedData !== null && typeof cachedData === 'object' && Object.keys(cachedData).length > 0;
          
          if (hasValidCache) {
            // Cache exists and is valid - show it immediately, no loading state
            setData(cachedData);
            setLoading(false);
          } else {
            // Cache exists but is invalid - fetch new data with loading
            setLoading(true);
            fetchData(false);
          }
        } else {
          // No cache - show loading and fetch
          setLoading(true);
          fetchData(false);
        }
      }
    };

    loadCacheFirst();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]); // Only cacheKey - fetchData is stable and doesn't need to be in deps

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]); // fetchData is now stable (doesn't depend on fetchFn), so this is safe

  return {
    data,
    loading,
    error,
    refetch,
  };
}

