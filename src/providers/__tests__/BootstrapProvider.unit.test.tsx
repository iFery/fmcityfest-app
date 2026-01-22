/**
 * Unit tests for BootstrapProvider - testing bootstrap logic behavior
 * Tests the 4 core scenarios without UI rendering
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { preloadAllData } from '../../services/preloadService';
import { hasAnyValidCache, getOldestCacheAge } from '../../utils/cacheManager';
import { BootstrapProvider, useBootstrap } from '../BootstrapProvider';

// Mock dependencies
jest.mock('../../services/preloadService');
jest.mock('../../utils/cacheManager');
jest.mock('../../services/firebase');
jest.mock('../../services/crashlytics');
jest.mock('../../services/remoteConfig');
jest.mock('../../services/notifications');

const mockedNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
const mockedPreloadAllData = preloadAllData as jest.MockedFunction<typeof preloadAllData>;
const mockedHasAnyValidCache = hasAnyValidCache as jest.MockedFunction<typeof hasAnyValidCache>;
const mockedGetOldestCacheAge = getOldestCacheAge as jest.MockedFunction<typeof getOldestCacheAge>;

describe('BootstrapProvider - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear AsyncStorage
    AsyncStorage.clear();
    // Reset all mocks to default behavior
    mockedHasAnyValidCache.mockReset();
    mockedGetOldestCacheAge.mockReset();
    mockedPreloadAllData.mockReset();
    mockedNetInfo.fetch.mockReset();
  });

  const renderBootstrapHook = () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BootstrapProvider>{children}</BootstrapProvider>
    );
    return renderHook(() => useBootstrap(), { wrapper });
  };

  describe('Scenario 1: online + fresh fetch => ready-online', () => {
    it('should transition to ready-online when online and fetch succeeds', async () => {
      // Setup: online, no cache initially, fetch succeeds and creates cache
      mockedNetInfo.fetch.mockResolvedValue({
        isInternetReachable: true,
      } as any);
      // First call: no cache before fetch, second call: cache exists after fetch
      mockedHasAnyValidCache
        .mockResolvedValueOnce(false) // Before fetch - no cache
        .mockResolvedValueOnce(true); // After fetch - cache created
      mockedPreloadAllData.mockResolvedValue({
        success: true,
        errors: [],
      });

      const { result } = renderBootstrapHook();

      // Initially loading
      expect(result.current.state).toBe('loading');

      await waitFor(() => {
        expect(result.current.state).toBe('ready-online');
      });

      // Verify behavior
      expect(mockedNetInfo.fetch).toHaveBeenCalled();
      expect(mockedHasAnyValidCache).toHaveBeenCalledTimes(2);
      expect(mockedPreloadAllData).toHaveBeenCalled();
    });
  });

  describe('Scenario 2: online + fetch error + cache exists => ready-offline', () => {
    it('should transition to ready-offline when online, fetch fails, but cache exists', async () => {
      // Setup: online, cache exists, fetch fails
      mockedNetInfo.fetch.mockResolvedValue({
        isInternetReachable: true,
      } as any);
      mockedHasAnyValidCache
        .mockResolvedValueOnce(true) // Initial cache check
        .mockResolvedValueOnce(false); // After fetch attempt
      mockedGetOldestCacheAge.mockResolvedValue(1000 * 60 * 60); // 1 hour old
      mockedPreloadAllData.mockRejectedValue(new Error('Network error'));

      const { result } = renderBootstrapHook();

      await waitFor(() => {
        expect(result.current.state).toBe('ready-offline');
      }, { timeout: 3000 });

      // Verify behavior
      expect(mockedPreloadAllData).toHaveBeenCalled();
      expect(result.current.state).toBe('ready-offline');
    });
  });

  describe('Scenario 3: offline + cache exists => ready-offline', () => {
    it('should transition to ready-offline when offline but cache exists', async () => {
      // Setup: offline, cache exists
      mockedNetInfo.fetch.mockResolvedValue({
        isInternetReachable: false,
      } as any);
      // Mock for initial check and catch block check (if error occurs during init)
      mockedHasAnyValidCache
        .mockResolvedValueOnce(true) // Initial check in main flow
        .mockResolvedValueOnce(true); // Catch block check (if any error during init)
      // getOldestCacheAge is called when hasCache is true - must not throw
      mockedGetOldestCacheAge.mockResolvedValue(1000 * 60 * 60); // 1 hour old

      const { result } = renderBootstrapHook();

      // Initially loading
      expect(result.current.state).toBe('loading');

      // Wait for state to change - should be ready-offline
      await waitFor(
        () => {
          const state = result.current.state;
          if (state === 'loading') {
            throw new Error('Still loading');
          }
          if (state !== 'ready-offline') {
            throw new Error(`Expected ready-offline but got ${state}`);
          }
        },
        { timeout: 10000, interval: 100 }
      );

      // Verify final state
      expect(result.current.state).toBe('ready-offline');

      // Verify behavior
      expect(mockedNetInfo.fetch).toHaveBeenCalled();
      expect(mockedHasAnyValidCache).toHaveBeenCalled();
      // Should NOT call preloadAllData when offline
      expect(mockedPreloadAllData).not.toHaveBeenCalled();
    }, 15000);
  });

  describe('Scenario 4: offline + no cache => offline-blocked', () => {
    it('should transition to offline-blocked when offline and no cache exists', async () => {
      // Setup: offline, no cache
      mockedNetInfo.fetch.mockResolvedValue({
        isInternetReachable: false,
      } as any);
      // Mock for initial check and catch block check (both should return false)
      mockedHasAnyValidCache
        .mockResolvedValueOnce(false) // Initial check in main flow
        .mockResolvedValueOnce(false); // Catch block check (if any error during init)

      const { result } = renderBootstrapHook();

      await waitFor(() => {
        expect(result.current.state).toBe('offline-blocked');
      }, { timeout: 10000 });

      // Verify behavior
      expect(mockedNetInfo.fetch).toHaveBeenCalled();
      expect(mockedHasAnyValidCache).toHaveBeenCalled();
      expect(mockedPreloadAllData).not.toHaveBeenCalled();
    }, 15000);
  });

  describe('Retry functionality', () => {
    it('should retry bootstrap when retry is called', async () => {
      // Setup: offline, no cache
      mockedNetInfo.fetch.mockResolvedValue({
        isInternetReachable: false,
      } as any);
      // Mock for initial check and catch block check (both should return false)
      mockedHasAnyValidCache
        .mockResolvedValueOnce(false) // Initial check in main flow
        .mockResolvedValueOnce(false); // Catch block check (if any error during init)

      const { result } = renderBootstrapHook();

      await waitFor(() => {
        expect(result.current.state).toBe('offline-blocked');
      }, { timeout: 10000 });

      // Reset mocks for retry scenario
      mockedNetInfo.fetch.mockReset();
      mockedHasAnyValidCache.mockReset();
      mockedPreloadAllData.mockReset();

      // Setup: online, fetch succeeds and creates cache (for retry)
      mockedNetInfo.fetch.mockResolvedValue({
        isInternetReachable: true,
      } as any);
      // First call: no cache before fetch, second call: cache exists after fetch, third for catch block
      mockedHasAnyValidCache
        .mockResolvedValueOnce(false) // Before fetch - no cache
        .mockResolvedValueOnce(true) // After fetch - cache created
        .mockResolvedValueOnce(true); // Catch block check (if any error)
      mockedPreloadAllData.mockResolvedValue({
        success: true,
        errors: [],
      });

      // Trigger retry
      result.current.retry();

      await waitFor(() => {
        expect(result.current.state).toBe('ready-online');
      }, { timeout: 10000 });

      // Verify retry was called
      expect(mockedNetInfo.fetch).toHaveBeenCalled();
    }, 20000);
  });

  describe('Edge cases', () => {
    it('should handle fetch error with no cache (online scenario)', async () => {
      // Setup: online, no cache, fetch fails
      mockedNetInfo.fetch.mockResolvedValue({
        isInternetReachable: true,
      } as any);
      mockedHasAnyValidCache.mockResolvedValue(false);
      mockedPreloadAllData.mockRejectedValue(new Error('Network error'));

      const { result } = renderBootstrapHook();

      await waitFor(() => {
        expect(result.current.state).toBe('offline-blocked');
      }, { timeout: 3000 });
    });

    it('should handle partial fetch success (some errors but cache created)', async () => {
      // Setup: online, no initial cache, fetch partially succeeds
      mockedNetInfo.fetch.mockResolvedValue({
        isInternetReachable: true,
      } as any);
      // First call: no cache before fetch, second call: cache exists after fetch, third for catch block
      mockedHasAnyValidCache
        .mockResolvedValueOnce(false) // Before fetch - no cache
        .mockResolvedValueOnce(true) // After fetch - cache created
        .mockResolvedValueOnce(true); // Catch block check (if any error)
      mockedGetOldestCacheAge.mockResolvedValue(1000);
      mockedPreloadAllData.mockResolvedValue({
        success: false,
        errors: ['Some endpoints failed'],
      });

      const { result } = renderBootstrapHook();

      await waitFor(() => {
        expect(result.current.state).toBe('ready-online');
      }, { timeout: 10000 });
    }, 15000);
  });
});
