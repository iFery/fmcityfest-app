/**
 * Navigation helper for notifications
 * Separated to avoid circular dependencies
 * Uses navigation queue to ensure navigation is ready
 */

import { parseNotificationToNavParams } from '../navigation/linking';
import { navigationQueue } from '../navigation/navigationQueue';
import { validateNavigationParams, sanitizeNavigationParams } from '../utils/navigationValidation';

/**
 * Handle navigation from notification data
 * Validates parameters and uses navigation queue to ensure navigation is ready
 */
export function handleNotificationNavigation(data: Record<string, unknown>): void {
  const navParams = parseNotificationToNavParams(data);
  
  if (!navParams) {
    console.warn('[NotificationNavigation] Invalid notification data, no navigation params');
    return;
  }

  // Validate parameters before navigation
  const validation = validateNavigationParams(navParams.screen, navParams.params);
  if (!validation.valid) {
    console.warn('[NotificationNavigation] Invalid navigation params:', validation.error);
    // Navigate to home as fallback
    navigationQueue.enqueue('HomeMain');
    return;
  }

  // Sanitize parameters
  const sanitizedParams = navParams.params
    ? sanitizeNavigationParams(navParams.screen, navParams.params)
    : undefined;

  // Queue navigation (will execute when navigation is ready)
  navigationQueue.enqueue(navParams.screen, sanitizedParams);
}
