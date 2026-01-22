import { deepLinkService } from '../deepLinkService';
import * as Linking from 'expo-linking';
import { navigationQueue } from '../../navigation/navigationQueue';
import { validateNavigationParams, sanitizeNavigationParams } from '../../utils/navigationValidation';

jest.mock('expo-linking', () => ({
  parse: jest.fn(),
  getInitialURL: jest.fn(),
  addEventListener: jest.fn(),
}));

jest.mock('../../navigation/navigationQueue', () => ({
  navigationQueue: {
    enqueue: jest.fn(),
  },
}));

jest.mock('../../utils/navigationValidation', () => ({
  validateNavigationParams: jest.fn(),
  sanitizeNavigationParams: jest.fn(),
}));

describe('deepLinkService', () => {
  const mockedLinking = Linking as jest.Mocked<typeof Linking>;
  const mockedQueue = navigationQueue as jest.Mocked<typeof navigationQueue>;
  const mockedValidate = validateNavigationParams as jest.Mock;
  const mockedSanitize = sanitizeNavigationParams as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates to artist detail with sanitized params', () => {
    mockedLinking.parse.mockReturnValue({
      path: 'artist/123',
      queryParams: { artistName: 'Muse' },
    } as any);
    mockedValidate.mockReturnValue({ valid: true });
    mockedSanitize.mockReturnValue({ artistId: '123', artistName: 'Muse' });

    (deepLinkService as any).handleDeepLink('fmcityfest://artist/123?artistName=Muse');

    expect(mockedValidate).toHaveBeenCalledWith('ArtistDetail', {
      artistId: '123',
      artistName: 'Muse',
    });
    expect(mockedQueue.enqueue).toHaveBeenCalledWith('ArtistDetail', {
      artistId: '123',
      artistName: 'Muse',
    });
  });

  it('falls back to home when params are invalid', () => {
    mockedLinking.parse.mockReturnValue({
      path: 'artist/123',
      queryParams: { artistName: 'Muse' },
    } as any);
    mockedValidate.mockReturnValue({ valid: false, error: 'Invalid' });

    (deepLinkService as any).handleDeepLink('fmcityfest://artist/123');

    expect(mockedQueue.enqueue).toHaveBeenCalledWith('HomeMain');
  });

  it('falls back to home for unknown paths', () => {
    mockedLinking.parse.mockReturnValue({
      path: 'unknown/path',
      queryParams: {},
    } as any);
    mockedValidate.mockReturnValue({ valid: true });

    (deepLinkService as any).handleDeepLink('fmcityfest://unknown/path');

    expect(mockedQueue.enqueue).toHaveBeenCalledWith('HomeMain', undefined);
  });
});
