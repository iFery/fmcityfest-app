import { checkForUpdate } from '../updateService';
import { remoteConfigService } from '../remoteConfig';
import { crashlyticsService } from '../crashlytics';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';

jest.mock('../remoteConfig', () => ({
  remoteConfigService: {
    getString: jest.fn(),
    getBoolean: jest.fn(),
  },
}));

jest.mock('../crashlytics', () => ({
  crashlyticsService: {
    log: jest.fn(),
    recordError: jest.fn(),
  },
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(),
  },
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      version: '1.0.0',
      android: { package: 'com.fmcityfest.app' },
    },
    manifest2: {
      extra: { expoClient: { version: '1.0.0' } },
    },
  },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Linking: {
    canOpenURL: jest.fn().mockResolvedValue(true),
    openURL: jest.fn(),
  },
}));

describe('updateService.checkForUpdate', () => {
  const mockedRemoteConfig = remoteConfigService as jest.Mocked<typeof remoteConfigService>;
  const mockedCrashlytics = crashlyticsService as jest.Mocked<typeof crashlyticsService>;
  const mockedNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
  const mockedConstants = Constants as typeof Constants;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedConstants.expoConfig = {
      version: '1.0.0',
      android: { package: 'com.fmcityfest.app' },
    } as any;
  });

  it('returns none when offline', async () => {
    mockedNetInfo.fetch.mockResolvedValue({ isInternetReachable: false } as any);

    const result = await checkForUpdate();

    expect(result).toEqual({ type: 'none', latestVersion: '1.0.0' });
    expect(mockedRemoteConfig.getString).not.toHaveBeenCalled();
    expect(mockedCrashlytics.log).toHaveBeenCalledWith('update_check_skipped_offline');
  });

  it('returns forced update when below minimum and force enabled', async () => {
    mockedNetInfo.fetch.mockResolvedValue({ isInternetReachable: true } as any);
    mockedRemoteConfig.getString.mockImplementation((key: string, fallback: string) => {
      if (key === 'latest_app_version') return '1.2.0';
      if (key === 'min_required_version') return '1.1.0';
      if (key === 'update_whats_new') return '["A","B"]';
      return fallback;
    });
    mockedRemoteConfig.getBoolean.mockReturnValue(true);

    const result = await checkForUpdate();

    expect(result.type).toBe('forced');
    expect(result.latestVersion).toBe('1.2.0');
    expect(result.whatsNew).toEqual(['A', 'B']);
  });

  it('returns optional update when below latest but above minimum', async () => {
    mockedNetInfo.fetch.mockResolvedValue({ isInternetReachable: true } as any);
    mockedConstants.expoConfig = {
      version: '1.0.5',
      android: { package: 'com.fmcityfest.app' },
    } as any;

    mockedRemoteConfig.getString.mockImplementation((key: string, fallback: string) => {
      if (key === 'latest_app_version') return '1.2.0';
      if (key === 'min_required_version') return '1.0.0';
      if (key === 'update_whats_new') return 'foo, bar';
      return fallback;
    });
    mockedRemoteConfig.getBoolean.mockReturnValue(false);

    const result = await checkForUpdate();

    expect(result.type).toBe('optional');
    expect(result.latestVersion).toBe('1.2.0');
    expect(result.whatsNew).toEqual(['foo', 'bar']);
  });

  it('returns none when up to date', async () => {
    mockedNetInfo.fetch.mockResolvedValue({ isInternetReachable: true } as any);
    mockedConstants.expoConfig = {
      version: '1.2.0',
      android: { package: 'com.fmcityfest.app' },
    } as any;

    mockedRemoteConfig.getString.mockImplementation((key: string, fallback: string) => {
      if (key === 'latest_app_version') return '1.2.0';
      if (key === 'min_required_version') return '1.0.0';
      return fallback;
    });
    mockedRemoteConfig.getBoolean.mockReturnValue(false);

    const result = await checkForUpdate();

    expect(result).toEqual({ type: 'none', latestVersion: '1.2.0' });
  });

  it('returns none on error and records error', async () => {
    const error = new Error('netinfo failed');
    mockedNetInfo.fetch.mockRejectedValue(error);

    const result = await checkForUpdate();

    expect(result.type).toBe('none');
    expect(mockedCrashlytics.recordError).toHaveBeenCalled();
  });
});
