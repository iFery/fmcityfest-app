/**
 * Timeline Context - Shared timeline data provider
 * Prevents redundant AsyncStorage reads by loading timeline data once
 * and sharing it across the app via React Context
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { loadFromCache } from '../utils/cacheManager';
import { TimelineApiResponse } from '../api/endpoints';

interface TimelineContextValue {
  timelineData: TimelineApiResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const TimelineContext = createContext<TimelineContextValue | undefined>(undefined);

const TIMELINE_CACHE_KEY = 'timeline';

interface TimelineProviderProps {
  children: ReactNode;
  /**
   * Optional initial timeline data from BootstrapProvider preload
   * If provided, this eliminates the need for AsyncStorage read on mount
   */
  initialData?: TimelineApiResponse | null;
}

/**
 * TimelineProvider - Loads timeline data once and provides it via context
 * This prevents redundant AsyncStorage reads across multiple components
 * 
 * Performance optimization: If initialData is provided from BootstrapProvider,
 * data is available immediately without AsyncStorage read delay
 */
export function TimelineProvider({ children, initialData }: TimelineProviderProps) {
  // If initialData is provided, use it immediately (no loading state needed)
  const [timelineData, setTimelineData] = useState<TimelineApiResponse | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData); // Only loading if no initial data
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialData) {
      return;
    }

    setTimelineData((current) => (current === initialData ? current : initialData));
    setLoading(false);
    setError(null);
  }, [initialData]);

  const loadTimeline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const cached = await loadFromCache<TimelineApiResponse>(TIMELINE_CACHE_KEY);
      if (cached) {
        setTimelineData(cached);
        setLoading(false);
      } else {
        // No cache available - this should be rare as data is preloaded
        setError('Timeline data not available');
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load timeline data';
      console.error('Error loading timeline:', err);
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  // Load timeline data on mount only if initialData was not provided
  useEffect(() => {
    if (!initialData) {
      loadTimeline();
    }
  }, [loadTimeline, initialData]);

  const value: TimelineContextValue = {
    timelineData,
    loading,
    error,
    refetch: loadTimeline,
  };

  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>;
}

/**
 * Hook to access timeline data from context
 * Use this instead of loading timeline data directly in components
 */
export function useTimeline(): TimelineContextValue {
  const context = useContext(TimelineContext);
  if (context === undefined) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
}

