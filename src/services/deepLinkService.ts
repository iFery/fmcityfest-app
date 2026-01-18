/**
 * Deep Link Service
 * Handles initial URL on cold start and ongoing deep link events
 * Integrates with navigation queue to ensure navigation is ready
 */

import * as Linking from 'expo-linking';
import { navigationQueue } from '../navigation/navigationQueue';
import { validateNavigationParams, sanitizeNavigationParams } from '../utils/navigationValidation';
import { parseNotificationToNavParams } from '../navigation/linking';
import type { RootStackParamList } from '../navigation/linking';

class DeepLinkService {
  private initialUrlProcessed = false;
  private urlListener: ReturnType<typeof Linking.addEventListener> | null = null;

  /**
   * Initialize deep link handling
   * Should be called after app bootstrap is complete
   */
  async initialize(): Promise<void> {
    // Process initial URL if app was opened via deep link
    await this.processInitialURL();

    // Listen for deep links while app is running
    this.setupURLListener();
  }

  /**
   * Process initial URL on cold start
   */
  private async processInitialURL(): Promise<void> {
    try {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('[DeepLinkService] Initial URL:', initialUrl);
        // Wait a bit for navigation to be ready, then process
        setTimeout(() => {
          this.handleDeepLink(initialUrl);
          this.initialUrlProcessed = true;
        }, 500);
      } else {
        this.initialUrlProcessed = true;
      }
    } catch (error) {
      console.error('[DeepLinkService] Error getting initial URL:', error);
      this.initialUrlProcessed = true;
    }
  }

  /**
   * Setup listener for deep links while app is running
   */
  private setupURLListener(): void {
    this.urlListener = Linking.addEventListener('url', (event) => {
      console.log('[DeepLinkService] Deep link received:', event.url);
      this.handleDeepLink(event.url);
    });
  }

  /**
   * Handle deep link URL
   * Parses URL and navigates to appropriate screen
   */
  private handleDeepLink(url: string): void {
    try {
      // Parse URL using Expo Linking
      const parsed = Linking.parse(url);
      
      // Extract path and params
      const path = parsed.path || '';
      const queryParams = parsed.queryParams || {};

      // Parse to navigation params using our linking config
      const navParams = this.parseURLToNavParams(path, queryParams);

      if (!navParams) {
        console.warn('[DeepLinkService] Could not parse deep link:', url);
        // Fallback to home
        navigationQueue.enqueue('HomeMain');
        return;
      }

      // Validate parameters
      const validation = validateNavigationParams(navParams.screen, navParams.params);
      if (!validation.valid) {
        console.warn('[DeepLinkService] Invalid navigation params:', validation.error);
        // Fallback to home
        navigationQueue.enqueue('HomeMain');
        return;
      }

      // Sanitize parameters
      const sanitizedParams = navParams.params
        ? sanitizeNavigationParams(navParams.screen, navParams.params)
        : undefined;

      // Queue navigation
      navigationQueue.enqueue(navParams.screen, sanitizedParams);
    } catch (error) {
      console.error('[DeepLinkService] Error handling deep link:', error);
      // Fallback to home on error
      navigationQueue.enqueue('HomeMain');
    }
  }

  /**
   * Parse URL path and params to navigation params
   */
  private parseURLToNavParams(
    path: string,
    queryParams: Record<string, any>
  ): { screen: keyof RootStackParamList; params?: RootStackParamList[keyof RootStackParamList] } | null {
    // Remove leading slash
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // Handle artist detail: artist/:artistId
    if (cleanPath.startsWith('artist/')) {
      const artistId = cleanPath.split('/')[1] || queryParams.artistId;
      if (artistId) {
        return {
          screen: 'ArtistDetail',
          params: {
            artistId: String(artistId),
            artistName: queryParams.artistName
              ? decodeURIComponent(String(queryParams.artistName))
              : 'Interpret',
          },
        };
      }
    }

    // Handle news detail: news/:newsId
    if (cleanPath.startsWith('news/')) {
      const newsId = cleanPath.split('/')[1] || queryParams.newsId;
      if (newsId) {
        return {
          screen: 'NewsDetail',
          params: {
            newsId: String(newsId),
            newsTitle: queryParams.newsTitle
              ? decodeURIComponent(String(queryParams.newsTitle))
              : 'Novinka',
          },
        };
      }
    }

    // Handle simple routes
    const routeMap: Record<string, keyof RootStackParamList> = {
      'home': 'HomeMain',
      'program': 'ProgramMain',
      'artists': 'ArtistsMain',
      'favorites': 'FavoritesMain',
      'info': 'InfoMain',
      'settings': 'Settings',
      'partners': 'Partners',
      'news': 'News',
      'faq': 'FAQ',
      'map': 'Map',
      'debug': 'Debug',
    };

    if (routeMap[cleanPath]) {
      return { screen: routeMap[cleanPath] };
    }

    // Default to home
    return { screen: 'HomeMain' };
  }

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    if (this.urlListener) {
      this.urlListener.remove();
      this.urlListener = null;
    }
  }
}

export const deepLinkService = new DeepLinkService();


