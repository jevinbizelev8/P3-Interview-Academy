/**
 * Prepare Module API Client
 *
 * Handles all Prepare module endpoints:
 * - Learning modules and progress
 * - Self-introduction wizard
 * - Resume analyzer
 * - STAR story builder
 * - Readiness score
 */

import apiClient, { type ApiResponse } from './base-client';

// ============================================================================
// Type Definitions
// ============================================================================

export interface LearningModule {
  id: string;
  name: string;
  stage: 'hr_screening' | 'functional_team' | 'manager' | 'executive';
  description: string;
  is_interactive: boolean;
  interactive_component?: string;
  practice_component?: string;
  credit_cost: number;
  estimated_time: number;
  created_at: string;
}

export interface UserModuleProgress {
  id: string;
  user_id: string;
  module_id: string;
  completed: boolean;
  score?: number;
  time_spent?: number;
  completed_at?: string;
  created_at: string;
}

export interface SelfIntroDraft {
  id: string;
  user_id: string;
  content?: string;
  step: number;
  data: any;
  updated_at: string;
  created_at: string;
}

export interface SelfIntro {
  id: string;
  user_id: string;
  content: string;
  video_url?: string;
  transcript?: string;
  ai_feedback?: any;
  created_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  filename: string;
  file_url: string;
  file_size?: number;
  content_text?: string;
  analysis?: ResumeAnalysis;
  analyzed_at?: string;
  created_at: string;
}

export interface ResumeAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  keywords: string[];
  score: number;
  detailed_feedback: string;
}

export interface StarStory {
  id: string;
  user_id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  tags?: string[];
  ai_feedback?: any;
  created_at: string;
  updated_at: string;
}

export interface ReadinessScore {
  score: number;
  breakdown: {
    hr_screening: number;
    functional_team: number;
    manager: number;
    executive: number;
  };
}

// ============================================================================
// Learning Modules
// ============================================================================

/**
 * Get all learning modules
 */
export async function getLearningModules(): Promise<LearningModule[]> {
  const { data } = await apiClient.get<ApiResponse<{ modules: LearningModule[] }>>('/prepare/modules');
  return data.data?.modules || [];
}

/**
 * Get learning modules by stage
 */
export async function getLearningModulesByStage(stage: string): Promise<LearningModule[]> {
  const { data } = await apiClient.get<ApiResponse<{ modules: LearningModule[] }>>(
    `/prepare/modules?stage=${stage}`
  );
  return data.data?.modules || [];
}

/**
 * Get user progress for all modules
 */
export async function getUserModuleProgress(): Promise<UserModuleProgress[]> {
  const { data } = await apiClient.get<ApiResponse<{ progress: UserModuleProgress[] }>>(
    '/prepare/modules/progress'
  );
  return data.data?.progress || [];
}

/**
 * Update module progress
 */
export async function updateModuleProgress(params: {
  moduleId: string;
  completed: boolean;
  score?: number;
  timeSpent?: number;
}): Promise<UserModuleProgress> {
  const { data } = await apiClient.post<ApiResponse<{ progress: UserModuleProgress }>>(
    '/prepare/modules/progress',
    {
      moduleId: params.moduleId,
      completed: params.completed,
      score: params.score,
      timeSpent: params.timeSpent,
    }
  );
  return data.data!.progress;
}

// ============================================================================
// Self-Introduction
// ============================================================================

/**
 * Save self-intro draft
 */
export async function saveSelfIntroDraft(params: {
  content?: string;
  stepNumber: number;
  stepData: any;
}): Promise<SelfIntroDraft> {
  const { data } = await apiClient.post<ApiResponse<{ draft: SelfIntroDraft }>>(
    '/prepare/self-intro/draft',
    params
  );
  return data.data!.draft;
}

/**
 * Get latest self-intro draft
 */
export async function getSelfIntroDraft(): Promise<SelfIntroDraft | null> {
  const { data } = await apiClient.get<ApiResponse<{ draft: SelfIntroDraft | null }>>(
    '/prepare/self-intro/draft'
  );
  return data.data?.draft || null;
}

