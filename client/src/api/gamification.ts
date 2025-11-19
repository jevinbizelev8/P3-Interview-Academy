/**
 * Gamification Module API Client
 *
 * Handles all gamification endpoints:
 * - Badges and achievements
 * - XP points and rewards
 * - Streaks and activity tracking
 * - Leaderboard
 */

import apiClient, { type ApiResponse } from './base-client';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  tier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xp_reward: number;
  requirement_type: string;
  requirement_count: number;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  badge: Badge;
  progress: number;
  progress_current: number;
  progress_required: number;
  earned: boolean;
  earned_at?: string;
  created_at: string;
}

export interface XPPoints {
  total_points: number;
  level: number;
  points_to_next_level: number;
  level_progress_percentage: number;
}

export interface Streak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  daily_bonus_xp: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  xp_points: number;
  level: number;
  badge_count: number;
}

// ============================================================================
// Badge System
// ============================================================================

/**
 * Get all available badges
 */
export async function getAllBadges(): Promise<Badge[]> {
  const { data } = await apiClient.get<ApiResponse<{ badges: Badge[] }>>(
    '/gamification/badges'
  );
  return data.data?.badges || [];
}

/**
 * Get user's earned and in-progress badges
 */
export async function getUserBadges(): Promise<UserBadge[]> {
  const { data } = await apiClient.get<ApiResponse<{ userBadges: UserBadge[] }>>(
    '/gamification/user-badges'
  );
  return data.data?.userBadges || [];
}

/**
 * Award badge (internal use - triggered by backend logic)
 */
export async function awardBadge(badgeId: string): Promise<UserBadge> {
  const { data } = await apiClient.post<ApiResponse<{ userBadge: UserBadge }>>(
    '/gamification/award-badge',
    { badgeId }
  );
  return data.data!.userBadge;
}

// ============================================================================
// XP Points
// ============================================================================

/**
 * Add XP points (internal use - triggered by backend logic)
 */
export async function addPoints(params: {
  points: number;
  source: string;
  reference_id?: string;
}): Promise<XPPoints> {
  const { data } = await apiClient.post<ApiResponse<XPPoints>>(
    '/gamification/add-points',
    {
      points: params.points,
      source: params.source,
      referenceId: params.reference_id,
    }
  );
  return data.data!;
}

/**
 * Get user's XP points and level
 */
export async function getPoints(): Promise<XPPoints> {
  const { data } = await apiClient.get<ApiResponse<XPPoints>>(
    '/gamification/points'
  );
  return data.data!;
}

// ============================================================================
// Streak Tracking
// ============================================================================

/**
 * Update user streak (called on activity)
 */
export async function updateStreak(): Promise<Streak> {
  const { data } = await apiClient.post<ApiResponse<Streak>>(
    '/gamification/update-streak'
  );
  return data.data!;
}

/**
 * Get user streak information
 */
export async function getStreak(): Promise<Streak> {
  const { data } = await apiClient.get<ApiResponse<Streak>>(
    '/gamification/streak'
  );
  return data.data!;
}

// ============================================================================
// Leaderboard
// ============================================================================

/**
 * Get leaderboard
 */
export async function getLeaderboard(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ leaderboard: LeaderboardEntry[]; total: number; userRank?: number }> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const { data } = await apiClient.get<ApiResponse<{
    leaderboard: LeaderboardEntry[];
    total: number;
    userRank?: number;
  }>>(
    `/gamification/leaderboard?${queryParams.toString()}`
  );
  return data.data!;
}

// ============================================================================
// Export All
// ============================================================================

export default {
  // Badge System
  getAllBadges,
  getUserBadges,
  awardBadge,

  // XP Points
  addPoints,
  getPoints,

  // Streak Tracking
  updateStreak,
  getStreak,

  // Leaderboard
  getLeaderboard,
};
