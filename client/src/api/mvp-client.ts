/**
 * MVP Client - Stub API for Base44 MVP Components
 *
 * This file provides stub implementations of the Base44 SDK API.
 * Phase 3 will implement real backend endpoints to replace these stubs.
 *
 * DO NOT use this for production - all methods return mock data.
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  xp_points: number;
  current_streak: number;
  longest_streak: number;
  readiness_score: number;
  referral_code: string;
  avatar_url?: string;
}

export interface SelfIntro {
  id: string;
  user_id: string;
  content: string;
  video_url?: string;
  score: number;
  created_at: string;
}

export interface SelfIntroDraft {
  id: string;
  user_id: string;
  step: number;
  draft_data: any;
  created_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  ats_score: number;
  analysis_summary: string;
  created_at: string;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  xp_reward: number;
  order_index: number;
}

export interface UserModuleProgress {
  id: string;
  user_id: string;
  module_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  completed_at?: string;
}

export interface InterviewSimulation {
  id: string;
  user_id: string;
  type: string;
  difficulty: string;
  score: number;
  feedback: string;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  tier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xp_reward: number;
  requirement_type: string;
  requirement_count: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  progress: number;
  earned: boolean;
  earned_at?: string;
}

export interface ActualInterview {
  id: string;
  user_id: string;
  company_name: string;
  position: string;
  interview_date: string;
  outcome?: string;
  notes?: string;
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
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'pro' | 'advanced';
  status: 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date?: string;
}

export interface CreditLedger {
  id: string;
  user_id: string;
  transaction_type: 'purchase' | 'usage' | 'refund';
  credits: number;
  balance_after: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_user_id: string;
  referred_user_id?: string;
  referral_code: string;
  status: 'pending' | 'completed';
  reward_claimed: boolean;
}

export interface Feedback {
  id: string;
  user_id: string;
  category: string;
  message: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

// ============================================================================
// Entity Stubs
// ============================================================================

/**
 * Mock user profile data
 */
export const UserProfileEntity = {
  async get(id: string): Promise<UserProfile> {
    return {
      id,
      email: 'user@example.com',
      name: 'Mock User',
      xp_points: 1250,
      current_streak: 5,
      longest_streak: 12,
      readiness_score: 75,
      referral_code: 'MOCK123',
      avatar_url: 'https://via.placeholder.com/150',
    };
  },

  async list(): Promise<UserProfile[]> {
    return [await this.get('mock-user-1')];
  },

  async update(id: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.get(id);
    return { ...current, ...data };
  },
};

/**
 * Mock self-introduction data
 */
export const SelfIntroEntity = {
  async get(id: string): Promise<SelfIntro> {
    return {
      id,
      user_id: 'mock-user-1',
      content: 'This is a mock self-introduction.',
      video_url: 'https://example.com/video.mp4',
      score: 85,
      created_at: new Date().toISOString(),
    };
  },

  async list(userId: string): Promise<SelfIntro[]> {
    return [await this.get('mock-intro-1')];
  },

  async create(data: Partial<SelfIntro>): Promise<SelfIntro> {
    return await this.get('mock-intro-new');
  },
};

/**
 * Mock resume data
 */
export const ResumeEntity = {
  async get(id: string): Promise<Resume> {
    return {
      id,
      user_id: 'mock-user-1',
      file_url: 'https://example.com/resume.pdf',
      file_name: 'John_Doe_Resume.pdf',
      ats_score: 82,
      analysis_summary: 'Strong technical skills, clear formatting.',
      created_at: new Date().toISOString(),
    };
  },

  async list(userId: string): Promise<Resume[]> {
    return [await this.get('mock-resume-1')];
  },

  async create(data: Partial<Resume>): Promise<Resume> {
    return await this.get('mock-resume-new');
  },
};

/**
 * Mock learning modules
 */
export const LearningModuleEntity = {
  async get(id: string): Promise<LearningModule> {
    return {
      id,
      title: 'Introduction to STAR Method',
      description: 'Learn how to structure your interview responses.',
      category: 'behavioral',
      duration_minutes: 15,
      xp_reward: 50,
      order_index: 1,
    };
  },

  async list(): Promise<LearningModule[]> {
    return [
      await this.get('module-1'),
      {
        id: 'module-2',
        title: 'Common Coding Patterns',
        description: 'Master frequently asked coding interview patterns.',
        category: 'technical',
        duration_minutes: 30,
        xp_reward: 100,
        order_index: 2,
      },
    ];
  },
};

