/**
 * Service for handling notification data and converting it to navigation routes
 */

import { NotificationData, NavigationRoute, RootStackParamList } from '../types/navigation';

/**
 * Converts notification data to a navigation route
 * @param data - The data from remoteMessage.data
 * @returns Navigation route or null if invalid
 */
export function notificationDataToRoute(
  data: NotificationData | undefined
): NavigationRoute | null {
  if (!data || !data.targetScreen) {
    console.warn('[NotificationNavigation] Missing targetScreen in notification data', data);
    return null;
  }

  const screen = data.targetScreen as keyof RootStackParamList;

  // Validate screen name
  const validScreens: Array<keyof RootStackParamList> = ['Home', 'Post', 'NotificationTest'];
  if (!validScreens.includes(screen)) {
    console.warn(
      `[NotificationNavigation] Invalid targetScreen: ${screen}. Valid screens: ${validScreens.join(', ')}`
    );
    return null;
  }

  // Build params based on screen type
  const params: Record<string, string> = {};

  switch (screen) {
    case 'Post':
      if (!data.postId && !data.itemId) {
        console.warn(
          '[NotificationNavigation] Post screen requires postId or itemId in notification data',
          data
        );
        return null;
      }
      params.postId = data.postId || data.itemId || '';
      break;

    case 'Home':
    case 'NotificationTest':
      // No params needed
      break;

    default:
      console.warn(`[NotificationNavigation] Unhandled screen type: ${screen}`);
      return null;
  }

  return {
    screen,
    params: Object.keys(params).length > 0 ? params : undefined,
  };
}

/**
 * Safely extracts notification data from remote message
 * @param remoteMessage - The remote message from Firebase
 * @returns Notification data or null if invalid
 */
export function extractNotificationData(remoteMessage: any): NotificationData | null {
  if (!remoteMessage || !remoteMessage.data) {
    console.warn('[NotificationNavigation] Missing data in remote message', remoteMessage);
    return null;
  }

  return remoteMessage.data as NotificationData;
}
