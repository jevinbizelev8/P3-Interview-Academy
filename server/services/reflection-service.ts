import { db } from "../db";
import {
  reflectionJournals,
  type ReflectionJournal,
  type InsertReflectionJournal,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Reflection Service
 *
 * Handles reflection journal operations including:
 * - Creating post-simulation reflections
 * - Retrieving user reflections
 * - Analyzing reflection patterns
 */
export class ReflectionService {
  /**
   * Create a new reflection journal entry
   */
  static async createReflection(
    userId: string,
    data: {
      practiceSessionId?: string;
      strengths: string;
      improvements: string;
      actionItems?: string;
      overallFeeling?: string;
      moodScore?: number;
      // New AI-powered reflection fields
      reflectionText?: string;
      aiSummary?: string;
      aiFollowUpQuestions?: string[];
      suggestedResources?: Array<{ title: string; description: string; link?: string }>;
    }
  ): Promise<ReflectionJournal> {
    try {
      const reflectionData: InsertReflectionJournal = {
        userId,
        practiceSessionId: data.practiceSessionId || null,
        strengths: data.strengths,
        improvements: data.improvements,
        actionItems: data.actionItems || null,
        overallFeeling: data.overallFeeling || null,
        moodScore: data.moodScore || null,
        reflectionText: data.reflectionText || null,
        aiSummary: data.aiSummary || null,
        aiFollowUpQuestions: data.aiFollowUpQuestions || null,
        suggestedResources: data.suggestedResources || null,
      };

      const [reflection] = await db
        .insert(reflectionJournals)
        .values(reflectionData)
        .returning();

      console.log(
        `✅ Created reflection journal for user ${userId}${data.practiceSessionId ? ` (session: ${data.practiceSessionId})` : ''}`
      );

      return reflection;
    } catch (error) {
      console.error("❌ Error creating reflection:", error);
      throw new Error(`Failed to create reflection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create an AI-powered reflection journal entry (for Base44 compatibility)
   */
  static async createAIReflection(
    userId: string,
    practiceSessionId: string,
    reflectionText: string,
    aiSummary: string,
    aiFollowUpQuestions: string[],
    suggestedResources: Array<{ title: string; description: string; link?: string }>
  ): Promise<ReflectionJournal> {
    try {
      const reflectionData: InsertReflectionJournal = {
        userId,
        practiceSessionId,
        // Map to legacy fields for backward compatibility
        strengths: aiSummary,
        improvements: aiFollowUpQuestions.join('; '),
        actionItems: suggestedResources.map(r => `${r.title}: ${r.description}`).join('; '),
        // New AI fields
        reflectionText,
        aiSummary,
        aiFollowUpQuestions,
        suggestedResources,
      };

      const [reflection] = await db
        .insert(reflectionJournals)
        .values(reflectionData)
        .returning();

      console.log(
        `✅ Created AI-powered reflection journal for user ${userId} (session: ${practiceSessionId})`
      );

      return reflection;
    } catch (error) {
      console.error("❌ Error creating AI reflection:", error);
      throw new Error(`Failed to create AI reflection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's reflection journals
   */
  static async getUserReflections(
    userId: string,
    practiceSessionId?: string
  ): Promise<ReflectionJournal[]> {
    try {
      const conditions = [eq(reflectionJournals.userId, userId)];

      if (practiceSessionId) {
        conditions.push(eq(reflectionJournals.practiceSessionId, practiceSessionId));
      }

      const reflections = await db
        .select()
        .from(reflectionJournals)
        .where(and(...conditions))
        .orderBy(desc(reflectionJournals.createdAt));

      console.log(
        `✅ Retrieved ${reflections.length} reflection(s) for user ${userId}`
      );
      return reflections;
    } catch (error) {
      console.error("❌ Error getting reflections:", error);
      throw new Error(`Failed to get reflections: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get reflection by ID
   */
  static async getReflectionById(
    reflectionId: string
  ): Promise<ReflectionJournal | null> {
    try {
      const [reflection] = await db
        .select()
        .from(reflectionJournals)
        .where(eq(reflectionJournals.id, reflectionId))
        .limit(1);

      return reflection || null;
    } catch (error) {
      console.error("❌ Error getting reflection by ID:", error);
      throw new Error(`Failed to get reflection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get reflection insights for a user
   */
  static async getReflectionInsights(userId: string): Promise<{
    totalReflections: number;
    averageMoodScore: number;
    commonStrengths: string[];
    commonImprovements: string[];
    reflectionFrequency: number; // reflections per week
  }> {
    try {
      const reflections = await this.getUserReflections(userId);

      const totalReflections = reflections.length;

      // Calculate average mood score
      const moodScores = reflections
        .filter((r) => r.moodScore !== null)
        .map((r) => r.moodScore!);

      const averageMoodScore =
        moodScores.length > 0
          ? moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length
          : 0;

      // Extract common keywords from strengths and improvements
      const strengthsText = reflections.map((r) => r.strengths).join(" ");
      const improvementsText = reflections.map((r) => r.improvements).join(" ");

      const commonStrengths = this.extractKeywords(strengthsText, 5);
      const commonImprovements = this.extractKeywords(improvementsText, 5);

      // Calculate reflection frequency (reflections per week)
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentReflections = reflections.filter(
        (r) => new Date(r.createdAt!) >= oneWeekAgo
      );
      const reflectionFrequency = recentReflections.length;

      console.log(
        `✅ Generated reflection insights for user ${userId}: ${totalReflections} total, ${reflectionFrequency}/week`
      );

      return {
        totalReflections,
        averageMoodScore: Math.round(averageMoodScore * 10) / 10,
        commonStrengths,
        commonImprovements,
        reflectionFrequency,
      };
    } catch (error) {
      console.error("❌ Error getting reflection insights:", error);
      throw new Error(`Failed to get reflection insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract common keywords from text
   */
  private static extractKeywords(text: string, limit: number): string[] {
    // Simple keyword extraction (word frequency)
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3); // Filter out short words

    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach((word) => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // Sort by frequency and return top N
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  }

  /**
   * Update reflection journal entry
   */
  static async updateReflection(
    reflectionId: string,
    userId: string,
    data: {
      strengths?: string;
      improvements?: string;
      actionItems?: string;
      overallFeeling?: string;
      moodScore?: number;
    }
  ): Promise<ReflectionJournal> {
    try {
      const updateData: Partial<InsertReflectionJournal> = {
      };

      if (data.strengths !== undefined) updateData.strengths = data.strengths;
      if (data.improvements !== undefined) updateData.improvements = data.improvements;
      if (data.actionItems !== undefined) updateData.actionItems = data.actionItems;
      if (data.overallFeeling !== undefined) updateData.overallFeeling = data.overallFeeling;
      if (data.moodScore !== undefined) updateData.moodScore = data.moodScore;

      const [reflection] = await db
        .update(reflectionJournals)
        .set(updateData)
        .where(
          and(
            eq(reflectionJournals.id, reflectionId),
            eq(reflectionJournals.userId, userId)
          )
        )
        .returning();

      if (!reflection) {
        throw new Error("Reflection not found or access denied");
      }

      console.log(`✅ Updated reflection ${reflectionId} for user ${userId}`);
      return reflection;
    } catch (error) {
      console.error("❌ Error updating reflection:", error);
      throw new Error(`Failed to update reflection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
