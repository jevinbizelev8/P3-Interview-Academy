import { db } from "../db";
import {
  practiceSessions,
  actualInterviews,
  userModuleProgress,
  reflectionJournals,
} from "@shared/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";

/**
 * Analytics Service
 *
 * Handles performance analytics including:
 * - Performance insights and trends
 * - Interview success tracking
 * - Progress over time analysis
 * - Personalized recommendations
 */
export class AnalyticsService {
  /**
   * Get comprehensive performance insights for a user
   */
  static async getPerformanceInsights(userId: string): Promise<{
    practiceStats: {
      totalSessions: number;
      completedSessions: number;
      averageScore: number;
      improvement: number;
    };
    interviewStats: {
      totalInterviews: number;
      successfulInterviews: number;
      successRate: number;
      averageConfidence: number;
    };
    learningStats: {
      modulesCompleted: number;
      totalTimeSpent: number;
      averageModuleScore: number;
    };
    reflectionStats: {
      totalReflections: number;
      averageMoodScore: number;
    };
    recommendations: string[];
  }> {
    try {
      // Practice sessions stats
      const allPracticeSessions = await db
        .select()
        .from(practiceSessions)
        .where(eq(practiceSessions.userId, userId));

      const completedPracticeSessions = allPracticeSessions.filter(
        (s) => s.status === "completed"
      );

      const practiceScores = completedPracticeSessions
        .filter((s) => s.overallStarScore !== null)
        .map((s) => s.overallStarScore!);

      const averagePracticeScore =
        practiceScores.length > 0
          ? practiceScores.reduce((sum, score) => sum + score, 0) / practiceScores.length
          : 0;

      // Calculate improvement (compare recent vs older scores)
      const recentScores = practiceScores.slice(-5);
      const olderScores = practiceScores.slice(0, -5);
      const recentAvg =
        recentScores.length > 0
          ? recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length
          : 0;
      const olderAvg =
        olderScores.length > 0
          ? olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length
          : 0;
      const improvement = recentAvg - olderAvg;

      // Actual interviews stats
      const interviews = await db
        .select()
        .from(actualInterviews)
        .where(eq(actualInterviews.userId, userId));

      const successfulInterviews = interviews.filter(
        (i) => i.outcome === "offer" || i.outcome === "next_round"
      );

      const successRate =
        interviews.length > 0
          ? (successfulInterviews.length / interviews.length) * 100
          : 0;

      const confidenceScores = interviews
        .filter((i) => i.confidenceLevel !== null)
        .map((i) => i.confidenceLevel!);

      const averageConfidence =
        confidenceScores.length > 0
          ? confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length
          : 0;

      // Learning stats
      const moduleProgress = await db
        .select()
        .from(userModuleProgress)
        .where(eq(userModuleProgress.userId, userId));

      const completedModules = moduleProgress.filter((m) => m.isCompleted).length;
      const totalTimeSpent = moduleProgress.reduce(
        (sum, m) => sum + (m.timeSpentMinutes || 0),
        0
      );

      const moduleScores = moduleProgress
        .filter((m) => m.score !== null)
        .map((m) => m.score!);

      const averageModuleScore =
        moduleScores.length > 0
          ? moduleScores.reduce((sum, score) => sum + score, 0) / moduleScores.length
          : 0;

      // Reflection stats
      const reflections = await db
        .select()
        .from(reflectionJournals)
        .where(eq(reflectionJournals.userId, userId));

      const moodScores = reflections
        .filter((r) => r.moodScore !== null)
        .map((r) => r.moodScore!);

      const averageMoodScore =
        moodScores.length > 0
          ? moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length
          : 0;

      // Generate recommendations
      const recommendations = this.generateRecommendations({
        practiceScore: averagePracticeScore,
        improvement,
        completedSessions: completedPracticeSessions.length,
        modulesCompleted: completedModules,
        reflections: reflections.length,
        successRate,
      });

      console.log(
        `✅ Generated performance insights for user ${userId}`
      );

      return {
        practiceStats: {
          totalSessions: allPracticeSessions.length,
          completedSessions: completedPracticeSessions.length,
          averageScore: Math.round(averagePracticeScore * 10) / 10,
          improvement: Math.round(improvement * 10) / 10,
        },
        interviewStats: {
          totalInterviews: interviews.length,
          successfulInterviews: successfulInterviews.length,
          successRate: Math.round(successRate * 10) / 10,
          averageConfidence: Math.round(averageConfidence * 10) / 10,
        },
        learningStats: {
          modulesCompleted: completedModules,
          totalTimeSpent,
          averageModuleScore: Math.round(averageModuleScore * 10) / 10,
        },
        reflectionStats: {
          totalReflections: reflections.length,
          averageMoodScore: Math.round(averageMoodScore * 10) / 10,
        },
        recommendations,
      };
    } catch (error) {
      console.error("❌ Error getting performance insights:", error);
      throw new Error(`Failed to get performance insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get performance chart data (time series)
   */
  static async getPerformanceChart(
    userId: string,
    days: number = 30
  ): Promise<
    Array<{
      date: string;
      practiceScore: number;
      modulesCompleted: number;
      reflections: number;
    }>
  > {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get practice sessions
      const sessions = await db
        .select()
        .from(practiceSessions)
        .where(
          and(
            eq(practiceSessions.userId, userId),
            gte(practiceSessions.createdAt, startDate)
          )
        );

      // Get module completions
      const modules = await db
        .select()
        .from(userModuleProgress)
        .where(
          and(
            eq(userModuleProgress.userId, userId),
            gte(userModuleProgress.completedAt, startDate)
          )
        );

      // Get reflections
      const reflections = await db
        .select()
        .from(reflectionJournals)
        .where(
          and(
            eq(reflectionJournals.userId, userId),
            gte(reflectionJournals.createdAt, startDate)
          )
        );

      // Group by date
      const chartData = new Map<string, { practice: number[]; modules: number; reflections: number }>();

      sessions.forEach((session) => {
        const date = new Date(session.createdAt).toISOString().split("T")[0];
        if (!chartData.has(date)) {
          chartData.set(date, { practice: [], modules: 0, reflections: 0 });
        }
        if (session.overallStarScore) {
          chartData.get(date)!.practice.push(session.overallStarScore);
        }
      });

      modules.forEach((module) => {
        if (!module.completedAt) return;
        const date = new Date(module.completedAt).toISOString().split("T")[0];
        if (!chartData.has(date)) {
          chartData.set(date, { practice: [], modules: 0, reflections: 0 });
        }
        chartData.get(date)!.modules += 1;
      });

      reflections.forEach((reflection) => {
        const date = new Date(reflection.createdAt).toISOString().split("T")[0];
        if (!chartData.has(date)) {
          chartData.set(date, { practice: [], modules: 0, reflections: 0 });
        }
        chartData.get(date)!.reflections += 1;
      });

      // Convert to array and calculate averages
      const result = Array.from(chartData.entries())
        .map(([date, data]) => ({
          date,
          practiceScore:
            data.practice.length > 0
              ? Math.round(
                  (data.practice.reduce((sum, score) => sum + score, 0) /
                    data.practice.length) *
                    10
                ) / 10
              : 0,
          modulesCompleted: data.modules,
          reflections: data.reflections,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      console.log(
        `✅ Generated ${result.length} days of chart data for user ${userId}`
      );

      return result;
    } catch (error) {
      console.error("❌ Error getting performance chart:", error);
      throw new Error(`Failed to get performance chart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get performance statistics summary
   */
  static async getPerformanceStats(userId: string): Promise<{
    totalPracticeSessions: number;
    totalInterviews: number;
    totalModulesCompleted: number;
    totalReflections: number;
    averagePracticeScore: number;
    interviewSuccessRate: number;
    currentStreak: number;
    longestStreak: number;
  }> {
    try {
      const insights = await this.getPerformanceInsights(userId);

      // Get streak info from users table
      const [user] = await db.execute(
        sql`SELECT current_streak, longest_streak FROM users WHERE id = ${userId}`
      );

      const currentStreak = (user as any)?.current_streak || 0;
      const longestStreak = (user as any)?.longest_streak || 0;

      return {
        totalPracticeSessions: insights.practiceStats.totalSessions,
        totalInterviews: insights.interviewStats.totalInterviews,
        totalModulesCompleted: insights.learningStats.modulesCompleted,
        totalReflections: insights.reflectionStats.totalReflections,
        averagePracticeScore: insights.practiceStats.averageScore,
        interviewSuccessRate: insights.interviewStats.successRate,
        currentStreak,
        longestStreak,
      };
    } catch (error) {
      console.error("❌ Error getting performance stats:", error);
      throw new Error(`Failed to get performance stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate personalized recommendations
   */
  private static generateRecommendations(data: {
    practiceScore: number;
    improvement: number;
    completedSessions: number;
    modulesCompleted: number;
    reflections: number;
    successRate: number;
  }): string[] {
    const recommendations: string[] = [];

    // Practice recommendations
    if (data.completedSessions < 5) {
      recommendations.push(
        "Complete more practice simulations to build confidence and refine your STAR responses"
      );
    } else if (data.practiceScore < 70) {
      recommendations.push(
        "Focus on improving your STAR response structure - provide more specific details"
      );
    }

    // Improvement trend
    if (data.improvement < 0) {
      recommendations.push(
        "Your recent scores show a decline - review your reflections and identify areas to focus on"
      );
    } else if (data.improvement > 5) {
      recommendations.push(
        "Great progress! Your scores are improving - keep up the practice"
      );
    }

    // Module recommendations
    if (data.modulesCompleted < 5) {
      recommendations.push(
        "Complete more learning modules to strengthen your interview fundamentals"
      );
    }

    // Reflection recommendations
    if (data.reflections < data.completedSessions * 0.5) {
      recommendations.push(
        "Write more reflection journals after practice - they help identify patterns and track growth"
      );
    }

    // Success rate recommendations
    if (data.successRate < 50 && data.completedSessions >= 10) {
      recommendations.push(
        "Continue practicing - success in real interviews often requires sustained preparation"
      );
    }

    // Default recommendation if none above apply
    if (recommendations.length === 0) {
      recommendations.push(
        "You're doing well! Maintain your practice routine and continue refining your skills"
      );
    }

    return recommendations;
  }
}
