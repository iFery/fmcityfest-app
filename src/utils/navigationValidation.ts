/**
 * Navigation Parameter Validation
 * Validates deep link and notification parameters before navigation
 */

import type { RootStackParamList } from '../navigation/linking';

/**
 * Validate artist ID parameter
 */
export function validateArtistId(artistId: string | undefined | null): boolean {
  if (!artistId || typeof artistId !== 'string') {
    return false;
  }
  // Artist ID should be non-empty string (numeric or alphanumeric)
  return artistId.trim().length > 0;
}

/**
 * Validate news ID parameter
 */
export function validateNewsId(newsId: string | undefined | null): boolean {
  if (!newsId || typeof newsId !== 'string') {
    return false;
  }
  // News ID should be non-empty string
  return newsId.trim().length > 0;
}

/**
 * Validate navigation parameters for a screen
 */
export function validateNavigationParams(
  screen: keyof RootStackParamList,
  params?: RootStackParamList[keyof RootStackParamList]
): { valid: boolean; error?: string } {
  switch (screen) {
    case 'ArtistDetail':
      if (!params || typeof params !== 'object') {
        return { valid: false, error: 'Missing artist parameters' };
      }
      const artistParams = params as { artistId: string; artistName: string };
      if (!validateArtistId(artistParams.artistId)) {
        return { valid: false, error: 'Invalid artist ID' };
      }
      return { valid: true };

    case 'NewsDetail':
      if (!params || typeof params !== 'object') {
        return { valid: false, error: 'Missing news parameters' };
      }
      const newsParams = params as { newsId: string; newsTitle: string };
      if (!validateNewsId(newsParams.newsId)) {
        return { valid: false, error: 'Invalid news ID' };
      }
      return { valid: true };

    case 'HomeMain':
    case 'ProgramMain':
    case 'ArtistsMain':
    case 'FavoritesMain':
    case 'InfoMain':
    case 'Settings':
    case 'Partners':
    case 'News':
    case 'FAQ':
    case 'Map':
    case 'Debug':
      // These screens don't require parameters
      return { valid: true };

    default:
      return { valid: true };
  }
}

/**
 * Sanitize and normalize navigation parameters
 */
export function sanitizeNavigationParams(
  screen: keyof RootStackParamList,
  params?: RootStackParamList[keyof RootStackParamList]
): RootStackParamList[keyof RootStackParamList] | undefined {
  if (!params) {
    return undefined;
  }

  switch (screen) {
    case 'ArtistDetail': {
      const artistParams = params as { artistId: string; artistName: string };
      return {
        artistId: String(artistParams.artistId || '').trim(),
        artistName: String(artistParams.artistName || 'Interpret').trim(),
      };
    }

    case 'NewsDetail': {
      const newsParams = params as { newsId: string; newsTitle: string };
      return {
        newsId: String(newsParams.newsId || '').trim(),
        newsTitle: String(newsParams.newsTitle || 'Novinka').trim(),
      };
    }

    default:
      return params;
  }
}


