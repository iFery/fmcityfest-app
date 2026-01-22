/**
 * Navigation Queue System
 * Queues navigation actions until React Navigation is ready
 * Prevents race conditions when deep links/notifications arrive before navigation container is initialized
 */

import { navigationRef } from './navigationRef';
import type { RootStackParamList } from './linking';

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

