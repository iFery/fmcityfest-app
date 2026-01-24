/**
 * Centralized API client for all network requests
 */

import Constants from 'expo-constants';
import { crashlyticsService } from '../services/crashlytics';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 0,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiRequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

/**
 * Centralized API client with error handling, retries, and logging
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL?: string) {
    // Get API URL from environment variable (via Expo Constants) or use provided/default
    if (baseURL) {
      this.baseURL = baseURL;
    } else {
      // Get from Expo Constants (set in app.config.js)
      const apiUrl = Constants.expoConfig?.extra?.apiUrl;
      this.baseURL = apiUrl || 'https://www.fmcityfest.cz/api/mobile-app';
    }
  }

  /**
   * Make a request with error handling, retries, and timeout
   */
  async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = 10000,
      retries = 2,
      headers = {},
      ...fetchOptions
    } = options;

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      
      try {
        timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          let errorData: unknown;
          try {
            errorData = await response.json().catch(() => ({}));
          } catch {
            errorData = await response.text().catch(() => '');
          }

          throw new ApiError(
            `API request failed: ${response.statusText}`,
            response.status,
            errorData
          );
        }

        // Issue #4: Wrap JSON parsing in try-catch to handle non-JSON responses
        let data: T;
        try {
          data = await response.json();
        } catch {
          throw new ApiError(
            'Failed to parse response as JSON',
            response.status
          );
        }

        return {
          data: data as T,
          status: response.status,
          headers: response.headers,
        };
      } catch (error) {
        lastError = error as Error;

        // Don't retry on abort (timeout), client errors (4xx), or JSON parsing errors
        if (
          error instanceof ApiError &&
          ((error.statusCode >= 400 && error.statusCode < 500) ||
           error.message === 'Failed to parse response as JSON')
        ) {
          break;
        }

        // Don't retry on last attempt
        if (attempt < retries) {
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
          continue;
        }

        // Log to Crashlytics on final failure
        if (error instanceof Error) {
          crashlyticsService.recordError(error);
        }
      } finally {
        // Issue #5: Ensure timeout is always cleared, even if fetch throws
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    }

    throw lastError || new ApiError('Request failed after retries');
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
