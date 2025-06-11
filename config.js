// API URLs
export const API_URL = 'https://www.fmcityfest.cz/api/mobile-app';

// Cache configuration
export const CACHE_CONFIG = {
  DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  KEYS: {
    PROGRAM: 'cachedProgramData',
    ARTISTS: 'cachedArtists',
    LAST_UPDATED: 'lastDataUpdate',
  },
};

// Notification configuration
export const NOTIFICATION_CONFIG = {
  CHANNEL_ID: 'festival-notifications',
  CHANNEL_NAME: 'Festival Notifications',
  CHANNEL_DESCRIPTION: 'Notifications for festival events',
};

// App configuration
export const APP_CONFIG = {
  NAME: 'Festival App',
  VERSION: '1.0.0',
}; 