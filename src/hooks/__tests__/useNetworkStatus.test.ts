/**
 * Unit tests for useNetworkStatus hook
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useNetworkStatus } from '../useNetworkStatus';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(),
    addEventListener: jest.fn(),
  },
}));

const mockedNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;

describe('useNetworkStatus', () => {
  let unsubscribe: () => void;

  beforeEach(() => {
    jest.clearAllMocks();
    unsubscribe = jest.fn();
    mockedNetInfo.addEventListener.mockReturnValue(unsubscribe);
  });

  it('should initialize with network status', async () => {
    mockedNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    } as NetInfoState);

    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(true);
      expect(result.current.type).toBe('wifi');
    });
  });

  it('should update status when network changes', async () => {
    let listener: ((state: NetInfoState) => void) | null = null;

    mockedNetInfo.addEventListener.mockImplementation((callback: (state: NetInfoState) => void) => {
      listener = callback;
      return unsubscribe;
    });

    mockedNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    } as NetInfoState);

    const { result, rerender } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Simulate network change
    if (listener) {
      (listener as (state: NetInfoState) => void)({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      } as NetInfoState);
    }

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isInternetReachable).toBe(false);
      expect(result.current.type).toBe('none');
    });
  });

  it('should cleanup listener on unmount', () => {
    mockedNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    } as NetInfoState);

    const { unmount } = renderHook(() => useNetworkStatus());

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });

  it('should provide checkConnectivity function', async () => {
    mockedNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    } as NetInfoState);

    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.checkConnectivity).toBeDefined();
      expect(typeof result.current.checkConnectivity).toBe('function');
    });

    const isConnected = await result.current.checkConnectivity();

    expect(isConnected).toBe(true);
    expect(mockedNetInfo.fetch).toHaveBeenCalled();
  });
});

