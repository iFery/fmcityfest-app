/**
 * Environment configuration helper
 * Provides type-safe access to environment variables
 */

import Constants from 'expo-constants';

export type Environment = 'development' | 'production' | 'preview';

interface AppConfig {
  apiUrl: string;
  environment: Environment;
  isProduction: boolean;
  isDevelopment: boolean;
}

/**
 * Get app configuration from Expo Constants
 */
export function getAppConfig(): AppConfig {
  const extra = Constants.expoConfig?.extra || {};
  
  return {
    apiUrl: extra.apiUrl || 'https://www.fmcityfest.cz/api/mobile-app',
    environment: (extra.environment || 'development') as Environment,
    isProduction: extra.isProduction ?? false,
    isDevelopment: extra.isDevelopment ?? true,
  };
}

/**
 * Get current environment
 */
export function getEnvironment(): Environment {
  return getAppConfig().environment;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getAppConfig().isProduction;
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getAppConfig().isDevelopment;
}

/**
 * Get API URL
 */
export function getApiUrl(): string {
  return getAppConfig().apiUrl;
}


