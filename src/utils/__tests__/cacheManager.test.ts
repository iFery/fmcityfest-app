/**
 * Unit tests for cache manager
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadFromCache,
  saveToCache,
  clearCache,
  clearAllCache,
  hasValidCache,
  getCacheAge,
  hasAnyValidCache,
  getOldestCacheAge,
} from '../cacheManager';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    getAllKeys: jest.fn(),
    multiRemove: jest.fn(),
  },
}));

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('cacheManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Date.now mock
    jest.spyOn(Date, 'now').mockReturnValue(1000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('saveToCache', () => {
    it('should save data to cache with timestamp', async () => {
      const testData = { id: 1, name: 'Test' };
      
      await saveToCache('test-key', testData);

      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        'cache_test-key',
        JSON.stringify({
          data: testData,
          timestamp: 1000000,
        })
      );
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockedAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

      await saveToCache('test-key', { test: 'data' });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('loadFromCache', () => {
    it('should load valid cache data', async () => {
      const testData = { id: 1, name: 'Test' };
      const cachedData = {
        data: testData,
        timestamp: 1000000 - 1000 * 60 * 60, // 1 hour ago (within 24h)
      };

      mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(cachedData));

      const result = await loadFromCache<typeof testData>('test-key');

      expect(result).toEqual(testData);
      expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith('cache_test-key');
    });

    it('should return null for expired cache', async () => {
      const cachedData = {
        data: { id: 1 },
        timestamp: 1000000 - 1000 * 60 * 60 * 25, // 25 hours ago (expired)
      };

      mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(cachedData));

      const result = await loadFromCache('test-key');

      expect(result).toBeNull();
      expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('cache_test-key');
    });

    it('should return null for missing cache', async () => {
      mockedAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await loadFromCache('test-key');

      expect(result).toBeNull();
    });

    it('should handle JSON parse errors gracefully and clear corrupted cache (Issue #6)', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockedAsyncStorage.getItem.mockResolvedValueOnce('invalid json');

      const result = await loadFromCache('test-key');

      expect(result).toBeNull();
      expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('cache_test-key');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Corrupted cache cleared'),
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('should clear cache with invalid structure (Issue #6)', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      // Missing 'data' property
      mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ timestamp: 1000000 }));

      const result = await loadFromCache('test-key');

      expect(result).toBeNull();
      expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('cache_test-key');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid cache structure cleared')
      );
      consoleWarnSpy.mockRestore();
    });

    it('should clear cache with null data (Issue #6)', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ data: null, timestamp: 1000000 }));

      const result = await loadFromCache('test-key');

      expect(result).toBeNull();
      expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('cache_test-key');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid cache structure cleared')
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('clearCache', () => {
    it('should remove cache entry', async () => {
      await clearCache('test-key');

      expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('cache_test-key');
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockedAsyncStorage.removeItem.mockRejectedValueOnce(new Error('Storage error'));

      await clearCache('test-key');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('clearAllCache', () => {
    it('should remove all cache entries', async () => {
      mockedAsyncStorage.getAllKeys.mockResolvedValueOnce([
        'cache_key1',
        'cache_key2',
        'other_key',
      ]);

      await clearAllCache();

      expect(mockedAsyncStorage.multiRemove).toHaveBeenCalledWith(['cache_key1', 'cache_key2']);
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockedAsyncStorage.getAllKeys.mockRejectedValueOnce(new Error('Storage error'));

      await clearAllCache();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('hasValidCache', () => {
    it('should return true for valid cache', async () => {
      const cachedData = {
        data: { id: 1 },
        timestamp: 1000000 - 1000 * 60 * 60, // 1 hour ago
      };

      mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(cachedData));

      const result = await hasValidCache('test-key');

      expect(result).toBe(true);
    });

    it('should return false for expired cache', async () => {
      const cachedData = {
        data: { id: 1 },
        timestamp: 1000000 - 1000 * 60 * 60 * 25, // 25 hours ago
      };

      mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(cachedData));

      const result = await hasValidCache('test-key');

      expect(result).toBe(false);
    });

    it('should return false for missing cache', async () => {
      mockedAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await hasValidCache('test-key');

      expect(result).toBe(false);
    });
  });

  describe('getCacheAge', () => {
    it('should return cache age in milliseconds', async () => {
      const timestamp = 1000000 - 1000 * 60 * 60; // 1 hour ago
      const cachedData = {
        data: { id: 1 },
        timestamp,
      };

      mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(cachedData));

      const result = await getCacheAge('test-key');

      expect(result).toBe(1000 * 60 * 60); // 1 hour in ms
    });

    it('should return null for missing cache', async () => {
      mockedAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await getCacheAge('test-key');

      expect(result).toBeNull();
    });

    it('should clear corrupted cache on JSON parse error (Issue #6)', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockedAsyncStorage.getItem.mockResolvedValueOnce('invalid json');

      const result = await getCacheAge('test-key');

      expect(result).toBeNull();
      expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('cache_test-key');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Corrupted cache cleared'),
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('should clear cache with invalid structure in getCacheAge (Issue #6)', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      // Missing 'timestamp' property
      mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ data: { id: 1 } }));

      const result = await getCacheAge('test-key');

      expect(result).toBeNull();
      expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('cache_test-key');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid cache structure cleared')
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('hasAnyValidCache', () => {
    it('should return true if at least one cache exists', async () => {
      mockedAsyncStorage.getItem
        .mockResolvedValueOnce(null) // key1 - no cache
        .mockResolvedValueOnce(JSON.stringify({ data: { id: 1 }, timestamp: 1000000 - 1000 })); // key2 - valid cache

      const result = await hasAnyValidCache(['key1', 'key2']);

      expect(result).toBe(true);
    });

    it('should return false if no cache exists', async () => {
      mockedAsyncStorage.getItem.mockResolvedValue(null);

      const result = await hasAnyValidCache(['key1', 'key2']);

      expect(result).toBe(false);
    });
  });

  describe('getOldestCacheAge', () => {
    it('should return oldest cache age', async () => {
      const timestamp1 = 1000000 - 1000 * 60 * 60; // 1 hour ago
      const timestamp2 = 1000000 - 1000 * 60 * 60 * 2; // 2 hours ago
      
      mockedAsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify({ data: { id: 1 }, timestamp: timestamp1 }))
        .mockResolvedValueOnce(JSON.stringify({ data: { id: 2 }, timestamp: timestamp2 }));

      const result = await getOldestCacheAge(['key1', 'key2']);

      expect(result).toBe(1000 * 60 * 60 * 2); // 2 hours (oldest)
    });

    it('should return null if no cache exists', async () => {
      mockedAsyncStorage.getItem.mockResolvedValue(null);

      const result = await getOldestCacheAge(['key1', 'key2']);

      expect(result).toBeNull();
    });
  });
});


