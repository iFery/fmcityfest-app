import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useFavorites } from '../useFavorites';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { useNotificationPreferencesStore } from '../../stores/notificationPreferencesStore';
import { useTimeline } from '../../contexts/TimelineContext';
import { loadFromCache } from '../../utils/cacheManager';

jest.mock('../../stores/favoritesStore');
jest.mock('../../stores/notificationPreferencesStore');
jest.mock('../../contexts/TimelineContext');
jest.mock('../../services/notifications', () => ({
  notificationService: {
    getPermissionStatus: jest.fn().mockResolvedValue('denied'),
    cancelAllFavoriteNotifications: jest.fn(),
    updateAllEventNotifications: jest.fn(),
  },
}));

jest.mock('../../utils/cacheManager', () => ({
  loadFromCache: jest.fn(),
}));

describe('useFavorites', () => {
  const mockedFavoritesStore = useFavoritesStore as unknown as jest.Mock;
  const mockedPreferencesStore = useNotificationPreferencesStore as unknown as jest.Mock;
  const mockedTimeline = useTimeline as jest.Mock;
  const mockedLoadFromCache = loadFromCache as jest.Mock;

  let favoriteArtists: string[];
  let favoriteEvents: string[];
  let toggleEventFavorite: jest.Mock;
  let isEventFavorite: jest.Mock;

  const timelineData = {
    events: [
      { id: 'e1', interpret_id: 1, start: '2026-01-01T10:00:00Z' },
    ],
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();

    favoriteArtists = [];
    favoriteEvents = [];
    toggleEventFavorite = jest.fn();
    isEventFavorite = jest.fn((id: string) => favoriteEvents.includes(id));

    mockedFavoritesStore.mockImplementation(() => ({
      favoriteArtists,
      favoriteEvents,
      toggleEventFavorite,
      isEventFavorite,
      clearAll: jest.fn(),
      clearLegacyArtists: jest.fn(),
    }));

    mockedPreferencesStore.mockImplementation(() => ({
      favoriteArtistsNotifications: true,
      favoriteArtistsNotificationLeadMinutes: 10,
    }));

    mockedTimeline.mockReturnValue({ timelineData, loading: false, error: null, refetch: jest.fn() });

    mockedLoadFromCache.mockResolvedValue([]);
  });

  it('migrates legacy artist favorites to event favorites', async () => {
    favoriteArtists = ['1'];

    renderHook(() => useFavorites());

    await waitFor(() => {
      expect(toggleEventFavorite).toHaveBeenCalledWith('e1');
    });
  });

  it('toggles event favorite directly', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggleEvent('e1');
    });

    expect(toggleEventFavorite).toHaveBeenCalledWith('e1');
  });
});
