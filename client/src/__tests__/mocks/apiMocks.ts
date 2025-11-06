/**
 * Mock data and utility functions for testing MVP components
 */

import { vi } from 'vitest';

// ============================================================================
// Mock Data
// ============================================================================

export const mockLearningModules = [
  {
    id: 'module-1',
    title: 'Understanding Screening Interviews',
    description: 'Learn what HR is looking for',
    stage: 'hr_screening',
    order_in_stage: 1,
    estimated_minutes: 15,
    content: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'module-2',
    title: 'Perfect Your Elevator Pitch',
    description: 'Craft your 60-second intro',
    stage: 'hr_screening',
    order_in_stage: 2,
    estimated_minutes: 20,
    content: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockUserModuleProgress = [
  {
    id: 'progress-1',
    user_id: 'user-123',
    module_id: 'module-1',
    status: 'completed',
    progress_data: {},
    xp_earned: 20,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockResumes = [
  {
    id: 'resume-1',
    user_id: 'user-123',
    file_name: 'resume.pdf',
    file_path: '/uploads/resumes/resume.pdf',
    analysis_results: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockResumeAnalysis = {
  score: 85,
  strengths: ['Clear job descriptions', 'Quantified achievements'],
  weaknesses: ['Missing keywords', 'Could improve formatting'],
  keywords: ['React', 'TypeScript', 'Node.js'],
  suggestions: ['Add more technical keywords', 'Quantify more achievements'],
  detailed_feedback: 'Your resume is strong overall with clear accomplishments.',
};

export const mockCreditBalance = {
  balance: 100,
  last_updated: new Date().toISOString(),
};

export const mockBadges = [
  {
    id: 'badge-1',
    name: 'First Steps',
    description: 'Complete your first learning module',
    category: 'learning',
    tier: 'common',
    xp_reward: 50,
    image_url: '/badges/first-steps.png',
    requirements: { modules_completed: 1 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockUserBadges = [
  {
    id: 'user-badge-1',
    user_id: 'user-123',
    badge_id: 'badge-1',
    progress: 1,
    earned_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

export const mockXPPoints = {
  total_xp: 250,
  current_level: 3,
  xp_to_next_level: 50,
  total_xp_for_current_level: 200,
  total_xp_for_next_level: 300,
};

export const mockStreak = {
  current_streak: 5,
  longest_streak: 10,
  last_activity_date: new Date().toISOString(),
};

export const mockReadinessScore = {
  overall_score: 75,
  components: {
    simulation_performance: 80,
    learning_completion: 70,
    self_intro_score: 85,
    resume_optimization: 65,
    practice_consistency: 75,
  },
  recommendations: [
    'Complete more learning modules',
    'Practice more interview simulations',
  ],
  last_updated: new Date().toISOString(),
};

export const mockSimulationHistory = [
  {
    id: 'sim-1',
    user_id: 'user-123',
    status: 'completed',
    simulation_type: 'behavioral',
    difficulty: 'medium',
    overall_score: 82,
    credits_used: 10,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

export const mockActualInterviews = [
  {
    id: 'interview-1',
    user_id: 'user-123',
    company_name: 'Tech Corp',
    job_title: 'Senior Developer',
    interview_date: new Date().toISOString(),
    interview_stage: 'sme_technical',
    outcome: 'pending',
    self_rating: 75,
    notes: 'Prepare system design questions',
    thank_you_sent: false,
    thank_you_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockReflections = [
  {
    id: 'reflection-1',
    user_id: 'user-123',
    simulation_id: 'sim-1',
    content: 'I learned to structure my answers better using STAR method',
    insights: ['Focus on quantifying results', 'Practice storytelling'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockStarStories = [
  {
    id: 'story-1',
    user_id: 'user-123',
    title: 'Led team migration project',
    situation: 'Our legacy system was causing performance issues',
    task: 'Migrate to microservices architecture',
    action: 'Planned migration, coordinated team, implemented changes',
    result: 'Reduced latency by 40%, improved scalability',
    tags: ['leadership', 'technical'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ============================================================================
// Mock API Functions
// ============================================================================

export const createMockQueryHook = <T>(data: T) => {
  return () => ({
    data,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  });
};

export const createMockMutationHook = <T>(onSuccess?: () => void) => {
  return () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({} as T),
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: false,
    data: undefined,
    reset: vi.fn(),
  });
};

// ============================================================================
// Mock Hook Implementations
// ============================================================================

export const mockUseApi = {
  // Prepare Module
  useLearningModules: createMockQueryHook(mockLearningModules),
  useUserModuleProgress: createMockQueryHook(mockUserModuleProgress),
  useUpdateModuleProgress: createMockMutationHook(),
  useResumes: createMockQueryHook(mockResumes),
  useUploadResume: createMockMutationHook(),
  useAnalyzeResume: createMockMutationHook(),
  useCreditBalance: createMockQueryHook(mockCreditBalance),
  useStarStories: createMockQueryHook(mockStarStories),
  useSaveStarStory: createMockMutationHook(),

  // Practice Module
  useSimulationHistory: createMockQueryHook(mockSimulationHistory),

  // Perform Module
  useActualInterviews: createMockQueryHook(mockActualInterviews),
  useCreateActualInterview: createMockMutationHook(),
  useUpdateActualInterview: createMockMutationHook(),
  useDeleteActualInterview: createMockMutationHook(),
  useReflections: createMockQueryHook(mockReflections),

  // Gamification
  useUserBadges: createMockQueryHook(mockUserBadges),
  useBadges: createMockQueryHook(mockBadges),
  useXPPoints: createMockQueryHook(mockXPPoints),
  useStreak: createMockQueryHook(mockStreak),
  useReadinessScore: createMockQueryHook(mockReadinessScore),
};
