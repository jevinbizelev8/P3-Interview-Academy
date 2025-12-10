/**
 * MVP Scoring Utilities
 *
 * Ported from founder's MVP codebase
 * Contains XP calculation, streak tracking, and readiness score algorithms
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface XPAwardParams {
  action: string;
  referenceId?: string;
}

export interface SimulationXPParams {
  stage: 'hr_screening' | 'functional_team' | 'hiring_manager' | 'sme_technical' | 'executive_final';
  overallScore: number;
}

export interface ReadinessScoreBreakdown {
  learning: number;
  practice: number;
  profile: number;
  consistency: number;
  realWorld: number;
  total: number;
}

// ============================================================================
// XP Values for Different Actions
// ============================================================================

export const XP_VALUES = {
  LEARNING_MODULE_BASIC: 10,
  LEARNING_MODULE_ADVANCED: 20,
  SIMULATION_HR: 50,
  SIMULATION_FUNCTIONAL: 75,
  SIMULATION_HIRING_MANAGER: 85,
  SIMULATION_TECHNICAL: 100,
  SIMULATION_EXECUTIVE: 100,
  SIMULATION_BONUS_80: 25,
  SIMULATION_BONUS_90: 50,
  SELF_INTRO_COMPLETE: 30,
  RESUME_ANALYSIS: 25,
  REFLECTION_JOURNAL: 15,
  DAILY_STREAK_BASE: 5,
  BADGE_EARNED: 50, // Changed from 0 to match typical gamification
} as const;

// ============================================================================
// XP Calculation Functions
// ============================================================================

/**
 * Calculate XP for a simulation based on stage and score
 */
export function calculateSimulationXP(params: SimulationXPParams): number {
  const { stage, overallScore } = params;

  let baseXP = 0;

  switch (stage) {
    case 'hr_screening':
      baseXP = XP_VALUES.SIMULATION_HR;
      break;
    case 'functional_team':
      baseXP = XP_VALUES.SIMULATION_FUNCTIONAL;
      break;
    case 'hiring_manager':
      baseXP = XP_VALUES.SIMULATION_HIRING_MANAGER;
      break;
    case 'sme_technical':
      baseXP = XP_VALUES.SIMULATION_TECHNICAL;
      break;
    case 'executive_final':
      baseXP = XP_VALUES.SIMULATION_EXECUTIVE;
      break;
    default:
      baseXP = 50;
  }

  // Performance bonus
  let bonusXP = 0;
  if (overallScore >= 90) {
    bonusXP = XP_VALUES.SIMULATION_BONUS_90;
  } else if (overallScore >= 80) {
    bonusXP = XP_VALUES.SIMULATION_BONUS_80;
  }

  return baseXP + bonusXP;
}

/**
 * Calculate daily streak XP
 */
export function calculateStreakXP(streakDays: number): number {
  return XP_VALUES.DAILY_STREAK_BASE * streakDays;
}

// ============================================================================
// Readiness Score Algorithm
// ============================================================================

/**
 * Calculate readiness score breakdown
 *
 * This is a client-side version for display purposes.
 * The authoritative calculation happens on the server via API.
 *
 * Breakdown:
 * 1. Learning Foundation (25%): Module completion across all stages
 * 2. Practice Performance (40%): Simulation scores and consistency
 * 3. Profile Optimization (15%): Self-intro and resume quality
 * 4. Experience & Consistency (10%): Practice frequency and streaks
 * 5. Real-World Readiness (10%): Actual interview tracking and reflection
 */
