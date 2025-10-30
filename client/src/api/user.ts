/**
 * User Profile API Client
 *
 * Handles user profile management endpoints:
 * - Get user profile
 * - Update user profile
 * - Upload profile photo
 */

import apiClient, { type ApiResponse } from './base-client';

// ============================================================================
// Type Definitions
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  firstName?: string;
  lastName?: string;
  mobile_number?: string;
  linkedin_url?: string;
  timezone?: string;
  country?: string;
  current_role?: string;
  target_role?: string;
  target_industry?: string;
  years_experience?: string;
  key_skills?: string[];
  profile_photo_url?: string;
  two_factor_enabled?: boolean;
  notification_email?: boolean;
  notification_whatsapp?: boolean;
  notification_sms?: boolean;
  role?: string;
  planType?: string;
  creditBalance?: number;
  xpPoints?: number;
  currentStreak?: number;
  readinessScore?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  mobile_number?: string;
  linkedin_url?: string;
  timezone?: string;
  country?: string;
  current_role?: string;
  target_role?: string;
  target_industry?: string;
  years_experience?: string;
  key_skills?: string[];
  profile_photo_url?: string;
  two_factor_enabled?: boolean;
  notification_email?: boolean;
  notification_whatsapp?: boolean;
  notification_sms?: boolean;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get current user profile
 */
export async function getUserProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get<ApiResponse<UserProfile>>('/user/profile');
  return data.data!;
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: UpdateProfileRequest): Promise<UserProfile> {
  const { data } = await apiClient.put<ApiResponse<UserProfile>>('/user/profile', updates);
  return data.data!;
}

/**
 * Upload profile photo
 */
export async function uploadProfilePhoto(file: File): Promise<{ profile_photo_url: string }> {
  const formData = new FormData();
  formData.append('photo', file);

  const { data } = await apiClient.post<ApiResponse<{ message: string; profile_photo_url: string }>>(
    '/user/profile/photo',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return { profile_photo_url: data.data!.profile_photo_url };
}