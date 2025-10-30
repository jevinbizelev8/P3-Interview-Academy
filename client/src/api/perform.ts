/**
 * Perform Module API Client
 *
 * Handles all Perform module endpoints:
 * - Actual interview tracking
 * - Reflection journals
 * - Analytics and insights
 * - Performance charts and statistics
 */

import apiClient, { type ApiResponse } from './base-client';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ActualInterview {
  id: string;
  user_id: string;
  company: string;
  position: string;
  interview_date: string;
  outcome?: 'pending' | 'offer' | 'rejected' | 'withdrew';
  notes?: string;
  preparation_used?: string[];
  practice_sessions_used?: string[];
  created_at: string;
  updated_at: string;
}

export interface ReflectionJournal {
  id: string;
  user_id: string;
  simulation_id?: string;
  actual_interview_id?: string;
  reflection_type: 'simulation' | 'actual_interview';
  what_went_well: string;
  what_to_improve: string;
  key_learnings: string;
  ai_insights?: any;
  created_at: string;
}

export interface PerformanceInsights {
  total_simulations: number;
  total_interviews: number;
  average_score: number;
  improvement_trend: number;
  top_strengths: string[];
  areas_to_improve: string[];
  practice_frequency: {
    last_7_days: number;
    last_30_days: number;
  };
}

export interface PerformanceChartData {
  labels: string[];
  scores: number[];
  practice_frequency: number[];
  improvement_trend: number[];
}

export interface PerformanceStats {
  total_practice_sessions: number;
  completed_sessions: number;
  average_score: number;
  highest_score: number;
  total_hours_practiced: number;
  current_streak: number;
}

export interface InterviewStats {
  total_interviews: number;
  pending: number;
  offers: number;
  rejected: number;
  success_rate: number;
}

export interface InterviewTimelineItem {
  id: string;
  type: 'practice' | 'actual_interview' | 'reflection';
  title: string;
  date: string;
  score?: number;
  outcome?: string;
}

// ============================================================================
// Actual Interview Tracking
// ============================================================================

/**
 * Log actual interview
 */
export async function createActualInterview(params: {
  company: string;
  position: string;
  interview_date: string;
  outcome?: string;
  notes?: string;
  preparation_used?: string[];
  practice_sessions_used?: string[];
}): Promise<ActualInterview> {
  const { data } = await apiClient.post<ApiResponse<{ interview: ActualInterview }>>(
    '/perform/actual-interviews',
    params
  );
  return data.data!.interview;
}

/**
 * Get logged interviews
 */
export async function getActualInterviews(): Promise<ActualInterview[]> {
  const { data } = await apiClient.get<ApiResponse<{ interviews: ActualInterview[] }>>(
    '/perform/actual-interviews'
  );
  return data.data?.interviews || [];
}

/**
 * Update interview
 */
export async function updateActualInterview(
  interviewId: string,
  params: Partial<ActualInterview>
): Promise<ActualInterview> {
  const { data} = await apiClient.put<ApiResponse<{ interview: ActualInterview }>>(
    `/perform/actual-interviews/${interviewId}`,
    params
  );
  return data.data!.interview;
}

/**
 * Delete interview
 */
export async function deleteActualInterview(interviewId: string): Promise<void> {
  await apiClient.delete(`/perform/actual-interviews/${interviewId}`);
}

// ============================================================================
// Reflection Journals
// ============================================================================

/**
 * Create reflection journal
 */
export async function createReflection(params: {
  simulation_id?: string;
  actual_interview_id?: string;
  reflection_type: 'simulation' | 'actual_interview';
  what_went_well: string;
  what_to_improve: string;
  key_learnings: string;
}): Promise<ReflectionJournal> {
  const { data } = await apiClient.post<ApiResponse<{ reflection: ReflectionJournal }>>(
    '/perform/reflections',
    params
  );
  return data.data!.reflection;
}

/**
 * Get user reflections
 */
export async function getReflections(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ reflections: ReflectionJournal[]; total: number }> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const { data } = await apiClient.get<ApiResponse<{ reflections: ReflectionJournal[]; total: number }>>(
    `/perform/reflections?${queryParams.toString()}`
  );
  return data.data!;
}

// ============================================================================
// Analytics & Insights
// ============================================================================

/**
 * Get analytics/insights
 */
export async function getInsights(): Promise<PerformanceInsights> {
  const { data } = await apiClient.get<ApiResponse<PerformanceInsights>>(
    '/perform/insights'
  );
  return data.data!;
}

/**
 * Get performance chart data
 */
export async function getPerformanceChart(period?: '7d' | '30d' | '90d'): Promise<PerformanceChartData> {
  const queryParams = period ? `?period=${period}` : '';
  const { data } = await apiClient.get<ApiResponse<PerformanceChartData>>(
    `/perform/performance-chart${queryParams}`
  );
  return data.data!;
}

/**
 * Get performance statistics
 */
export async function getPerformanceStats(): Promise<PerformanceStats> {
  const { data } = await apiClient.get<ApiResponse<PerformanceStats>>(
    '/perform/stats'
  );
  return data.data!;
}

/**
 * Get interview statistics
 */
export async function getInterviewStats(): Promise<InterviewStats> {
  const { data } = await apiClient.get<ApiResponse<InterviewStats>>(
    '/perform/interview-stats'
  );
  return data.data!;
}

/**
 * Get interview timeline
 */
export async function getInterviewTimeline(): Promise<InterviewTimelineItem[]> {
  const { data } = await apiClient.get<ApiResponse<{ timeline: InterviewTimelineItem[] }>>(
    '/perform/interview-timeline'
  );
  return data.data?.timeline || [];
}

// ============================================================================
// Export All
// ============================================================================

export default {
  // Actual Interview Tracking
  createActualInterview,
  getActualInterviews,
  updateActualInterview,
  deleteActualInterview,

  // Reflection Journals
  createReflection,
  getReflections,

  // Analytics & Insights
  getInsights,
  getPerformanceChart,
  getPerformanceStats,
  getInterviewStats,
  getInterviewTimeline,
};
