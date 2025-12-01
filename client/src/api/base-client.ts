/**
 * Base Axios Client for P3 Interview Academy MVP APIs
 *
 * This client provides the foundation for all API modules with:
 * - Session-based authentication (Passport.js cookies)
 * - Error handling and interceptors
 * - Request/response logging in development
 * - Proper TypeScript types
 */

import axios from 'axios';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const IS_DEV = import.meta.env.DEV;

// ============================================================================
// Base Axios Instance
// ============================================================================

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Required for Passport.js session cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// ============================================================================
// Request Interceptor
// ============================================================================

apiClient.interceptors.request.use(
  (config: any) => {
    // Log requests in development
    if (IS_DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    return config;
  },
  (error: any) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// ============================================================================
// Response Interceptor
// ============================================================================

apiClient.interceptors.response.use(
  (response: any) => {
    // Log responses in development
    if (IS_DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error: any) => {
    // Handle common error scenarios
    if (error.response) {
      const { status, data } = error.response;

      if (IS_DEV) {
        console.error(`[API Error] ${status}:`, data);
      }

      // Handle authentication errors
      if (status === 401) {
        console.warn('[API] Unauthorized - redirecting to login');
        // Note: Component-level redirect should handle this
        // We don't redirect here to avoid circular dependencies
      }

      // Handle not found errors
      if (status === 404) {
        console.warn('[API] Resource not found:', error.config?.url);
      }

      // Handle validation errors
      if (status === 400) {
        console.warn('[API] Validation error:', data?.error || data?.message);
      }

      // Handle server errors
      if (status >= 500) {
        console.error('[API] Server error:', data?.error || data?.message);
      }
    } else if (error.request) {
      console.error('[API] No response received:', error.message);
    } else {
      console.error('[API] Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// Type Definitions
// ============================================================================

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string; // Optional message field for error details
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract data from API response or throw error
 */
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Unknown API error');
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: any): never {
  if (error.response?.data?.error) {
    throw new Error(error.response.data.error);
  }
  if (error.message) {
    throw new Error(error.message);
  }
  throw new Error('An unexpected error occurred');
}

/**
 * Check if error is an Axios error
 */
export function isAxiosError(error: any): boolean {
  return error && error.isAxiosError === true;
}

// ============================================================================
// Export
// ============================================================================

export default apiClient;
