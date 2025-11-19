/**
 * Practice Module API Client
 *
 * Handles all Practice module endpoints:
 * - Simulation creation and management
 * - Simulation history
 * - Assessment details
 */

import apiClient, { type ApiResponse } from './base-client';

// ============================================================================
// Type Definitions
// ============================================================================

export interface PracticeSession {
  id: string;
  user_id: string;
  language: string;
  job_description?: string;
  difficulty?: string;
  credits_used: number;
  overall_score?: number;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  completed_at?: string;
}

export interface AssessedQuestion {
  question_number: number;
  question_text: string;
  user_response: string;
  star_scores: {
    situation: number;
    task: number;
    action: number;
    result: number;
  };
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface Assessment {
  session_id: string;
  overall_score: number;
  star_breakdown: {
    situation: number;
    task: number;
    action: number;
    result: number;
  };
  strengths: string[];
  improvements: string[];
  detailed_feedback: string;
  questions: AssessedQuestion[];
}

export interface SimulationHistoryItem {
  id: string;
  language: string;
  difficulty?: string;
  overall_score?: number;
  status: string;
  created_at: string;
  completed_at?: string;
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Create new practice session
 */
export async function createPracticeSession(params: {
  language: string;
  job_description?: string;
  difficulty?: string;
  credits_to_use?: number;
}): Promise<PracticeSession> {
  const { data } = await apiClient.post<ApiResponse<{ session: PracticeSession }>>(
    '/practice/sessions',
    {
      language: params.language,
      job_description: params.job_description,
      difficulty: params.difficulty,
      credits_to_use: params.credits_to_use,
    }
  );
  return data.data!.session;
}

// ============================================================================
// Simulation History
// ============================================================================

/**
 * Get simulation history
 */
export async function getSimulationHistory(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ sessions: SimulationHistoryItem[]; total: number }> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const { data } = await apiClient.get<ApiResponse<{ sessions: SimulationHistoryItem[]; total: number }>>(
    `/practice/history?${queryParams.toString()}`
  );
  return data.data!;
}

// ============================================================================
// Assessment
// ============================================================================

/**
 * Get detailed assessment for a session
 */
export async function getAssessment(sessionId: string): Promise<Assessment> {
  const { data } = await apiClient.get<ApiResponse<{ assessment: Assessment }>>(
    `/practice/assessment/${sessionId}`
  );
  return data.data!.assessment;
}

// ============================================================================
// Export All
// ============================================================================

export default {
  createPracticeSession,
  getSimulationHistory,
  getAssessment,
};
