/**
 * Referrals Module API Client
 *
 * Handles all referral system endpoints:
 * - Referral code generation
 * - Referral code application
 * - Referral statistics and tracking
 */

import apiClient, { type ApiResponse } from './base-client';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Referral {
  id: string;
  referrer_id: string;
  referral_code: string;
  referred_email: string;
  referred_user_id?: string;
  status: 'pending' | 'completed';
  reward_value: number;
  reward_given: boolean;
  referred_at: string;
  signed_up_at?: string;
  reward_given_at?: string;
}

export interface ReferralCode {
  code: string;
  referral_url: string;
}

export interface ReferralStats {
  total_referrals: number;
  completed_referrals: number;
  pending_referrals: number;
  total_credits_earned: number;
  referral_code: string;
  referral_url: string;
}

export interface ApplyReferralResponse {
  referral: Referral;
  message: string;
}

// ============================================================================
// Referral Code Management
// ============================================================================

/**
 * Create or get user's referral code
 */
export async function createReferralCode(): Promise<ReferralCode> {
  const { data } = await apiClient.post<ApiResponse<{
    code: string;
    referralUrl: string;
  }>>(
    '/referrals/create'
  );
  return {
    code: data.data!.code,
    referral_url: data.data!.referralUrl,
  };
}

/**
 * Get user's referral code
 */
export async function getReferralCode(): Promise<ReferralCode> {
  const { data } = await apiClient.get<ApiResponse<{
    code: string;
    referralUrl: string;
  }>>(
    '/referrals/code'
  );
  return {
    code: data.data!.code,
    referral_url: data.data!.referralUrl,
  };
}

// ============================================================================
// Apply Referral Code
// ============================================================================

/**
 * Apply referral code (during signup or after)
 */
export async function applyReferralCode(params: {
  referral_code: string;
  referred_email: string;
  referred_user_id?: string;
}): Promise<ApplyReferralResponse> {
  const { data } = await apiClient.post<ApiResponse<{
    referral: Referral;
    message: string;
  }>>(
    '/referrals/apply',
    {
      referralCode: params.referral_code,
      referredEmail: params.referred_email,
      referredUserId: params.referred_user_id,
    }
  );
  return {
    referral: data.data!.referral,
    message: data.data!.message,
  };
}

// ============================================================================
// Referral Statistics
// ============================================================================

/**
 * Get referral statistics
 */
export async function getReferralStats(): Promise<ReferralStats> {
  const { data } = await apiClient.get<ApiResponse<ReferralStats>>(
    '/referrals/stats'
  );
  return data.data!;
}

/**
 * Get list of user's referrals
 */
export async function getUserReferrals(params?: {
  limit?: number;
}): Promise<{ referrals: Referral[]; total: number; limit: number }> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const { data } = await apiClient.get<ApiResponse<{
    referrals: Referral[];
    total: number;
    limit: number;
  }>>(
    `/referrals/referrals?${queryParams.toString()}`
  );
  return data.data!;
}

// ============================================================================
// Export All
// ============================================================================

export default {
  // Referral Code Management
  createReferralCode,
  getReferralCode,

  // Apply Referral
  applyReferralCode,

  // Statistics
  getReferralStats,
  getUserReferrals,
};
