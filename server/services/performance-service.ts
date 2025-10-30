import { db } from "../db";
import {
  actualInterviews,
  type ActualInterview,
  type InsertActualInterview,
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * Performance Service
 *
 * Handles actual interview tracking including:
 * - Recording real interview experiences
 * - Tracking outcomes and confidence levels
 * - Managing follow-up dates
 * - Interview history and statistics
 */
export class PerformanceService {
  /**
   * Create a new actual interview record
   */
  static async createActualInterview(
    userId: string,
    data: {
      companyName: string;
      position: string;
      interviewDate: Date;
      interviewType?: string;
      outcome?: "offer" | "next_round" | "rejected" | "pending";
      confidenceLevel?: number;
      notes?: string;
      followUpDate?: Date;
    }
  ): Promise<ActualInterview> {
    try {
      const interviewData: InsertActualInterview = {
        userId,
        companyName: data.companyName,
        position: data.position,
        interviewDate: data.interviewDate,
        interviewType: data.interviewType || null,
        outcome: data.outcome || "pending",
        confidenceLevel: data.confidenceLevel || null,
        notes: data.notes || null,
        followUpDate: data.followUpDate || null,
      };

      const [interview] = await db
        .insert(actualInterviews)
        .values(interviewData)
        .returning();

      console.log(
        `✅ Created actual interview record for user ${userId} - ${data.companyName} (${data.position})`
      );

      return interview;
    } catch (error) {
      console.error("❌ Error creating actual interview:", error);
      throw new Error(`Failed to create actual interview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's actual interview records
   */
  static async getUserInterviews(userId: string): Promise<ActualInterview[]> {
    try {
      const interviews = await db
        .select()
        .from(actualInterviews)
        .where(eq(actualInterviews.userId, userId))
        .orderBy(desc(actualInterviews.interviewDate));

      console.log(
        `✅ Retrieved ${interviews.length} actual interview(s) for user ${userId}`
      );
      return interviews;
    } catch (error) {
      console.error("❌ Error getting actual interviews:", error);
      throw new Error(`Failed to get actual interviews: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get actual interview by ID
   */
  static async getInterviewById(
    interviewId: string,
    userId: string
  ): Promise<ActualInterview | null> {
    try {
      const [interview] = await db
        .select()
        .from(actualInterviews)
        .where(
          and(
            eq(actualInterviews.id, interviewId),
            eq(actualInterviews.userId, userId)
          )
        )
        .limit(1);

      return interview || null;
    } catch (error) {
      console.error("❌ Error getting actual interview by ID:", error);
      throw new Error(`Failed to get actual interview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update actual interview record
   */
  static async updateActualInterview(
    interviewId: string,
    userId: string,
    data: {
      companyName?: string;
      position?: string;
      interviewDate?: Date;
      interviewType?: string;
      outcome?: "offer" | "next_round" | "rejected" | "pending";
      confidenceLevel?: number;
      notes?: string;
      followUpDate?: Date;
    }
  ): Promise<ActualInterview> {
    try {
      const updateData: Partial<InsertActualInterview> = {
      };

      if (data.companyName !== undefined) updateData.companyName = data.companyName;
      if (data.position !== undefined) updateData.position = data.position;
      if (data.interviewDate !== undefined) updateData.interviewDate = data.interviewDate;
      if (data.interviewType !== undefined) updateData.interviewType = data.interviewType;
      if (data.outcome !== undefined) updateData.outcome = data.outcome;
      if (data.confidenceLevel !== undefined) updateData.confidenceLevel = data.confidenceLevel;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.followUpDate !== undefined) updateData.followUpDate = data.followUpDate;

      const [interview] = await db
        .update(actualInterviews)
        .set(updateData)
        .where(
          and(
            eq(actualInterviews.id, interviewId),
            eq(actualInterviews.userId, userId)
          )
        )
        .returning();

      if (!interview) {
        throw new Error("Interview not found or access denied");
      }

      console.log(
        `✅ Updated actual interview ${interviewId} for user ${userId}`
      );
      return interview;
    } catch (error) {
      console.error("❌ Error updating actual interview:", error);
      throw new Error(`Failed to update actual interview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get interview statistics for a user
   */
  static async getInterviewStats(userId: string): Promise<{
    totalInterviews: number;
    offerCount: number;
    nextRoundCount: number;
    rejectedCount: number;
    pendingCount: number;
    successRate: number;
    averageConfidence: number;
    recentInterviews: ActualInterview[];
    upcomingFollowUps: ActualInterview[];
  }> {
    try {
      const interviews = await this.getUserInterviews(userId);

      const totalInterviews = interviews.length;
      const offerCount = interviews.filter((i) => i.outcome === "offer").length;
      const nextRoundCount = interviews.filter((i) => i.outcome === "next_round").length;
      const rejectedCount = interviews.filter((i) => i.outcome === "rejected").length;
      const pendingCount = interviews.filter((i) => i.outcome === "pending").length;

      // Success rate = (offers + next rounds) / total interviews (excluding pending)
      const completedInterviews = totalInterviews - pendingCount;
      const successCount = offerCount + nextRoundCount;
      const successRate =
        completedInterviews > 0
          ? (successCount / completedInterviews) * 100
          : 0;

      // Average confidence level
      const confidenceScores = interviews
        .filter((i) => i.confidenceLevel !== null)
        .map((i) => i.confidenceLevel!);

      const averageConfidence =
        confidenceScores.length > 0
          ? confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length
          : 0;

      // Recent interviews (last 5)
      const recentInterviews = interviews.slice(0, 5);

      // Upcoming follow-ups (sorted by follow-up date)
      const now = new Date();
      const upcomingFollowUps = interviews
        .filter((i) => i.followUpDate && new Date(i.followUpDate) >= now)
        .sort((a, b) => {
          const dateA = a.followUpDate ? new Date(a.followUpDate).getTime() : 0;
          const dateB = b.followUpDate ? new Date(b.followUpDate).getTime() : 0;
          return dateA - dateB;
        })
        .slice(0, 5);

      console.log(
        `✅ Generated interview stats for user ${userId}: ${totalInterviews} total, ${successRate.toFixed(1)}% success rate`
      );

      return {
        totalInterviews,
        offerCount,
        nextRoundCount,
        rejectedCount,
        pendingCount,
        successRate: Math.round(successRate * 10) / 10,
        averageConfidence: Math.round(averageConfidence * 10) / 10,
        recentInterviews,
        upcomingFollowUps,
      };
    } catch (error) {
      console.error("❌ Error getting interview stats:", error);
      throw new Error(`Failed to get interview stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get interviews by outcome type
   */
  static async getInterviewsByOutcome(
    userId: string,
    outcome: "offer" | "next_round" | "rejected" | "pending"
  ): Promise<ActualInterview[]> {
    try {
      const interviews = await db
        .select()
        .from(actualInterviews)
        .where(
          and(
            eq(actualInterviews.userId, userId),
            eq(actualInterviews.outcome, outcome)
          )
        )
        .orderBy(desc(actualInterviews.interviewDate));

      console.log(
        `✅ Retrieved ${interviews.length} interview(s) with outcome '${outcome}' for user ${userId}`
      );
      return interviews;
    } catch (error) {
      console.error("❌ Error getting interviews by outcome:", error);
      throw new Error(`Failed to get interviews by outcome: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get interviews with upcoming follow-ups
   */
  static async getUpcomingFollowUps(userId: string): Promise<ActualInterview[]> {
    try {
      const now = new Date();
      const interviews = await db
        .select()
        .from(actualInterviews)
        .where(eq(actualInterviews.userId, userId))
        .orderBy(actualInterviews.followUpDate);

      const upcomingFollowUps = interviews.filter(
        (i) => i.followUpDate && new Date(i.followUpDate) >= now
      );

      console.log(
        `✅ Retrieved ${upcomingFollowUps.length} upcoming follow-up(s) for user ${userId}`
      );
      return upcomingFollowUps;
    } catch (error) {
      console.error("❌ Error getting upcoming follow-ups:", error);
      throw new Error(`Failed to get upcoming follow-ups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete actual interview record
   */
  static async deleteActualInterview(
    interviewId: string,
    userId: string
  ): Promise<void> {
    try {
      const result = await db
        .delete(actualInterviews)
        .where(
          and(
            eq(actualInterviews.id, interviewId),
            eq(actualInterviews.userId, userId)
          )
        )
        .returning();

      if (result.length === 0) {
        throw new Error("Interview not found or access denied");
      }

      console.log(
        `✅ Deleted actual interview ${interviewId} for user ${userId}`
      );
    } catch (error) {
      console.error("❌ Error deleting actual interview:", error);
      throw new Error(`Failed to delete actual interview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get interview timeline (grouped by month)
   */
  static async getInterviewTimeline(
    userId: string
  ): Promise<Array<{
    month: string;
    year: number;
    totalInterviews: number;
    offers: number;
    nextRounds: number;
    rejected: number;
    pending: number;
  }>> {
    try {
      const interviews = await this.getUserInterviews(userId);

      // Group by month
      const timelineMap = new Map<string, {
        month: string;
        year: number;
        totalInterviews: number;
        offers: number;
        nextRounds: number;
        rejected: number;
        pending: number;
      }>();

      interviews.forEach((interview) => {
        const date = new Date(interview.interviewDate);
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        const key = `${year}-${month}`;

        if (!timelineMap.has(key)) {
          timelineMap.set(key, {
            month,
            year,
            totalInterviews: 0,
            offers: 0,
            nextRounds: 0,
            rejected: 0,
            pending: 0,
          });
        }

        const timeline = timelineMap.get(key)!;
        timeline.totalInterviews += 1;

        if (interview.outcome === "offer") timeline.offers += 1;
        else if (interview.outcome === "next_round") timeline.nextRounds += 1;
        else if (interview.outcome === "rejected") timeline.rejected += 1;
        else if (interview.outcome === "pending") timeline.pending += 1;
      });

      // Convert to array and sort by date (newest first)
      const result = Array.from(timelineMap.values()).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        const monthA = new Date(`${a.month} 1, ${a.year}`).getMonth();
        const monthB = new Date(`${b.month} 1, ${b.year}`).getMonth();
        return monthB - monthA;
      });

      console.log(
        `✅ Generated interview timeline for user ${userId}: ${result.length} month(s)`
      );
      return result;
    } catch (error) {
      console.error("❌ Error getting interview timeline:", error);
      throw new Error(`Failed to get interview timeline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
