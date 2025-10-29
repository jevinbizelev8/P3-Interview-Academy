
import { base44 } from "@/api/base44Client";

/**
 * Rewards Points Values for Different Actions
 */
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
  BADGE_EARNED: 0,
};

/**
 * Award Rewards Points to a user for a specific action
 */
export async function awardXP(userId, xpAmount, action, referenceId = null) {
  try {
    const profiles = await base44.entities.UserProfile.filter({ user_id: userId });
    
    if (profiles.length === 0) {
      await base44.entities.UserProfile.create({
        user_id: userId,
        xp_points: xpAmount,
        current_streak: 0,
        total_simulations: 0,
        readiness_score: 0
      });
      return xpAmount;
    }

    const profile = profiles[0];
    const newXP = (profile.xp_points || 0) + xpAmount;

    await base44.entities.UserProfile.update(profile.id, {
      xp_points: newXP
    });

    console.log(`Awarded ${xpAmount} Rewards Points for ${action}. Total: ${newXP}`);

    return newXP;
  } catch (error) {
    console.error("Error awarding Rewards Points:", error);
    throw error;
  }
}

/**
 * Calculate Rewards Points for simulation based on stage and score
 */
export function calculateSimulationXP(stage, overallScore) {
  let baseXP = 0;
  
  switch(stage) {
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

  let bonusXP = 0;
  if (overallScore >= 90) {
    bonusXP = XP_VALUES.SIMULATION_BONUS_90;
  } else if (overallScore >= 80) {
    bonusXP = XP_VALUES.SIMULATION_BONUS_80;
  }

  return baseXP + bonusXP;
}

/**
 * Calculate Interview Readiness Score - ENHANCED VERSION
 * This is the main function that determines overall preparedness (0-100)
 * 
 * Breakdown:
 * 1. Learning Foundation (25%): Module completion across all stages
 * 2. Practice Performance (40%): Simulation scores and consistency
 * 3. Profile Optimization (15%): Self-intro and resume quality
 * 4. Experience & Consistency (10%): Practice frequency and streaks
 * 5. Real-World Readiness (10%): Actual interview tracking and reflection
 */
export async function calculateReadinessScore(userId) {
  try {
    const currentUser = await base44.auth.me();
    if (!currentUser || currentUser.id !== userId) {
      console.warn("User mismatch in readiness calculation");
      return 0;
    }

    // === 1. LEARNING FOUNDATION (25%) ===
    const completedModules = await base44.entities.UserModuleProgress.filter({
      created_by: currentUser.email,
      completed: true
    });

    // Total expected modules across all 5 stages (4 modules per stage = 20 total)
    const TOTAL_EXPECTED_MODULES = 20;
    const moduleCompletionRate = Math.min(completedModules.length / TOTAL_EXPECTED_MODULES, 1);
    
    // Calculate stage diversity bonus (completing modules across different stages is better)
    const stagesWithModules = new Set(completedModules.map(m => m.stage)).size;
    const stageDiversityBonus = (stagesWithModules / 5) * 0.1; // Up to 10% bonus
    
    const learningScore = (moduleCompletionRate + stageDiversityBonus) * 100 * 0.25;

    // === 2. PRACTICE PERFORMANCE (40%) ===
    const allSimulations = await base44.entities.InterviewSimulation.filter({
      created_by: currentUser.email,
      completed: true
    });

    let practiceScore = 0;
    
    if (allSimulations.length > 0) {
      // Recent performance (last 5 simulations) - 60% of practice score
      const recentSimulations = allSimulations
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        .slice(0, 5);
      
      const recentAvgScore = recentSimulations.reduce((sum, sim) => sum + (sim.overall_score || 0), 0) / recentSimulations.length;
      const recentPerformance = recentAvgScore * 0.6;

      // Stage coverage - 20% of practice score
      const practiceStages = new Set(allSimulations.map(s => s.stage)).size;
      const stageCoverage = (practiceStages / 5) * 100 * 0.2;

      // Volume bonus - 20% of practice score
      const volumeBonus = Math.min(allSimulations.length / 10, 1) * 100 * 0.2;

      practiceScore = (recentPerformance + stageCoverage + volumeBonus) * 0.4;
    }

    // === 3. PROFILE OPTIMIZATION (15%) ===
    let profileScore = 0;

    // Self-introduction quality - 60% of profile score
    const selfIntros = await base44.entities.SelfIntro.filter(
      { created_by: currentUser.email },
      '-created_date',
      1
    );
    
    if (selfIntros.length > 0) {
      const selfIntroQuality = (selfIntros[0].overall_score || 0) * 0.6;
      profileScore += selfIntroQuality;
    }

    // Resume optimization - 40% of profile score
    const resumes = await base44.entities.Resume.filter(
      { created_by: currentUser.email },
      '-created_date',
      1
    );
    
    if (resumes.length > 0) {
      const resume = resumes[0];
      let resumeScore = resume.ats_score || 0;
      
      // If JD match is available, use weighted average
      if (resume.jd_match_percentage) {
        resumeScore = (resume.ats_score * 0.5) + (resume.jd_match_percentage * 0.5);
      }
      
      profileScore += resumeScore * 0.4;
    }

    profileScore = profileScore * 0.15;

    // === 4. EXPERIENCE & CONSISTENCY (10%) ===
    const profiles = await base44.entities.UserProfile.filter({ user_id: userId });
    let consistencyScore = 0;
    
    if (profiles.length > 0) {
      const profile = profiles[0];
      
      // Streak contribution - 50%
      const streakPoints = Math.min((profile.current_streak || 0) * 5, 50);
      
      // Activity volume - 30%
      const activityPoints = Math.min((profile.total_simulations || 0) * 3, 30);
      
      // Longest streak achievement - 20%
      const longestStreakPoints = Math.min((profile.longest_streak || 0) * 2, 20);
      
      consistencyScore = (streakPoints + activityPoints + longestStreakPoints) * 0.1;
    }

    // === 5. REAL-WORLD READINESS (10%) ===
    let realWorldScore = 0;

    // Actual interviews tracked
    const actualInterviews = await base44.entities.ActualInterview.filter({
      created_by: currentUser.email
    });

    if (actualInterviews.length > 0) {
      // Having tracked real interviews shows commitment - 40%
      const trackingBonus = Math.min(actualInterviews.length / 5, 1) * 40;
      
      // Success rate matters - 40%
      const successfulInterviews = actualInterviews.filter(i => i.outcome === 'success').length;
      const successRate = actualInterviews.length > 0 ? (successfulInterviews / actualInterviews.length) * 40 : 0;
      
      // Self-ratings average - 20%
      const ratingsSum = actualInterviews.reduce((sum, i) => sum + (i.self_rating || 0), 0);
      const avgRating = actualInterviews.length > 0 ? (ratingsSum / actualInterviews.length) * 0.2 : 0;
      
      realWorldScore = (trackingBonus + successRate + avgRating) * 0.1;
    }

    // Reflection journals bonus
    const reflections = await base44.entities.ReflectionJournal.filter({
      created_by: currentUser.email
    });
    
    if (reflections.length > 0) {
      // Reflection shows self-awareness - adds up to 5% bonus to real-world score
      const reflectionBonus = Math.min(reflections.length / 10, 0.5) * 10;
      realWorldScore += reflectionBonus * 0.1;
    }

    // === CALCULATE FINAL READINESS SCORE ===
    const finalScore = Math.round(
      learningScore + practiceScore + profileScore + consistencyScore + realWorldScore
    );

    // Cap at 100
    const readinessScore = Math.min(finalScore, 100);

    // === UPDATE USER PROFILE ===
    if (profiles.length > 0) {
      await base44.entities.UserProfile.update(profiles[0].id, {
        readiness_score: readinessScore,
        last_calculated_date: new Date().toISOString()
      });
    }

    console.log(`Readiness Score Calculated for ${currentUser.email}:`, {
      learning: Math.round(learningScore),
      practice: Math.round(practiceScore),
      profile: Math.round(profileScore),
      consistency: Math.round(consistencyScore),
      realWorld: Math.round(realWorldScore),
      total: readinessScore
    });

    return readinessScore;
  } catch (error) {
    console.error("Error calculating readiness score:", error);
    return 0;
  }
}

/**
 * Update streak and award streak Rewards Points
 */
export async function updateStreak(userId) {
  try {
    const profiles = await base44.entities.UserProfile.filter({ user_id: userId });
    
    if (profiles.length === 0) return;

    const profile = profiles[0];
    const today = new Date().toISOString().split('T')[0];
    const lastActive = profile.last_active_date;

    let newStreak = profile.current_streak || 0;
    let streakXP = 0;

    if (lastActive) {
      const lastActiveDate = new Date(lastActive).toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (lastActiveDate === today) {
        return;
      } else if (lastActiveDate === yesterday) {
        newStreak += 1;
        streakXP = XP_VALUES.DAILY_STREAK_BASE * newStreak;
      } else {
        newStreak = 1;
        streakXP = XP_VALUES.DAILY_STREAK_BASE;
      }
    } else {
      newStreak = 1;
      streakXP = XP_VALUES.DAILY_STREAK_BASE;
    }

    await base44.entities.UserProfile.update(profile.id, {
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, profile.longest_streak || 0),
      last_active_date: today
    });

    if (streakXP > 0) {
      await awardXP(userId, streakXP, `Daily Streak Day ${newStreak}`, profile.id);
    }

    // Recalculate readiness after streak update
    await calculateReadinessScore(userId);

    return newStreak;
  } catch (error) {
    console.error("Error updating streak:", error);
  }
}

/**
 * Update total simulations count
 */
export async function incrementSimulationCount(userId) {
  try {
    const profiles = await base44.entities.UserProfile.filter({ user_id: userId });
    
    if (profiles.length === 0) return;

    const profile = profiles[0];
    await base44.entities.UserProfile.update(profile.id, {
      total_simulations: (profile.total_simulations || 0) + 1
    });

    // Recalculate readiness after simulation count update
    await calculateReadinessScore(userId);
  } catch (error) {
    console.error("Error incrementing simulation count:", error);
  }
}
