import { db } from "../db";
import {
  users,
  practiceSessions,
  practiceReports,
  userModuleProgress,
  learningModules,
  selfIntros,
  resumes,
  type User,
} from "@shared/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { LearningModuleService } from "./learning-module-service";

/**
 * Readiness Score Service
 *
 * Calculates interview readiness score (0-100%) based on:
 * - 60% AI Simulation Performance (average of last 5 simulations)
 * - 20% Learning Module Completion (percentage completed)
 * - 10% Self-Introduction Score (latest assessment)
 * - 5% Resume Optimization (ATS score + JD match)
 * - 5% Practice Consistency (streaks and recent engagement)
 */
export class ReadinessService {
  /**
   * Calculate comprehensive readiness score for a user
   */
  static async calculateReadinessScore(userId: string): Promise<{
    overallScore: number;
    breakdown: {
      simulationPerformance: { score: number; weight: number; weighted: number };
      moduleCompletion: { score: number; weight: number; weighted: number };
      selfIntroduction: { score: number; weight: number; weighted: number };
      resumeOptimization: { score: number; weight: number; weighted: number };
      practiceConsistency: { score: number; weight: number; weighted: number };
    };
    recommendations: string[];
  }> {
    try {
      // Calculate each component
      const [
        simulationScore,
        moduleScore,
        selfIntroScore,
        resumeScore,
        consistencyScore,
      ] = await Promise.all([
        this.calculateSimulationPerformance(userId),
        this.calculateModuleCompletion(userId),
        this.calculateSelfIntroScore(userId),
        this.calculateResumeScore(userId),
        this.calculatePracticeConsistency(userId),
      ]);

      // Weights (must sum to 1.0)
      const weights = {
        simulation: 0.6,
        module: 0.2,
        selfIntro: 0.1,
        resume: 0.05,
        consistency: 0.05,
      };

      // Calculate weighted scores
      const breakdown = {
        simulationPerformance: {
          score: simulationScore,
          weight: weights.simulation,
          weighted: simulationScore * weights.simulation,
        },
        moduleCompletion: {
          score: moduleScore,
          weight: weights.module,
          weighted: moduleScore * weights.module,
        },
        selfIntroduction: {
          score: selfIntroScore,
          weight: weights.selfIntro,
          weighted: selfIntroScore * weights.selfIntro,
        },
        resumeOptimization: {
          score: resumeScore,
          weight: weights.resume,
          weighted: resumeScore * weights.resume,
        },
        practiceConsistency: {
          score: consistencyScore,
          weight: weights.consistency,
          weighted: consistencyScore * weights.consistency,
        },
      };

      // Calculate overall score
      const overallScore = Math.round(
        breakdown.simulationPerformance.weighted +
        breakdown.moduleCompletion.weighted +
        breakdown.selfIntroduction.weighted +
        breakdown.resumeOptimization.weighted +
        breakdown.practiceConsistency.weighted
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(breakdown);

      // Update user's readiness score
      await db
        .update(users)
        .set({
          readinessScore: overallScore,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log(
        `✅ Calculated readiness score for user ${userId}: ${overallScore}/100`
      );

      return {
        overallScore,
        breakdown,
        recommendations,
      };
    } catch (error) {
      console.error("❌ Error calculating readiness score:", error);
      throw new Error(`Failed to calculate readiness score: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate simulation performance score (60% weight)
   * Based on average STAR score from last 5 practice sessions
   */
  private static async calculateSimulationPerformance(
    userId: string
  ): Promise<number> {
    try {
      // Get last 5 completed practice sessions
      const sessions = await db
        .select({
          session: practiceSessions,
          report: practiceReports,
        })
        .from(practiceSessions)
        .leftJoin(practiceReports, eq(practiceSessions.id, practiceReports.sessionId))
        .where(
          and(
            eq(practiceSessions.userId, userId),
            eq(practiceSessions.status, "completed")
          )
        )
        .orderBy(desc(practiceSessions.createdAt))
        .limit(5);

      if (sessions.length === 0) {
        return 0; // No simulations completed
      }

      // Calculate average STAR score from reports
      const totalScore = sessions.reduce((sum, s) => {
        const starScore = s.report?.overallScore ? parseFloat(s.report.overallScore) : 0;
        return sum + starScore;
      }, 0);

      const averageScore = Math.round(totalScore / sessions.length);

      console.log(
        `  Simulation performance: ${averageScore} (from ${sessions.length} session(s))`
      );
      return averageScore;
    } catch (error) {
      console.error("❌ Error calculating simulation performance:", error);
      return 0;
    }
  }

  /**
   * Calculate module completion score (20% weight)
   * Based on percentage of learning modules completed
   */
  private static async calculateModuleCompletion(
    userId: string
  ): Promise<number> {
    try {
      const stats = await LearningModuleService.getCompletionStats(userId);
      const score = Math.round(stats.completionPercentage);

      console.log(
        `  Module completion: ${score}% (${stats.completedModules}/${stats.totalModules} modules)`
      );
      return score;
    } catch (error) {
      console.error("❌ Error calculating module completion:", error);
      return 0;
    }
  }

  /**
   * Calculate self-introduction score (10% weight)
   * Based on latest self-intro AI assessment
   */
  private static async calculateSelfIntroScore(userId: string): Promise<number> {
    try {
      const [intro] = await db
        .select()
        .from(selfIntros)
        .where(
          and(
            eq(selfIntros.userId, userId),
            eq(selfIntros.isActive, true)
          )
        )
        .limit(1);

      const score = intro?.overallScore || 0;

      console.log(
        `  Self-introduction: ${score}${intro ? ' (active intro found)' : ' (no intro yet)'}`
      );
      return score;
    } catch (error) {
      console.error("❌ Error calculating self-intro score:", error);
      return 0;
    }
  }

  /**
   * Calculate resume optimization score (5% weight)
   * Based on ATS score and JD match percentage
   */
  private static async calculateResumeScore(userId: string): Promise<number> {
    try {
      const [resume] = await db
        .select()
        .from(resumes)
        .where(
          and(
            eq(resumes.userId, userId),
            eq(resumes.isActive, true)
          )
        )
        .limit(1);

      if (!resume) {
        console.log(`  Resume optimization: 0 (no resume uploaded)`);
        return 0;
      }

      // Average of ATS score and JD match (both 0-100)
      const atsScore = resume.atsScore || 0;
      const jdMatch = resume.jdMatchPercentage || 0;
      const score = Math.round((atsScore + jdMatch) / 2);

      console.log(
        `  Resume optimization: ${score} (ATS: ${atsScore}, JD: ${jdMatch})`
      );
      return score;
    } catch (error) {
      console.error("❌ Error calculating resume score:", error);
      return 0;
    }
  }

  /**
   * Calculate practice consistency score (5% weight)
   * Based on current streak and recent activity
   */
  private static async calculatePracticeConsistency(
    userId: string
  ): Promise<number> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return 0;
      }

      const currentStreak = user.currentStreak || 0;
      const longestStreak = user.longestStreak || 0;

      // Score based on streaks (with diminishing returns)
      // 7+ day streak = 100%, 5-6 days = 80%, 3-4 days = 60%, 1-2 days = 40%, 0 = 0%
      let score = 0;
      if (currentStreak >= 7) {
        score = 100;
      } else if (currentStreak >= 5) {
        score = 80;
      } else if (currentStreak >= 3) {
        score = 60;
      } else if (currentStreak >= 1) {
        score = 40;
      }

      // Bonus for having a good longest streak (historical consistency)
      if (longestStreak >= 14) {
        score = Math.min(100, score + 10);
      } else if (longestStreak >= 7) {
        score = Math.min(100, score + 5);
      }

      console.log(
        `  Practice consistency: ${score} (current: ${currentStreak}, longest: ${longestStreak})`
      );
      return score;
    } catch (error) {
      console.error("❌ Error calculating practice consistency:", error);
      return 0;
    }
  }

  /**
   * Generate personalized recommendations based on score breakdown
   */
  private static generateRecommendations(breakdown: any): string[] {
    const recommendations: string[] = [];

    // Simulation performance (60% weight - highest priority)
    if (breakdown.simulationPerformance.score < 70) {
      recommendations.push(
        "Complete more practice simulations to improve your STAR response scores"
      );
    }

    // Module completion (20% weight)
    if (breakdown.moduleCompletion.score < 50) {
      recommendations.push(
        "Complete more learning modules to build foundational interview skills"
      );
    } else if (breakdown.moduleCompletion.score < 100) {
      recommendations.push(
        "Finish remaining learning modules to maximize your readiness"
      );
    }

    // Self-introduction (10% weight)
    if (breakdown.selfIntroduction.score === 0) {
      recommendations.push(
        "Create your self-introduction using the 6-step wizard"
      );
    } else if (breakdown.selfIntroduction.score < 80) {
      recommendations.push(
        "Refine your self-introduction to make a stronger first impression"
      );
    }

    // Resume optimization (5% weight)
    if (breakdown.resumeOptimization.score === 0) {
      recommendations.push(
        "Upload your resume and get AI-powered optimization suggestions"
      );
    } else if (breakdown.resumeOptimization.score < 80) {
      recommendations.push(
        "Improve your resume's ATS score and job description match"
      );
    }

    // Practice consistency (5% weight)
    if (breakdown.practiceConsistency.score < 40) {
      recommendations.push(
        "Practice regularly to build consistency and maintain your skills"
      );
    } else if (breakdown.practiceConsistency.score < 80) {
      recommendations.push(
        "Keep up your practice streak to stay interview-ready"
      );
    }

    // If score is already high
    if (recommendations.length === 0) {
      recommendations.push(
        "Excellent work! Maintain your practice routine and continue refining your skills"
      );
    }

    return recommendations;
  }

  /**
   * Get readiness score from database (cached value)
   */
  static async getReadinessScore(userId: string): Promise<number> {
    try {
      const [user] = await db
        .select({ readinessScore: users.readinessScore })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return user?.readinessScore || 0;
    } catch (error) {
      console.error("❌ Error getting readiness score:", error);
      return 0;
    }
  }

  /**
   * Update user's last activity date (for streak tracking)
   */
  static async updateLastActivity(userId: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          lastActivityDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log(`✅ Updated last activity for user ${userId}`);
    } catch (error) {
      console.error("❌ Error updating last activity:", error);
      // Don't throw - activity update failure shouldn't block operations
    }
  }
}
