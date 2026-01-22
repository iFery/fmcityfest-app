import { handleNotificationNavigation } from '../notificationNavigation';
import { navigationQueue } from '../../navigation/navigationQueue';
import { parseNotificationToNavParams } from '../../navigation/linking';
import { validateNavigationParams, sanitizeNavigationParams } from '../../utils/navigationValidation';

jest.mock('../../navigation/navigationQueue', () => ({
  navigationQueue: {
    enqueue: jest.fn(),
  },
}));

jest.mock('../../navigation/linking', () => ({
  parseNotificationToNavParams: jest.fn(),
}));

jest.mock('../../utils/navigationValidation', () => ({
  validateNavigationParams: jest.fn(),
  sanitizeNavigationParams: jest.fn(),
}));

describe('handleNotificationNavigation', () => {
  const mockedQueue = navigationQueue as jest.Mocked<typeof navigationQueue>;
  const mockedParse = parseNotificationToNavParams as jest.Mock;
  const mockedValidate = validateNavigationParams as jest.Mock;
  const mockedSanitize = sanitizeNavigationParams as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing when notification data cannot be parsed', () => {
    mockedParse.mockReturnValue(null);

    handleNotificationNavigation({});

    expect(mockedQueue.enqueue).not.toHaveBeenCalled();
  });

  it('falls back to home when params are invalid', () => {
    mockedParse.mockReturnValue({
      screen: 'ArtistDetail',
      params: { artistId: '', artistName: '' },
    });
    mockedValidate.mockReturnValue({ valid: false, error: 'Invalid' });

    handleNotificationNavigation({});

    expect(mockedQueue.enqueue).toHaveBeenCalledWith('HomeMain');
  });

  it('navigates with sanitized params when valid', () => {
    mockedParse.mockReturnValue({
      screen: 'ArtistDetail',
      params: { artistId: '123', artistName: 'Muse' },
    });
    mockedValidate.mockReturnValue({ valid: true });
    mockedSanitize.mockReturnValue({ artistId: '123', artistName: 'Muse' });

    handleNotificationNavigation({});

    expect(mockedQueue.enqueue).toHaveBeenCalledWith('ArtistDetail', {
      artistId: '123',
      artistName: 'Muse',
    });
  });
});