/**
 * Mock user module progress
 */
export const UserModuleProgressEntity = {
  async get(userId: string, moduleId: string): Promise<UserModuleProgress> {
    return {
      id: `progress-${userId}-${moduleId}`,
      user_id: userId,
      module_id: moduleId,
      status: 'in_progress',
      progress_percentage: 45,
    };
  },

  async list(userId: string): Promise<UserModuleProgress[]> {
    return [
      await this.get(userId, 'module-1'),
      await this.get(userId, 'module-2'),
    ];
  },

  async update(id: string, data: Partial<UserModuleProgress>): Promise<UserModuleProgress> {
    return {
      id,
      user_id: 'mock-user-1',
      module_id: 'module-1',
      status: data.status || 'in_progress',
      progress_percentage: data.progress_percentage || 0,
    };
  },
};

/**
 * Mock badges
 */
export const BadgeEntity = {
  async get(id: string): Promise<Badge> {
    return {
      id,
      name: 'First Steps',
      description: 'Complete your first learning module',
      icon_url: 'https://via.placeholder.com/64',
      tier: 'common',
      xp_reward: 50,
      requirement_type: 'modules_completed',
      requirement_count: 1,
    };
  },

  async list(): Promise<Badge[]> {
    return [
      await this.get('badge-1'),
      {
        id: 'badge-2',
        name: 'Interview Master',
        description: 'Complete 10 interview simulations',
        icon_url: 'https://via.placeholder.com/64',
        tier: 'epic',
        xp_reward: 200,
        requirement_type: 'simulations_completed',
        requirement_count: 10,
      },
    ];
  },
};

/**
 * Mock user badges
 */
export const UserBadgeEntity = {
  async list(userId: string): Promise<UserBadge[]> {
    return [
      {
        id: 'user-badge-1',
        user_id: userId,
        badge_id: 'badge-1',
        progress: 100,
        earned: true,
        earned_at: new Date().toISOString(),
      },
      {
        id: 'user-badge-2',
        user_id: userId,
        badge_id: 'badge-2',
        progress: 40,
        earned: false,
      },
    ];
  },
};

/**
 * Mock interview simulations
 */
export const InterviewSimulationEntity = {
  async get(id: string): Promise<InterviewSimulation> {
    return {
      id,
      user_id: 'mock-user-1',
      type: 'behavioral',
      difficulty: 'medium',
      score: 78,
      feedback: 'Good use of STAR method. Consider providing more specific metrics.',
      created_at: new Date().toISOString(),
    };
  },

  async list(userId: string): Promise<InterviewSimulation[]> {
    return [await this.get('sim-1')];
  },

  async create(data: Partial<InterviewSimulation>): Promise<InterviewSimulation> {
    return await this.get('sim-new');
  },
};

/**
 * Mock actual interviews
 */
export const ActualInterviewEntity = {
  async list(userId: string): Promise<ActualInterview[]> {
    return [
      {
        id: 'interview-1',
        user_id: userId,
        company_name: 'TechCorp',
        position: 'Senior Developer',
        interview_date: '2025-11-15',
        outcome: 'pending',
        notes: 'First round technical interview',
      },
    ];
  },

  async create(data: Partial<ActualInterview>): Promise<ActualInterview> {
    return {
      id: 'interview-new',
      user_id: data.user_id || 'mock-user-1',
      company_name: data.company_name || '',
      position: data.position || '',
      interview_date: data.interview_date || new Date().toISOString(),
      outcome: data.outcome,
      notes: data.notes,
    };
  },
};

/**
 * Mock reflection journals
 */
export const ReflectionJournalEntity = {
  async list(userId: string): Promise<ReflectionJournal[]> {
    return [
      {
        id: 'reflection-1',
        user_id: userId,
        simulation_id: 'sim-1',
        reflection_type: 'simulation',
        what_went_well: 'Clear structure, good examples',
        what_to_improve: 'Add more quantifiable results',
        key_learnings: 'STAR method is effective for behavioral questions',
        created_at: new Date().toISOString(),
      },
    ];
  },

  async create(data: Partial<ReflectionJournal>): Promise<ReflectionJournal> {
    return {
      id: 'reflection-new',
      user_id: data.user_id || 'mock-user-1',
      simulation_id: data.simulation_id,
      actual_interview_id: data.actual_interview_id,
      reflection_type: data.reflection_type || 'simulation',
      what_went_well: data.what_went_well || '',
      what_to_improve: data.what_to_improve || '',
      key_learnings: data.key_learnings || '',
      created_at: new Date().toISOString(),
    };
  },
};

