/**
 * Navigation types and schemas for push notification handling
 */

export type RootStackParamList = {
  Home: undefined;
  Post: { postId: string };
  NotificationTest: undefined;
};

/**
 * Notification payload schema
 * This defines the expected structure of remoteMessage.data
 */
export interface NotificationData {
  // Required: screen to navigate to
  targetScreen?: 'Home' | 'Post' | 'NotificationTest';

  // Optional: ID for the target item (e.g., postId)
  postId?: string;
  itemId?: string;

  // Optional: additional data
  [key: string]: string | undefined;
}

/**
 * Navigation route derived from notification data
 */
export interface NavigationRoute {
  screen: keyof RootStackParamList;
  params?: Record<string, string>;
}
