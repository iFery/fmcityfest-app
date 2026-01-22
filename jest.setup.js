// Jest setup file for global test configuration
import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(),
    addEventListener: jest.fn(() => jest.fn()),
  },
  NetInfoStateType: {
    unknown: 'unknown',
    none: 'none',
    cellular: 'cellular',
    wifi: 'wifi',
    bluetooth: 'bluetooth',
    ethernet: 'ethernet',
    wimax: 'wimax',
    vpn: 'vpn',
    other: 'other',
  },
}));

// Mock Firebase services
jest.mock('./src/services/firebase', () => ({
  initializeFirebase: jest.fn(() => Promise.resolve()),
}));

jest.mock('./src/services/crashlytics', () => ({
  crashlyticsService: {
    log: jest.fn(),
    setAttribute: jest.fn(),
    recordError: jest.fn(),
  },
}));

jest.mock('./src/services/remoteConfig', () => ({
  remoteConfigService: {
    initialize: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('./src/services/notifications', () => ({
  notificationService: {
    getToken: jest.fn(() => Promise.resolve(null)),
    setupNotificationListeners: jest.fn(() => ({
      unsubscribeForeground: jest.fn(),
      notificationListener: { remove: jest.fn() },
    })),
  },
}));

// Mock React Native components
jest.doMock(
  'react-native/Libraries/Animated/NativeAnimatedHelper',
  () => ({}),
  { virtual: true }
);

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
