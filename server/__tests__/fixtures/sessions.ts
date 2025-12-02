/**
 * Session Test Fixtures
 *
 * Pre-defined session data for testing:
 * - Practice sessions
 * - Preparation sessions
 * - Interview sessions
 * - Various session states
 *
 * @module fixtures/sessions
 */

/**
 * Practice session fixtures
 */
export const PRACTICE_SESSIONS = {
  /** Active practice session */
  active: {
    jobRole: 'Software Engineer',
    difficulty: 'medium' as const,
    language: 'en',
    status: 'active' as const,
    totalQuestions: 5,
    currentQuestionNumber: 2,
  },

  /** Completed practice session */
  completed: {
    jobRole: 'Product Manager',
    difficulty: 'hard' as const,
    language: 'en',
    status: 'completed' as const,
    totalQuestions: 5,
    currentQuestionNumber: 5,
    overallScore: 85,
  },

  /** Cancelled practice session */
  cancelled: {
    jobRole: 'Data Scientist',
    difficulty: 'medium' as const,
    language: 'en',
    status: 'cancelled' as const,
    totalQuestions: 5,
    currentQuestionNumber: 2,
  },

  /** Beginner practice session */
  beginner: {
    jobRole: 'Junior Developer',
    difficulty: 'easy' as const,
    language: 'en',
    status: 'active' as const,
    totalQuestions: 3,
    currentQuestionNumber: 1,
  },

  /** Advanced practice session */
  advanced: {
    jobRole: 'Senior Engineering Manager',
    difficulty: 'hard' as const,
    language: 'en',
    status: 'active' as const,
    totalQuestions: 10,
    currentQuestionNumber: 5,
  },

  /** Multi-language practice session */
  multiLang: {
    jobRole: 'Software Engineer',
    difficulty: 'medium' as const,
    language: 'zh-sg',
    status: 'active' as const,
    totalQuestions: 5,
    currentQuestionNumber: 1,
  },
} as const;

/**
 * Preparation session fixtures
 */
export const PREPARATION_SESSIONS = {
  /** Active preparation session */
  active: {
    jobRole: 'Software Engineer',
    difficulty: 'medium' as const,
    language: 'en',
    status: 'active' as const,
    questionCount: 10,
  },

  /** Completed preparation session */
  completed: {
    jobRole: 'Product Manager',
    difficulty: 'hard' as const,
    language: 'en',
    status: 'completed' as const,
    questionCount: 15,
  },

  /** Career-focused preparation */
  career: {
    jobRole: 'Marketing Manager',
    difficulty: 'medium' as const,
    language: 'en',
    status: 'active' as const,
    questionCount: 8,
  },
} as const;

/**
 * Interview session fixtures
 */
export const INTERVIEW_SESSIONS = {
  /** Standard interview session */
  standard: {
    jobRole: 'Software Engineer',
    company: 'Tech Corp',
    difficulty: 'medium' as const,
    language: 'en',
    duration: 45,
  },

  /** Technical interview */
  technical: {
    jobRole: 'Senior Backend Engineer',
    company: 'Startup Inc',
    difficulty: 'hard' as const,
    language: 'en',
    duration: 60,
    focus: 'technical',
  },

  /** Behavioral interview */
  behavioral: {
    jobRole: 'Team Lead',
    company: 'Enterprise Co',
    difficulty: 'medium' as const,
    language: 'en',
    duration: 30,
    focus: 'behavioral',
  },
} as const;

/**
 * Session responses for testing
 */
export const SESSION_RESPONSES = {
  /** Good STAR response */
  goodSTAR: {
    questionText: "Tell me about a time when you solved a difficult problem.",
    userAnswer: "In my previous role at TechCorp, we faced a critical database performance issue affecting 50,000 users. As the lead engineer, I was responsible for identifying and resolving the issue within 24 hours. I analyzed query patterns, identified inefficient indexes, implemented optimizations, and deployed the fix during off-peak hours. The result was a 70% improvement in query performance and zero downtime.",
    rating: 4,
    category: 'behavioral',
  },

  /** Poor response lacking structure */
  poorResponse: {
    questionText: "Describe a challenging project you worked on.",
    userAnswer: "I worked on a project. It was challenging. We did it.",
    rating: 2,
    category: 'behavioral',
  },

  /** Technical response */
  technical: {
    questionText: "Explain how you would design a caching system.",
    userAnswer: "I would use Redis for caching with a TTL-based expiration strategy. The cache would sit between the application and database, implementing a cache-aside pattern. For cache invalidation, I'd use event-driven updates. The system would handle cache misses gracefully and include monitoring for hit rates.",
    rating: 4,
    category: 'technical',
  },

  /** Leadership response */
  leadership: {
    questionText: "How do you handle conflict in your team?",
    userAnswer: "When conflicts arise, I first listen to all parties involved. I facilitate a conversation focused on the issue, not personalities. I encourage finding common ground and collaborative solutions. In one instance, I mediated between two team members with different approaches, which resulted in a hybrid solution that was better than either original proposal.",
    rating: 5,
    category: 'leadership',
  },
} as const;

/**
 * Generate multiple practice sessions
 *
 * @param count - Number of sessions to generate
 * @param userId - User ID for the sessions
 * @returns Array of session fixtures
 *
 * @example
 * const sessions = generatePracticeSessions(5, 'user-123');
 */
export function generatePracticeSessions(
  count: number,
  userId: string
): Array<{
  userId: string;
  jobRole: string;
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
  status: 'active' | 'completed' | 'cancelled';
  totalQuestions: number;
  currentQuestionNumber: number;
}> {
  const sessions = [];
  const jobRoles = ['Software Engineer', 'Product Manager', 'Data Scientist', 'Designer', 'Marketing Manager'];
  const difficulties = ['easy', 'medium', 'hard'] as const;
  const statuses = ['active', 'completed', 'cancelled'] as const;

  for (let i = 0; i < count; i++) {
    sessions.push({
      userId,
      jobRole: jobRoles[i % jobRoles.length],
      difficulty: difficulties[i % difficulties.length],
      language: 'en',
      status: statuses[i % statuses.length],
      totalQuestions: 5,
      currentQuestionNumber: Math.floor(Math.random() * 5) + 1,
    });
  }

  return sessions;
}

/**
 * Session progress scenarios
 */
export const SESSION_PROGRESS = {
  /** Just started */
  justStarted: {
    totalQuestions: 5,
    currentQuestionNumber: 1,
    answeredQuestions: 0,
  },

  /** Halfway through */
  halfway: {
    totalQuestions: 10,
    currentQuestionNumber: 5,
    answeredQuestions: 4,
  },

  /** Nearly complete */
  nearlyComplete: {
    totalQuestions: 5,
    currentQuestionNumber: 5,
    answeredQuestions: 4,
  },

  /** Complete */
  complete: {
    totalQuestions: 5,
    currentQuestionNumber: 5,
    answeredQuestions: 5,
  },
} as const;

/**
 * Session timing scenarios
 */
export const SESSION_TIMING = {
  /** Quick session (15 minutes) */
  quick: {
    duration: 15,
    estimatedTime: 15,
  },

  /** Standard session (30 minutes) */
  standard: {
    duration: 30,
    estimatedTime: 30,
  },

  /** Long session (60 minutes) */
  long: {
    duration: 60,
    estimatedTime: 60,
  },

  /** Extended session (90 minutes) */
  extended: {
    duration: 90,
    estimatedTime: 90,
  },
} as const;
