import { db } from "../db";
import {
  users,
  badges,
  userBadges,
  type User,
  type Badge,
  type UserBadge,
  type InsertUserBadge,
} from "@shared/schema";
import { eq, and, desc, sql, isNull, isNotNull } from "drizzle-orm";

/**
 * Gamification Service
 *
 * Handles all gamification operations including:
 * - XP points distribution and tracking
 * - Badge awarding and progress tracking
 * - Streak management (current and longest)
 * - Leaderboard generation
 */
export class GamificationService {
  /**
   * Add XP points to a user
   */
  static async addPoints(
    userId: string,
    points: number,
    source: string,
    description?: string
  ): Promise<{
    newTotal: number;
    pointsAdded: number;
    leveledUp: boolean;
    newLevel?: number;
  }> {
    try {
      if (points <= 0) {
        throw new Error("Points must be greater than 0");
      }

      // Get current XP
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error("User not found");
      }

      const currentXP = user.xpPoints || 0;
      const newTotal = currentXP + points;

      // Calculate levels (simple formula: level = floor(sqrt(xp / 100)))
      const oldLevel = Math.floor(Math.sqrt(currentXP / 100));
      const newLevel = Math.floor(Math.sqrt(newTotal / 100));
      const leveledUp = newLevel > oldLevel;

      // Update user XP
      await db
        .update(users)
        .set({
          xpPoints: newTotal,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log(
        `✅ Added ${points} XP to user ${userId} (${currentXP} → ${newTotal}) [${source}]`
      );

      if (leveledUp) {
        console.log(`🎉 User ${userId} leveled up to level ${newLevel}!`);
      }

      return {
        newTotal,
        pointsAdded: points,
        leveledUp,
        newLevel: leveledUp ? newLevel : undefined,
      };
    } catch (error) {
      console.error("❌ Error adding points:", error);
      throw new Error(`Failed to add points: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's current XP points and level
   */
  static async getPoints(userId: string): Promise<{
    totalPoints: number;
    currentLevel: number;
    pointsToNextLevel: number;
  }> {
    try {
      const [user] = await db
        .select({ xpPoints: users.xpPoints })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const totalPoints = user?.xpPoints || 0;
      const currentLevel = Math.floor(Math.sqrt(totalPoints / 100));
      const nextLevel = currentLevel + 1;
      const pointsNeededForNextLevel = nextLevel * nextLevel * 100;
      const pointsToNextLevel = pointsNeededForNextLevel - totalPoints;

      return {
        totalPoints,
        currentLevel,
        pointsToNextLevel: Math.max(0, pointsToNextLevel),
      };
    } catch (error) {
      console.error("❌ Error getting points:", error);
      throw new Error(`Failed to get points: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Award a badge to a user
   * Handles progress tracking and duplicate prevention
   */
  static async awardBadge(
    userId: string,
    badgeId: string,
    progress?: number
  ): Promise<{
    awarded: boolean;
    userBadge: UserBadge;
    xpAwarded: number;
  }> {
    try {
      // Get badge details
      const [badge] = await db
        .select()
        .from(badges)
        .where(eq(badges.id, badgeId))
        .limit(1);

      if (!badge) {
        throw new Error("Badge not found");
      }

      if (!badge.isActive) {
        throw new Error("Badge is not active");
      }

      // Check if user already has this badge
      const [existingBadge] = await db
        .select()
        .from(userBadges)
        .where(
          and(
            eq(userBadges.userId, userId),
            eq(userBadges.badgeId, badgeId)
          )
        )
        .limit(1);

      let userBadge: UserBadge;
      let awarded = false;
      let xpAwarded = 0;

      if (existingBadge) {
        // Update progress if not already earned
        if (!existingBadge.earnedDate) {
          const newProgress = progress !== undefined ? progress : existingBadge.progress + 1;
          const shouldAward = newProgress >= badge.requirementValue;

          const updateData: Partial<InsertUserBadge> = {
            progress: newProgress,
          };

          if (shouldAward) {
            updateData.earnedDate = new Date();
            awarded = true;
          }

          [userBadge] = await db
            .update(userBadges)
            .set(updateData)
            .where(eq(userBadges.id, existingBadge.id))
            .returning();

          if (awarded) {
            // Award XP for earning the badge
            xpAwarded = badge.xpReward || 0;
            if (xpAwarded > 0) {
              await this.addPoints(
                userId,
                xpAwarded,
                "badge_earned",
                `Earned badge: ${badge.name}`
              );
            }
            console.log(`🏆 User ${userId} earned badge: ${badge.name}`);
          }
        } else {
          userBadge = existingBadge;
          console.log(`⚠️ User ${userId} already has badge: ${badge.name}`);
        }
      } else {
        // Create new badge entry
        const initialProgress = progress !== undefined ? progress : 1;
        const shouldAward = initialProgress >= badge.requirementValue;

        const badgeData: InsertUserBadge = {
          userId,
          badgeId,
          progress: initialProgress,
          earnedDate: shouldAward ? new Date() : null,
        };

        [userBadge] = await db
          .insert(userBadges)
          .values(badgeData)
          .returning();

        if (shouldAward) {
          awarded = true;
          xpAwarded = badge.xpReward || 0;
          if (xpAwarded > 0) {
            await this.addPoints(
              userId,
              xpAwarded,
              "badge_earned",
              `Earned badge: ${badge.name}`
            );
          }
          console.log(`🏆 User ${userId} earned badge: ${badge.name}`);
        }
      }

      return {
        awarded,
        userBadge: userBadge!,
        xpAwarded,
      };
    } catch (error) {
      console.error("❌ Error awarding badge:", error);
      throw new Error(`Failed to award badge: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user's activity streak
   */
  static async updateStreak(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    streakContinued: boolean;
    streakBroken: boolean;
  }> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error("User not found");
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastActivity = user.lastActivityDate
        ? new Date(user.lastActivityDate)
        : null;

      let currentStreak = user.currentStreak || 0;
      let longestStreak = user.longestStreak || 0;
      let streakContinued = false;
      let streakBroken = false;

      if (lastActivity) {
        const lastActivityDate = new Date(
          lastActivity.getFullYear(),
          lastActivity.getMonth(),
          lastActivity.getDate()
        );

        const daysDiff = Math.floor(
          (today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 0) {
          // Same day - no streak change
          streakContinued = false;
        } else if (daysDiff === 1) {
          // Consecutive day - continue streak
          currentStreak += 1;
          streakContinued = true;
        } else {
          // Streak broken - reset to 1
          currentStreak = 1;
          streakBroken = true;
        }
      } else {
        // First activity ever
        currentStreak = 1;
      }

      // Update longest streak if current is higher
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      // Update user
      await db
        .update(users)
        .set({
          currentStreak,
          longestStreak,
          lastActivityDate: now,
          updatedAt: now,
        })
        .where(eq(users.id, userId));

      // Award streak bonus XP
      if (streakContinued) {
        const bonusXP = Math.min(currentStreak * 5, 50); // 5 XP per day, max 50
        await this.addPoints(
          userId,
          bonusXP,
          "daily_streak",
          `${currentStreak}-day streak bonus`
        );
      }

      console.log(
        `✅ Updated streak for user ${userId}: ${currentStreak} days (longest: ${longestStreak})`
      );

      return {
        currentStreak,
        longestStreak,
        streakContinued,
        streakBroken,
      };
    } catch (error) {
      console.error("❌ Error updating streak:", error);
      throw new Error(`Failed to update streak: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's current streak information
   */
  static async getStreak(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date | null;
  }> {
    try {
      const [user] = await db
        .select({
          currentStreak: users.currentStreak,
          longestStreak: users.longestStreak,
          lastActivityDate: users.lastActivityDate,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return {
        currentStreak: user?.currentStreak || 0,
        longestStreak: user?.longestStreak || 0,
        lastActivityDate: user?.lastActivityDate || null,
      };
    } catch (error) {
      console.error("❌ Error getting streak:", error);
      throw new Error(`Failed to get streak: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get leaderboard (top users by XP)
   */
  static async getLeaderboard(limit: number = 10): Promise<
    Array<{
      userId: string;
      firstName: string | null;
      lastName: string | null;
      xpPoints: number;
      currentStreak: number;
      badgeCount: number;
      rank: number;
    }>
  > {
    try {
      // Get top users by XP
      const topUsers = await db
        .select({
          userId: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          xpPoints: users.xpPoints,
          currentStreak: users.currentStreak,
        })
        .from(users)
        .orderBy(desc(users.xpPoints))
        .limit(limit);

      // Get badge counts for each user
      const leaderboard = await Promise.all(
        topUsers.map(async (user, index) => {
          const badgeCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(userBadges)
            .where(
              and(
                eq(userBadges.userId, user.userId),
                isNotNull(userBadges.earnedDate)
              )
            )
            .then((result) => Number(result[0]?.count || 0));

          return {
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            xpPoints: user.xpPoints || 0,
            currentStreak: user.currentStreak || 0,
            badgeCount,
            rank: index + 1,
          };
        })
      );

      console.log(`✅ Generated leaderboard with ${leaderboard.length} users`);
      return leaderboard;
    } catch (error) {
      console.error("❌ Error getting leaderboard:", error);
      throw new Error(`Failed to get leaderboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
