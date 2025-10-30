import { db } from "../db";
import {
  learningModules,
  userModuleProgress,
  users,
  type LearningModule,
  type UserModuleProgress,
  type InsertUserModuleProgress,
} from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

/**
 * Learning Module Service
 *
 * Handles all learning module operations including:
 * - Module retrieval and filtering
 * - User progress tracking
 * - Module completion and scoring
 * - XP reward distribution
 */
export class LearningModuleService {
  /**
   * Get all active learning modules with optional stage filter
   */
  static async getModules(stage?: string): Promise<LearningModule[]> {
    try {

      const conditions = [eq(learningModules.isActive, true)];

      if (stage) {
        conditions.push(eq(learningModules.stage, stage));
      }

      const modules = await db
        .select()
        .from(learningModules)
        .where(and(...conditions))
        .orderBy(learningModules.sortOrder);
      console.log(`✅ Retrieved ${modules.length} learning modules${stage ? ` for stage: ${stage}` : ''}`);
      return modules;
    } catch (error) {
      console.error("❌ Error retrieving learning modules:", error);
      throw new Error(`Failed to retrieve modules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get modules by stage (Prepare, Practice, Perform)
   */
  static async getModulesByStage(stage: string): Promise<LearningModule[]> {
    return this.getModules(stage);
  }

  /**
   * Get user's progress for all modules or specific module
   */
  static async getUserProgress(
    userId: string,
    moduleId?: string
  ): Promise<UserModuleProgress[]> {
    try {
      const conditions = [eq(userModuleProgress.userId, userId)];

      if (moduleId) {
        conditions.push(eq(userModuleProgress.moduleId, moduleId));
      }

      const progress = await db
        .select()
        .from(userModuleProgress)
        .where(and(...conditions))
        .orderBy(desc(userModuleProgress.updatedAt));

      console.log(
        `✅ Retrieved progress for user ${userId}: ${progress.length} module(s)`
      );
      return progress;
    } catch (error) {
      console.error("❌ Error retrieving user progress:", error);
      throw new Error(`Failed to retrieve progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get enriched modules with user progress
   */
  static async getModulesWithProgress(
    userId: string,
    stage?: string
  ): Promise<Array<LearningModule & { progress?: UserModuleProgress }>> {
    try {
      const modules = await this.getModules(stage);
      const progress = await this.getUserProgress(userId);

      // Create a map of module ID to progress
      const progressMap = new Map(
        progress.map((p) => [p.moduleId, p])
      );

      // Enrich modules with progress data
      const enrichedModules = modules.map((module) => ({
        ...module,
        progress: progressMap.get(module.id),
      }));

      console.log(
        `✅ Retrieved ${enrichedModules.length} modules with progress for user ${userId}`
      );
      return enrichedModules;
    } catch (error) {
      console.error("❌ Error retrieving modules with progress:", error);
      throw new Error(`Failed to retrieve modules with progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start or update progress for a module
   */
  static async updateProgress(
    userId: string,
    moduleId: string,
    data: {
      isCompleted?: boolean;
      timeSpentMinutes?: number;
      score?: number;
      userData?: any;
    }
  ): Promise<UserModuleProgress> {
    try {
      // Check if progress already exists
      const [existingProgress] = await db
        .select()
        .from(userModuleProgress)
        .where(
          and(
            eq(userModuleProgress.userId, userId),
            eq(userModuleProgress.moduleId, moduleId)
          )
        )
        .limit(1);

      let result: UserModuleProgress;

      if (existingProgress) {
        // Update existing progress
        const updateData: Partial<InsertUserModuleProgress> = {
        };

        if (data.isCompleted !== undefined) {
          updateData.isCompleted = data.isCompleted;
          if (data.isCompleted && !existingProgress.completedAt) {
            updateData.completedAt = new Date();
          }
        }

        if (data.timeSpentMinutes !== undefined) {
          updateData.timeSpentMinutes =
            (existingProgress.timeSpentMinutes || 0) + data.timeSpentMinutes;
        }

        if (data.score !== undefined) {
          updateData.score = data.score;
        }

        if (data.userData !== undefined) {
          updateData.userData = data.userData;
        }

        [result] = await db
          .update(userModuleProgress)
          .set(updateData)
          .where(
            and(
              eq(userModuleProgress.userId, userId),
              eq(userModuleProgress.moduleId, moduleId)
            )
          )
          .returning();

        console.log(
          `✅ Updated progress for user ${userId}, module ${moduleId}`
        );
      } else {
        // Create new progress entry
        const progressData: InsertUserModuleProgress = {
          userId,
          moduleId,
          isCompleted: data.isCompleted || false,
          timeSpentMinutes: data.timeSpentMinutes || 0,
          score: data.score,
          userData: data.userData,
        };

        if (data.isCompleted) {
          progressData.completedAt = new Date();
        }

        [result] = await db
          .insert(userModuleProgress)
          .values(progressData)
          .returning();

        console.log(
          `✅ Created new progress for user ${userId}, module ${moduleId}`
        );
      }

      // If module is completed, award XP
      if (data.isCompleted && !existingProgress?.isCompleted) {
        await this.awardModuleXP(userId, moduleId);
      }

      return result;
    } catch (error) {
      console.error("❌ Error updating module progress:", error);
      throw new Error(`Failed to update progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Award XP for completing a module
   */
  private static async awardModuleXP(
    userId: string,
    moduleId: string
  ): Promise<void> {
    try {
      // Get module to find XP reward
      const [module] = await db
        .select()
        .from(learningModules)
        .where(eq(learningModules.id, moduleId))
        .limit(1);

      if (!module || !module.xpReward) {
        console.log(`⚠️ No XP reward for module ${moduleId}`);
        return;
      }

      // Award XP to user
      await db
        .update(users)
        .set({
          xpPoints: sql`COALESCE(${users.xpPoints}, 0) + ${module.xpReward}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log(
        `✅ Awarded ${module.xpReward} XP to user ${userId} for completing module ${module.title}`
      );
    } catch (error) {
      console.error("❌ Error awarding module XP:", error);
      // Don't throw - XP award failure shouldn't block progress update
    }
  }

  /**
   * Get completion statistics for a user
   */
  static async getCompletionStats(userId: string): Promise<{
    totalModules: number;
    completedModules: number;
    completionPercentage: number;
    totalTimeSpent: number;
    averageScore: number;
  }> {
    try {
      // Get total active modules count
      const totalModules = await db
        .select({ count: sql<number>`count(*)` })
        .from(learningModules)
        .where(eq(learningModules.isActive, true))
        .then((result) => Number(result[0]?.count || 0));

      // Get user's completed modules
      const userProgress = await this.getUserProgress(userId);
      const completedModules = userProgress.filter((p) => p.isCompleted).length;
      const totalTimeSpent = userProgress.reduce(
        (sum, p) => sum + (p.timeSpentMinutes || 0),
        0
      );

      // Calculate average score (only for scored modules)
      const scoredModules = userProgress.filter((p) => p.score !== null);
      const averageScore =
        scoredModules.length > 0
          ? scoredModules.reduce((sum, p) => sum + (p.score || 0), 0) /
            scoredModules.length
          : 0;

      const completionPercentage =
        totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

      console.log(
        `✅ Completion stats for user ${userId}: ${completedModules}/${totalModules} (${completionPercentage.toFixed(1)}%)`
      );

      return {
        totalModules,
        completedModules,
        completionPercentage: Math.round(completionPercentage * 10) / 10,
        totalTimeSpent,
        averageScore: Math.round(averageScore * 10) / 10,
      };
    } catch (error) {
      console.error("❌ Error getting completion stats:", error);
      throw new Error(`Failed to get completion stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
