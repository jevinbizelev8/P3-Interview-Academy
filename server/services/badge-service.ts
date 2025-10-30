import { db } from "../db";
import {
  badges,
  userBadges,
  type Badge,
  type UserBadge,
} from "@shared/schema";
import { eq, and, desc, isNotNull } from "drizzle-orm";

/**
 * Badge Service
 *
 * Handles badge management operations including:
 * - Listing all available badges
 * - Getting user's badge collection
 * - Tracking badge progress
 * - Badge metadata management
 */
export class BadgeService {
  /**
   * Get all active badges
   */
  static async getAllBadges(category?: string): Promise<Badge[]> {
    try {
      const conditions = [eq(badges.isActive, true)];

      if (category) {
        conditions.push(eq(badges.category, category));
      }

      const allBadges = await db
        .select()
        .from(badges)
        .where(and(...conditions))
        .orderBy(badges.sortOrder, badges.category);

      console.log(
        `✅ Retrieved ${allBadges.length} badge(s)${category ? ` in category: ${category}` : ''}`
      );
      return allBadges;
    } catch (error) {
      console.error("❌ Error getting badges:", error);
      throw new Error(`Failed to get badges: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's badges with progress
   * Returns all badges with user's progress and earned status
   */
  static async getUserBadges(
    userId: string,
    earnedOnly: boolean = false
  ): Promise<
    Array<
      Badge & {
        userBadge?: UserBadge;
        progress: number;
        isEarned: boolean;
        earnedDate: Date | null;
        progressPercentage: number;
      }
    >
  > {
    try {
      // Get all active badges
      const allBadges = await this.getAllBadges();

      // Get user's badge data
      const userBadgeData = await db
        .select()
        .from(userBadges)
        .where(eq(userBadges.userId, userId));

      // Create a map of badgeId to user badge data
      const userBadgeMap = new Map(
        userBadgeData.map((ub) => [ub.badgeId, ub])
      );

      // Combine badge data with user progress
      let enrichedBadges = allBadges.map((badge) => {
        const userBadge = userBadgeMap.get(badge.id);
        const progress = userBadge?.progress || 0;
        const isEarned = !!userBadge?.earnedDate;
        const progressPercentage = Math.min(
          100,
          Math.round((progress / badge.requirementValue) * 100)
        );

        return {
          ...badge,
          userBadge,
          progress,
          isEarned,
          earnedDate: userBadge?.earnedDate || null,
          progressPercentage,
        };
      });

      // Filter to earned only if requested
      if (earnedOnly) {
        enrichedBadges = enrichedBadges.filter((b) => b.isEarned);
      }

      console.log(
        `✅ Retrieved ${enrichedBadges.length} badge(s) for user ${userId}${earnedOnly ? ' (earned only)' : ''}`
      );
      return enrichedBadges;
    } catch (error) {
      console.error("❌ Error getting user badges:", error);
      throw new Error(`Failed to get user badges: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's earned badges count by category
   */
  static async getUserBadgeStats(userId: string): Promise<{
    totalEarned: number;
    totalAvailable: number;
    byCategory: Record<
      string,
      { earned: number; available: number; percentage: number }
    >;
    completionPercentage: number;
  }> {
    try {
      const userBadgesWithProgress = await this.getUserBadges(userId, false);

      const totalAvailable = userBadgesWithProgress.length;
      const totalEarned = userBadgesWithProgress.filter((b) => b.isEarned).length;

      // Group by category
      const byCategory: Record<
        string,
        { earned: number; available: number; percentage: number }
      > = {};

      userBadgesWithProgress.forEach((badge) => {
        if (!byCategory[badge.category]) {
          byCategory[badge.category] = {
            earned: 0,
            available: 0,
            percentage: 0,
          };
        }

        byCategory[badge.category].available += 1;
        if (badge.isEarned) {
          byCategory[badge.category].earned += 1;
        }
      });

      // Calculate percentages
      Object.keys(byCategory).forEach((category) => {
        const stats = byCategory[category];
        stats.percentage =
          stats.available > 0
            ? Math.round((stats.earned / stats.available) * 100)
            : 0;
      });

      const completionPercentage =
        totalAvailable > 0
          ? Math.round((totalEarned / totalAvailable) * 100)
          : 0;

      console.log(
        `✅ Badge stats for user ${userId}: ${totalEarned}/${totalAvailable} (${completionPercentage}%)`
      );

      return {
        totalEarned,
        totalAvailable,
        byCategory,
        completionPercentage,
      };
    } catch (error) {
      console.error("❌ Error getting user badge stats:", error);
      throw new Error(`Failed to get user badge stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get recently earned badges for a user
   */
  static async getRecentlyEarnedBadges(
    userId: string,
    limit: number = 5
  ): Promise<
    Array<
      Badge & {
        earnedDate: Date;
      }
    >
  > {
    try {
      const recentBadges = await db
        .select({
          badge: badges,
          earnedDate: userBadges.earnedDate,
        })
        .from(userBadges)
        .innerJoin(badges, eq(userBadges.badgeId, badges.id))
        .where(
          and(
            eq(userBadges.userId, userId),
            isNotNull(userBadges.earnedDate)
          )
        )
        .orderBy(desc(userBadges.earnedDate))
        .limit(limit);

      const result = recentBadges.map((row) => ({
        ...row.badge,
        earnedDate: row.earnedDate!,
      }));

      console.log(
        `✅ Retrieved ${result.length} recently earned badge(s) for user ${userId}`
      );
      return result;
    } catch (error) {
      console.error("❌ Error getting recently earned badges:", error);
      throw new Error(`Failed to get recently earned badges: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if user has earned a specific badge
   */
  static async hasUserEarnedBadge(
    userId: string,
    badgeId: string
  ): Promise<boolean> {
    try {
      const [userBadge] = await db
        .select()
        .from(userBadges)
        .where(
          and(
            eq(userBadges.userId, userId),
            eq(userBadges.badgeId, badgeId),
            isNotNull(userBadges.earnedDate)
          )
        )
        .limit(1);

      return !!userBadge;
    } catch (error) {
      console.error("❌ Error checking badge:", error);
      return false;
    }
  }

  /**
   * Get badge by ID
   */
  static async getBadgeById(badgeId: string): Promise<Badge | null> {
    try {
      const [badge] = await db
        .select()
        .from(badges)
        .where(eq(badges.id, badgeId))
        .limit(1);

      return badge || null;
    } catch (error) {
      console.error("❌ Error getting badge by ID:", error);
      throw new Error(`Failed to get badge: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