// ============================================================================
// Integration Stubs
// ============================================================================

/**
 * Mock LLM invocation
 */
export const InvokeLLM = {
  async invoke(prompt: string): Promise<string> {
    console.log('[MVP Stub] InvokeLLM called with prompt:', prompt.substring(0, 100));
    return 'This is a mock AI response. Phase 3 will implement real OpenAI integration.';
  },
};

/**
 * Mock email sending
 */
export const SendEmail = {
  async send(to: string, subject: string, body: string): Promise<boolean> {
    console.log('[MVP Stub] SendEmail called:', { to, subject });
    return true;
  },
};

/**
 * Mock file upload
 */
export const UploadFile = {
  async upload(file: File): Promise<{ url: string; filename: string }> {
    console.log('[MVP Stub] UploadFile called:', file.name);
    return {
      url: `https://example.com/uploads/${file.name}`,
      filename: file.name,
    };
  },
};

/**
 * Mock file data extraction
 */
export const ExtractDataFromUploadedFile = {
  async extract(fileUrl: string): Promise<any> {
    console.log('[MVP Stub] ExtractDataFromUploadedFile called:', fileUrl);
    return {
      text: 'Mock extracted text from file',
      metadata: { pages: 1, words: 500 },
    };
  },
};

// ============================================================================
// Client Export
// ============================================================================

/**
 * MVP Client - mirrors Base44 SDK structure
 *
 * Usage:
 * import { mvpClient } from '@/api/mvp-client';
 *
 * const profile = await mvpClient.entities.UserProfile.get('user-123');
 * const modules = await mvpClient.entities.LearningModule.list();
 */
export const mvpClient = {
  entities: {
    UserProfile: UserProfileEntity,
    SelfIntro: SelfIntroEntity,
    SelfIntroDraft: {}, // TODO: Implement when needed
    Resume: ResumeEntity,
    LearningModule: LearningModuleEntity,
    UserModuleProgress: UserModuleProgressEntity,
    InterviewSimulation: InterviewSimulationEntity,
    Badge: BadgeEntity,
    UserBadge: UserBadgeEntity,
    ActualInterview: ActualInterviewEntity,
    ReflectionJournal: ReflectionJournalEntity,
    Subscription: {}, // TODO: Implement when needed
    CreditLedger: {}, // TODO: Implement when needed
    Invoice: {}, // TODO: Implement when needed
    Referral: {}, // TODO: Implement when needed
    Feedback: {}, // TODO: Implement when needed
    SupportTicket: {}, // TODO: Implement when needed
  },
  integrations: {
    Core: {
      InvokeLLM,
      SendEmail,
      UploadFile,
      ExtractDataFromUploadedFile,
    },
  },
  auth: {
    // Mock auth methods
    async getCurrentUser(): Promise<UserProfile | null> {
      return await UserProfileEntity.get('mock-user-1');
    },
    async signIn(email: string, password: string): Promise<boolean> {
      console.log('[MVP Stub] signIn called:', email);
      return true;
    },
    async signOut(): Promise<boolean> {
      console.log('[MVP Stub] signOut called');
      return true;
    },
  },
};

// Re-export entities for convenience (matches Base44 API structure)
export const UserProfile = mvpClient.entities.UserProfile;
export const SelfIntro = mvpClient.entities.SelfIntro;
export const Resume = mvpClient.entities.Resume;
export const LearningModule = mvpClient.entities.LearningModule;
export const UserModuleProgress = mvpClient.entities.UserModuleProgress;
export const InterviewSimulation = mvpClient.entities.InterviewSimulation;
export const Badge = mvpClient.entities.Badge;
export const UserBadge = mvpClient.entities.UserBadge;
export const ActualInterview = mvpClient.entities.ActualInterview;
export const ReflectionJournal = mvpClient.entities.ReflectionJournal;
export const User = mvpClient.auth;
export const Core = mvpClient.integrations.Core;

export default mvpClient;
