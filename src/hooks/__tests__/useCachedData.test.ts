import { renderHook, waitFor } from '@testing-library/react-native';
import { useCachedData } from '../useCachedData';
import { loadFromCache, saveToCache } from '../../utils/cacheManager';

jest.mock('../../utils/cacheManager', () => ({
  loadFromCache: jest.fn(),
  saveToCache: jest.fn(),
}));

describe('useCachedData', () => {
  const mockedLoad = loadFromCache as jest.Mock;
  const mockedSave = saveToCache as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses cached data without loading when cache is fresh', async () => {
    const cached = [{ id: '1' }];
    mockedLoad.mockResolvedValue(cached);

    const fetchFn = jest.fn().mockResolvedValue([{ id: '2' }]);

    const { result } = renderHook(() =>
      useCachedData({
        cacheKey: 'artists',
        fetchFn,
        defaultData: [],
        errorMessage: 'error',
      })
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(cached);
    });

    expect(result.current.loading).toBe(false);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('fetches and caches when no cache exists', async () => {
    mockedLoad.mockResolvedValue(null);
    const fetched = [{ id: '10' }];
    const fetchFn = jest.fn().mockResolvedValue(fetched);

    const { result } = renderHook(() =>
      useCachedData({
        cacheKey: 'news',
        fetchFn,
        defaultData: [],
        errorMessage: 'error',
      })
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(fetched);
    });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(mockedSave).toHaveBeenCalledWith('news', fetched);
  });

});