export function calculateReadinessScoreBreakdown(data: {
  // Learning (25%)
  completedModules: number;
  totalModules: number;
  moduleStages: Set<string>;

  // Practice (40%)
  recentSimulations: Array<{ overall_score: number; stage: string }>;
  totalSimulations: number;

  // Profile (15%)
  selfIntroScore?: number;
  resumeAtsScore?: number;
  resumeJdMatch?: number;

  // Consistency (10%)
  currentStreak: number;
  longestStreak: number;
  totalSimulationsCompleted: number;

  // Real-World (10%)
  actualInterviews: Array<{ outcome: string; self_rating: number }>;
  reflectionCount: number;
}): ReadinessScoreBreakdown {
  // === 1. LEARNING FOUNDATION (25%) ===
  const moduleCompletionRate = Math.min(data.completedModules / data.totalModules, 1);
  const stageDiversityBonus = (data.moduleStages.size / 5) * 0.1; // Up to 10% bonus
  const learningScore = (moduleCompletionRate + stageDiversityBonus) * 100 * 0.25;

  // === 2. PRACTICE PERFORMANCE (40%) ===
  let practiceScore = 0;

  if (data.recentSimulations.length > 0) {
    // Recent performance (last 5 simulations) - 60% of practice score
    const recentAvgScore =
      data.recentSimulations.reduce((sum, sim) => sum + sim.overall_score, 0) /
      data.recentSimulations.length;
    const recentPerformance = recentAvgScore * 0.6;

    // Stage coverage - 20% of practice score
    const practiceStages = new Set(data.recentSimulations.map(s => s.stage)).size;
    const stageCoverage = (practiceStages / 5) * 100 * 0.2;

    // Volume bonus - 20% of practice score
    const volumeBonus = Math.min(data.totalSimulations / 10, 1) * 100 * 0.2;

    practiceScore = (recentPerformance + stageCoverage + volumeBonus) * 0.4;
  }

  // === 3. PROFILE OPTIMIZATION (15%) ===
  let profileScore = 0;

  // Self-introduction quality - 60% of profile score
  if (data.selfIntroScore !== undefined) {
    profileScore += data.selfIntroScore * 0.6;
  }

  // Resume optimization - 40% of profile score
  if (data.resumeAtsScore !== undefined) {
    let resumeScore = data.resumeAtsScore;

    // If JD match is available, use weighted average
    if (data.resumeJdMatch !== undefined) {
      resumeScore = (data.resumeAtsScore * 0.5) + (data.resumeJdMatch * 0.5);
    }

    profileScore += resumeScore * 0.4;
  }

  profileScore = profileScore * 0.15;

  // === 4. EXPERIENCE & CONSISTENCY (10%) ===
  // Streak contribution - 50%
  const streakPoints = Math.min(data.currentStreak * 5, 50);

  // Activity volume - 30%
  const activityPoints = Math.min(data.totalSimulationsCompleted * 3, 30);

  // Longest streak achievement - 20%
  const longestStreakPoints = Math.min(data.longestStreak * 2, 20);

  const consistencyScore = (streakPoints + activityPoints + longestStreakPoints) * 0.1;

  // === 5. REAL-WORLD READINESS (10%) ===
  let realWorldScore = 0;

  if (data.actualInterviews.length > 0) {
    // Having tracked real interviews shows commitment - 40%
    const trackingBonus = Math.min(data.actualInterviews.length / 5, 1) * 40;

    // Success rate matters - 40%
    const successfulInterviews = data.actualInterviews.filter(i => i.outcome === 'success').length;
    const successRate = (successfulInterviews / data.actualInterviews.length) * 40;

    // Self-ratings average - 20%
    const ratingsSum = data.actualInterviews.reduce((sum, i) => sum + i.self_rating, 0);
    const avgRating = (ratingsSum / data.actualInterviews.length) * 0.2;

    realWorldScore = (trackingBonus + successRate + avgRating) * 0.1;
  }

  // Reflection journals bonus
  if (data.reflectionCount > 0) {
    // Reflection shows self-awareness - adds up to 5% bonus
    const reflectionBonus = Math.min(data.reflectionCount / 10, 0.5) * 10;
    realWorldScore += reflectionBonus * 0.1;
  }

  // === CALCULATE FINAL READINESS SCORE ===
  const total = Math.round(
    learningScore + practiceScore + profileScore + consistencyScore + realWorldScore
  );

  return {
    learning: Math.round(learningScore),
    practice: Math.round(practiceScore),
    profile: Math.round(profileScore),
    consistency: Math.round(consistencyScore),
    realWorld: Math.round(realWorldScore),
    total: Math.min(total, 100), // Cap at 100
  };
}

// ============================================================================
// Streak Utilities
// ============================================================================

/**
 * Determine if streak should continue based on last activity date
 */
export function shouldContinueStreak(lastActiveDate: string | null): boolean {
  if (!lastActiveDate) return false;

  const today = new Date().toISOString().split('T')[0];
  const lastActive = new Date(lastActiveDate).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (lastActive === today) {
    return true; // Already counted today
  }

  return lastActive === yesterday; // Continue if active yesterday
}

/**
 * Calculate new streak value
 */
export function calculateNewStreak(
  lastActiveDate: string | null,
  currentStreak: number
): { newStreak: number; streakBroken: boolean } {
  if (!lastActiveDate) {
    return { newStreak: 1, streakBroken: false };
  }

  const today = new Date().toISOString().split('T')[0];
  const lastActive = new Date(lastActiveDate).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (lastActive === today) {
    // Already active today, don't increment
    return { newStreak: currentStreak, streakBroken: false };
  } else if (lastActive === yesterday) {
    // Continue streak
    return { newStreak: currentStreak + 1, streakBroken: false };
  } else {
    // Streak broken
    return { newStreak: 1, streakBroken: true };
  }
}

// ============================================================================
// Level Calculations
// ============================================================================

/**
 * Calculate user level from XP points
 * Uses a simple exponential curve: level = floor(sqrt(xp / 100))
 */
export function calculateLevel(xpPoints: number): number {
  return Math.floor(Math.sqrt(xpPoints / 100));
}

/**
 * Calculate XP required for next level
 */
export function calculateXPForNextLevel(currentLevel: number): number {
  const nextLevel = currentLevel + 1;
  return (nextLevel * nextLevel) * 100;
}

/**
 * Calculate progress to next level as percentage
 */
export function calculateLevelProgress(xpPoints: number): number {
  const currentLevel = calculateLevel(xpPoints);
  const xpForCurrentLevel = (currentLevel * currentLevel) * 100;
  const xpForNextLevel = calculateXPForNextLevel(currentLevel);
  const xpIntoLevel = xpPoints - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;

  return Math.round((xpIntoLevel / xpNeededForLevel) * 100);
}

// ============================================================================
// Badge Progress Utilities
// ============================================================================

/**
 * Calculate badge progress percentage
 */
export function calculateBadgeProgress(
  current: number,
  required: number
): number {
  if (required === 0) return 100;
  return Math.round((current / required) * 100);
}

/**
 * Check if badge should be awarded
 */
export function shouldAwardBadge(
  current: number,
  required: number,
  alreadyEarned: boolean
): boolean {
  return !alreadyEarned && current >= required;
}
