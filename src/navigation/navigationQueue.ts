/**
 * Navigation Queue System
 * Queues navigation actions until React Navigation is ready
 * Prevents race conditions when deep links/notifications arrive before navigation container is initialized
 */

import { navigationRef } from './navigationRef';
import type { RootStackParamList } from './linking';

type TabRoute = 'Home' | 'Program' | 'Artists' | 'Favorites' | 'Info';

const nestedRouteMap: Partial<
  Record<
    keyof RootStackParamList,
    {
      tab: TabRoute;
      screen: keyof RootStackParamList;
    }
  >
> = {
  HomeMain: { tab: 'Home', screen: 'HomeMain' },
  ArtistDetail: { tab: 'Home', screen: 'ArtistDetail' },
  NewsDetail: { tab: 'Home', screen: 'NewsDetail' },
  ProgramMain: { tab: 'Program', screen: 'ProgramMain' },
  ProgramHorizontal: { tab: 'Program', screen: 'ProgramHorizontal' },
  ArtistsMain: { tab: 'Artists', screen: 'ArtistsMain' },
  FavoritesMain: { tab: 'Favorites', screen: 'FavoritesMain' },
  SharedProgram: { tab: 'Favorites', screen: 'SharedProgram' },
  InfoMain: { tab: 'Info', screen: 'InfoMain' },
  AboutApp: { tab: 'Info', screen: 'AboutApp' },
  Feedback: { tab: 'Info', screen: 'Feedback' },
  Settings: { tab: 'Info', screen: 'Settings' },
  Partners: { tab: 'Info', screen: 'Partners' },
  News: { tab: 'Info', screen: 'News' },
  FAQ: { tab: 'Info', screen: 'FAQ' },
  Map: { tab: 'Info', screen: 'Map' },
  Debug: { tab: 'Info', screen: 'Debug' },
  Notifications: { tab: 'Info', screen: 'Notifications' },
};

type QueuedNavigation = {
  screen: keyof RootStackParamList;
  params?: RootStackParamList[keyof RootStackParamList];
};

class NavigationQueue {
  private queue: QueuedNavigation[] = [];
  private isReady = false;

  /**
   * Mark navigation as ready and drain the queue
   */
  setReady() {
    this.isReady = true;
    this.drainQueue();
  }

  /**
   * Add navigation action to queue if not ready, otherwise execute immediately
   */
  enqueue(screen: keyof RootStackParamList, params?: RootStackParamList[keyof RootStackParamList]): void {
    if (this.isReady && navigationRef.current) {
      // Navigation is ready, execute immediately
      this.execute(screen, params);
    } else {
      // Queue for later execution
      this.queue.push({ screen, params });
    }
  }

  /**
   * Execute all queued navigation actions
   */
  private drainQueue(): void {
    if (!navigationRef.current) {
      // Navigation ref not available yet, wait a bit
      setTimeout(() => this.drainQueue(), 100);
      return;
    }

    while (this.queue.length > 0) {
      const action = this.queue.shift();
      if (action) {
        this.execute(action.screen, action.params);
      }
    }
  }

  /**
   * Execute a single navigation action
   */
  private execute(screen: keyof RootStackParamList, params?: RootStackParamList[keyof RootStackParamList]): void {
    if (!navigationRef.current) {
      console.warn('[NavigationQueue] Navigation ref not available');
      return;
    }

    try {
      const nestedRoute = nestedRouteMap[screen];

      if (nestedRoute) {
        console.log('[NavigationQueue] Navigating via tab', nestedRoute.tab, '->', nestedRoute.screen, params || null);
        (navigationRef.current as any).navigate(nestedRoute.tab, {
          screen: nestedRoute.screen,
          params,
        });
        return;
      }

      console.log('[NavigationQueue] Navigating directly to', screen, params || null);

      if (params !== undefined) {
        (navigationRef.current as any).navigate(screen, params);
      } else {
        (navigationRef.current as any).navigate(screen);
      }
    } catch (error) {
      console.error('[NavigationQueue] Navigation error:', error);
    }
  }

  /**
   * Clear all queued actions
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Check if navigation is ready
   */
  get ready(): boolean {
    return this.isReady;
  }
}

export const navigationQueue = new NavigationQueue();