/**
 * Finalize self-intro
 */
export async function finalizeSelfIntro(params: {
  content: string;
  video_url?: string;
  transcript?: string;
}): Promise<SelfIntro> {
  const { data } = await apiClient.post<ApiResponse<{ selfIntro: SelfIntro }>>(
    '/prepare/self-intro/finalize',
    {
      content: params.content,
      video_url: params.video_url,
      transcript: params.transcript,
    }
  );
  return data.data!.selfIntro;
}

/**
 * Get finalized self-intro
 */
export async function getSelfIntro(): Promise<SelfIntro | null> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ selfIntro: SelfIntro | null }>>(
      '/prepare/self-intro'
    );
    return data.data?.selfIntro || null;
  } catch (error: any) {
    // Return null if 404 (not found)
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

// ============================================================================
// Resume Analyzer
// ============================================================================

/**
 * Upload resume
 */
export async function uploadResume(file: File): Promise<Resume> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post<ApiResponse<{ resume: Resume }>>(
    '/prepare/resume/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return data.data!.resume;
}

/**
 * Analyze resume with AI
 */
export async function analyzeResume(params: {
  resumeId: string;
  jobDescription?: string;
}): Promise<ResumeAnalysis> {
  const { data } = await apiClient.post<ApiResponse<{ analysis: ResumeAnalysis }>>(
    '/prepare/resume/analyze',
    {
      resumeId: params.resumeId,
      jobDescription: params.jobDescription,
    }
  );
  return data.data!.analysis;
}

/**
 * Get resume by ID
 */
export async function getResume(resumeId: string): Promise<Resume> {
  const { data } = await apiClient.get<ApiResponse<{ resume: Resume }>>(
    `/prepare/resume/${resumeId}`
  );
  return data.data!.resume;
}

/**
 * List user resumes
 */
export async function listResumes(): Promise<Resume[]> {
  const { data } = await apiClient.get<ApiResponse<{ resumes: Resume[] }>>(
    '/prepare/resumes'
  );
  return data.data?.resumes || [];
}

// ============================================================================
// STAR Stories
// ============================================================================

/**
 * Create STAR story
 */
export async function createStarStory(params: {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  tags?: string[];
}): Promise<StarStory> {
  const { data } = await apiClient.post<ApiResponse<{ story: StarStory }>>(
    '/prepare/star-stories',
    params
  );
  return data.data!.story;
}

/**
 * Get user's STAR stories
 */
export async function getStarStories(): Promise<StarStory[]> {
  const { data } = await apiClient.get<ApiResponse<{ stories: StarStory[] }>>(
    '/prepare/star-stories'
  );
  return data.data?.stories || [];
}

/**
 * Update STAR story
 */
export async function updateStarStory(storyId: string, params: {
  title?: string;
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
  tags?: string[];
}): Promise<StarStory> {
  const { data } = await apiClient.put<ApiResponse<{ story: StarStory }>>(
    `/prepare/star-stories/${storyId}`,
    params
  );
  return data.data!.story;
}

/**
 * Delete STAR story
 */
export async function deleteStarStory(storyId: string): Promise<void> {
  await apiClient.delete(`/prepare/star-stories/${storyId}`);
}

// ============================================================================
// Readiness Score
// ============================================================================

/**
 * Get readiness score
 */
export async function getReadinessScore(): Promise<ReadinessScore> {
  const { data } = await apiClient.get<ApiResponse<ReadinessScore>>(
    '/prepare/readiness-score'
  );
  return data.data!;
}

// ============================================================================
// Export All
// ============================================================================

export default {
  // Learning Modules
  getLearningModules,
  getLearningModulesByStage,
  getUserModuleProgress,
  updateModuleProgress,

  // Self-Introduction
  saveSelfIntroDraft,
  getSelfIntroDraft,
  finalizeSelfIntro,
  getSelfIntro,

  // Resume Analyzer
  uploadResume,
  analyzeResume,
  getResume,
  listResumes,

  // STAR Stories
  createStarStory,
  getStarStories,
  updateStarStory,
  deleteStarStory,

  // Readiness Score
  getReadinessScore,
};
