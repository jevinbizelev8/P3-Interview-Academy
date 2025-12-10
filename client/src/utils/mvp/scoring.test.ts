/**
 * Unit Tests for MVP Scoring Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  XP_VALUES,
  calculateSimulationXP,
  calculateStreakXP,
  calculateReadinessScoreBreakdown,
  shouldContinueStreak,
  calculateNewStreak,
  calculateLevel,
  calculateXPForNextLevel,
  calculateLevelProgress,
  calculateBadgeProgress,
  shouldAwardBadge,
} from './scoring';

// ============================================================================
// XP Calculation Tests
// ============================================================================

describe('calculateSimulationXP', () => {
  it('should calculate base XP for HR screening', () => {
    const xp = calculateSimulationXP({
      stage: 'hr_screening',
      overallScore: 70,
    });
    expect(xp).toBe(XP_VALUES.SIMULATION_HR);
  });

  it('should calculate base XP for functional team', () => {
    const xp = calculateSimulationXP({
      stage: 'functional_team',
      overallScore: 70,
    });
    expect(xp).toBe(XP_VALUES.SIMULATION_FUNCTIONAL);
  });

  it('should add 80% bonus correctly', () => {
    const xp = calculateSimulationXP({
      stage: 'hr_screening',
      overallScore: 85,
    });
    expect(xp).toBe(XP_VALUES.SIMULATION_HR + XP_VALUES.SIMULATION_BONUS_80);
  });

  it('should add 90% bonus correctly', () => {
    const xp = calculateSimulationXP({
      stage: 'hr_screening',
      overallScore: 95,
    });
    expect(xp).toBe(XP_VALUES.SIMULATION_HR + XP_VALUES.SIMULATION_BONUS_90);
  });

  it('should handle executive interviews correctly', () => {
    const xp = calculateSimulationXP({
      stage: 'executive_final',
      overallScore: 92,
    });
    expect(xp).toBe(XP_VALUES.SIMULATION_EXECUTIVE + XP_VALUES.SIMULATION_BONUS_90);
  });

  it('should use default XP for unknown stages', () => {
    const xp = calculateSimulationXP({
      stage: 'unknown' as any,
      overallScore: 70,
    });
    expect(xp).toBe(50);
  });
});

describe('calculateStreakXP', () => {
  it('should calculate streak XP correctly', () => {
    expect(calculateStreakXP(1)).toBe(5);
    expect(calculateStreakXP(7)).toBe(35);
    expect(calculateStreakXP(30)).toBe(150);
  });
});

// ============================================================================
// Readiness Score Tests
// ============================================================================

describe('calculateReadinessScoreBreakdown', () => {
  it('should calculate score for beginner user', () => {
    const score = calculateReadinessScoreBreakdown({
      completedModules: 2,
      totalModules: 20,
      moduleStages: new Set(['hr_screening']),
      recentSimulations: [],
      totalSimulations: 0,
      currentStreak: 1,
      longestStreak: 1,
      totalSimulationsCompleted: 0,
      actualInterviews: [],
      reflectionCount: 0,
    });

    expect(score.total).toBeGreaterThan(0);
    expect(score.total).toBeLessThanOrEqual(100);
    expect(score.learning).toBeGreaterThan(0);
    expect(score.practice).toBe(0);
  });

  it('should calculate score for advanced user', () => {
    const score = calculateReadinessScoreBreakdown({
      completedModules: 20,
      totalModules: 20,
      moduleStages: new Set([
        'hr_screening',
        'functional_team',
        'hiring_manager',
        'sme_technical',
        'executive_final',
      ]),
      recentSimulations: [
        { overall_score: 85, stage: 'hr_screening' },
        { overall_score: 90, stage: 'functional_team' },
        { overall_score: 88, stage: 'hiring_manager' },
        { overall_score: 92, stage: 'sme_technical' },
        { overall_score: 87, stage: 'executive_final' },
      ],
      totalSimulations: 15,
      selfIntroScore: 85,
      resumeAtsScore: 80,
      resumeJdMatch: 90,
      currentStreak: 10,
      longestStreak: 15,
      totalSimulationsCompleted: 15,
      actualInterviews: [
        { outcome: 'success', self_rating: 4 },
        { outcome: 'success', self_rating: 5 },
        { outcome: 'pending', self_rating: 4 },
      ],
      reflectionCount: 5,
    });

    expect(score.total).toBeGreaterThan(70);
    expect(score.total).toBeLessThanOrEqual(100);
    expect(score.learning).toBeGreaterThan(20);
    expect(score.practice).toBeGreaterThan(30);
    expect(score.profile).toBeGreaterThan(10);
    expect(score.consistency).toBeGreaterThan(5);
  });

  it('should cap total score at 100', () => {
    const score = calculateReadinessScoreBreakdown({
      completedModules: 25,
      totalModules: 20,
      moduleStages: new Set([
        'hr_screening',
        'functional_team',
        'hiring_manager',
        'sme_technical',
        'executive_final',
      ]),
      recentSimulations: [
        { overall_score: 100, stage: 'hr_screening' },
        { overall_score: 100, stage: 'functional_team' },
        { overall_score: 100, stage: 'hiring_manager' },
        { overall_score: 100, stage: 'sme_technical' },
        { overall_score: 100, stage: 'executive_final' },
      ],
      totalSimulations: 50,
      selfIntroScore: 100,
      resumeAtsScore: 100,
      resumeJdMatch: 100,
      currentStreak: 100,
      longestStreak: 100,
      totalSimulationsCompleted: 50,
      actualInterviews: [
        { outcome: 'success', self_rating: 5 },
        { outcome: 'success', self_rating: 5 },
        { outcome: 'success', self_rating: 5 },
        { outcome: 'success', self_rating: 5 },
        { outcome: 'success', self_rating: 5 },
      ],
      reflectionCount: 20,
    });

    expect(score.total).toBe(100);
  });

  it('should handle missing profile data gracefully', () => {
    const score = calculateReadinessScoreBreakdown({
      completedModules: 10,
      totalModules: 20,
      moduleStages: new Set(['hr_screening', 'functional_team']),
      recentSimulations: [{ overall_score: 75, stage: 'hr_screening' }],
      totalSimulations: 1,
      currentStreak: 3,
      longestStreak: 5,
      totalSimulationsCompleted: 1,
      actualInterviews: [],
      reflectionCount: 0,
    });

    expect(score.profile).toBe(0);
    expect(score.total).toBeGreaterThan(0);
  });
});

// ============================================================================
// Streak Tests
// ============================================================================

describe('shouldContinueStreak', () => {
  it('should return false for null last active date', () => {
    expect(shouldContinueStreak(null)).toBe(false);
  });

  it('should return true if active today', () => {
    const today = new Date().toISOString();
    expect(shouldContinueStreak(today)).toBe(true);
  });

  it('should return true if active yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(shouldContinueStreak(yesterday)).toBe(true);
  });

  it('should return false if active 2 days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString();
    expect(shouldContinueStreak(twoDaysAgo)).toBe(false);
  });
});

describe('calculateNewStreak', () => {
  it('should start new streak for null last active', () => {
    const result = calculateNewStreak(null, 0);
    expect(result.newStreak).toBe(1);
    expect(result.streakBroken).toBe(false);
  });

  it('should maintain streak if already active today', () => {
    const today = new Date().toISOString();
    const result = calculateNewStreak(today, 5);
    expect(result.newStreak).toBe(5);
    expect(result.streakBroken).toBe(false);
  });

  it('should increment streak if active yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const result = calculateNewStreak(yesterday, 5);
    expect(result.newStreak).toBe(6);
    expect(result.streakBroken).toBe(false);
  });

  it('should break streak if inactive for 2+ days', () => {
    const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString();
    const result = calculateNewStreak(twoDaysAgo, 10);
    expect(result.newStreak).toBe(1);
    expect(result.streakBroken).toBe(true);
  });
});

// ============================================================================
// Level Calculation Tests
// ============================================================================

describe('calculateLevel', () => {
  it('should calculate level correctly', () => {
    expect(calculateLevel(0)).toBe(0);
    expect(calculateLevel(100)).toBe(1);
    expect(calculateLevel(400)).toBe(2);
    expect(calculateLevel(900)).toBe(3);
    expect(calculateLevel(10000)).toBe(10);
  });
});

describe('calculateXPForNextLevel', () => {
  it('should calculate XP for next level correctly', () => {
    expect(calculateXPForNextLevel(0)).toBe(100); // Level 1
    expect(calculateXPForNextLevel(1)).toBe(400); // Level 2
    expect(calculateXPForNextLevel(2)).toBe(900); // Level 3
    expect(calculateXPForNextLevel(5)).toBe(3600); // Level 6
  });
});

describe('calculateLevelProgress', () => {
  it('should calculate progress correctly', () => {
    expect(calculateLevelProgress(0)).toBe(0); // 0% into level 1
    expect(calculateLevelProgress(50)).toBe(50); // 50% into level 1
    expect(calculateLevelProgress(100)).toBe(0); // Just hit level 1
    expect(calculateLevelProgress(250)).toBe(50); // 50% into level 2
  });

  it('should handle edge cases', () => {
    const progress = calculateLevelProgress(99);
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
  });
});

// ============================================================================
// Badge Progress Tests
// ============================================================================

describe('calculateBadgeProgress', () => {
  it('should calculate badge progress correctly', () => {
    expect(calculateBadgeProgress(0, 10)).toBe(0);
    expect(calculateBadgeProgress(5, 10)).toBe(50);
    expect(calculateBadgeProgress(10, 10)).toBe(100);
    expect(calculateBadgeProgress(15, 10)).toBe(150);
  });

  it('should handle zero requirement', () => {
    expect(calculateBadgeProgress(5, 0)).toBe(100);
  });
});

describe('shouldAwardBadge', () => {
  it('should award badge when requirement met and not earned', () => {
    expect(shouldAwardBadge(10, 10, false)).toBe(true);
    expect(shouldAwardBadge(15, 10, false)).toBe(true);
  });

  it('should not award badge when already earned', () => {
    expect(shouldAwardBadge(10, 10, true)).toBe(false);
  });

  it('should not award badge when requirement not met', () => {
    expect(shouldAwardBadge(5, 10, false)).toBe(false);
  });
});
