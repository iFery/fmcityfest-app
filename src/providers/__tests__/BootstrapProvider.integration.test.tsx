/**
 * Integration tests for BootstrapProvider + App UI
 * Tests actual UI rendering and user interactions
 */

import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { preloadAllData } from '../../services/preloadService';
import { hasAnyValidCache, getOldestCacheAge } from '../../utils/cacheManager';
import { BootstrapProvider, useBootstrap } from '../BootstrapProvider';
import { OfflineBlockedScreen } from '../../screens/OfflineBlockedScreen';
import AppNavigator from '../../navigation/AppNavigator';

// Mock dependencies
jest.mock('../../services/preloadService');
jest.mock('../../utils/cacheManager');
jest.mock('../../navigation/AppNavigator', () => {
  return jest.fn(() => null);
});
jest.mock('../../components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockedNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
const mockedPreloadAllData = preloadAllData as jest.MockedFunction<typeof preloadAllData>;
const mockedHasAnyValidCache = hasAnyValidCache as jest.MockedFunction<typeof hasAnyValidCache>;
const mockedGetOldestCacheAge = getOldestCacheAge as jest.MockedFunction<typeof getOldestCacheAge>;

// Mock AppNavigator to return a simple test component
(AppNavigator as jest.Mock).mockImplementation(() => {
  const React = require('react');
  const { View } = require('react-native');
  return React.createElement(View, { testID: 'app-navigator' }, 'App Content');
});

describe('BootstrapProvider - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const TestApp = () => {
    const { state } = useBootstrap();
    
    if (state === 'offline-blocked') {
      return <OfflineBlockedScreen />;
    }
    
    if (state === 'ready-online' || state === 'ready-offline') {
      return <AppNavigator />;
    }
    
    return null;
  };

  describe('Offline-blocked screen rendering', () => {
    it('should render OfflineBlockedScreen when state is offline-blocked', async () => {
      // Setup: offline, no cache
      mockedNetInfo.fetch.mockResolvedValue({
        isInternetReachable: false,
      } as any);
      mockedHasAnyValidCache.mockResolvedValue(false);

      render(
        <BootstrapProvider>
          <TestApp />
        </BootstrapProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Jste offline')).toBeTruthy();
      }, { timeout: 3000 });

      // Verify retry button exists
      expect(screen.getByText('Zkusit znovu')).toBeTruthy();
      expect(screen.getByText('Otevřít nastavení připojení')).toBeTruthy();
    });
  });

  describe('Ready-offline screen shows content', () => {
    it('should render app content when offline but cache exists', async () => {
      // Setup: offline, cache exists
      mockedNetInfo.fetch.mockResolvedValue({
        isInternetReachable: false,
      } as any);
      mockedHasAnyValidCache.mockResolvedValue(true);
      mockedGetOldestCacheAge.mockResolvedValue(1000 * 60 * 60);

      render(
        <BootstrapProvider>
          <TestApp />
        </BootstrapProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('app-navigator')).toBeTruthy();
      }, { timeout: 5000 });

      // Should NOT show offline-blocked screen
      expect(screen.queryByText('Jste offline')).toBeNull();
    });
  });

  describe('Loader -> app flow', () => {
    it('should show loader then app when online and fetch succeeds', async () => {
      // Setup: online, fetch succeeds and creates cache
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

      const { queryByTestId } = render(
        <BootstrapProvider>
          <TestApp />
        </BootstrapProvider>
      );

      // Initially should be loading (no app content)
      expect(queryByTestId('app-navigator')).toBeNull();

      // Wait for bootstrap to complete
      await waitFor(() => {
        expect(queryByTestId('app-navigator')).toBeTruthy();
      }, { timeout: 5000 });

      // App should be rendered
      expect(screen.getByTestId('app-navigator')).toBeTruthy();
    });

    it('should transition from loading to ready-online', async () => {
      // Setup: online, fetch succeeds and creates cache
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

      const { queryByTestId } = render(
        <BootstrapProvider>
          <TestApp />
        </BootstrapProvider>
      );

      // Initially loading
      expect(queryByTestId('app-navigator')).toBeNull();

      // Wait for transition
      await waitFor(() => {
        expect(queryByTestId('app-navigator')).toBeTruthy();
      }, { timeout: 5000 });
    });
  });

  describe('Retry functionality in UI', () => {
    it('should retry bootstrap when retry button is pressed', async () => {
      // Setup: offline, no cache
      mockedNetInfo.fetch.mockResolvedValue({
        isInternetReachable: false,
      } as any);
      mockedHasAnyValidCache.mockResolvedValue(false);

      render(
        <BootstrapProvider>
          <TestApp />
        </BootstrapProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Jste offline')).toBeTruthy();
      });

      // Clear mocks
      jest.clearAllMocks();

      // Setup: online, fetch succeeds and creates cache
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

      // Get retry button and press it
      const retryButton = screen.getByText('Zkusit znovu');
      fireEvent.press(retryButton);

      // Wait for transition to app
      await waitFor(() => {
        expect(screen.getByTestId('app-navigator')).toBeTruthy();
      }, { timeout: 5000 });

      // Should no longer show offline screen
      expect(screen.queryByText('Jste offline')).toBeNull();
    });
  });
});

