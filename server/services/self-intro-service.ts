import { db } from "../db";
import {
  selfIntroDrafts,
  selfIntros,
  type SelfIntroDraft,
  type SelfIntro,
  type InsertSelfIntroDraft,
  type InsertSelfIntro,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { OpenAIService } from "./openai-service";

/**
 * Self Introduction Service
 *
 * Handles all self-introduction operations including:
 * - Draft management (6-step wizard)
 * - AI-powered feedback and scoring
 * - Finalized self-introduction scripts
 * - Version management
 */
export class SelfIntroService {
  private openAIService: OpenAIService;

  constructor() {
    this.openAIService = new OpenAIService();
  }

  /**
   * Save or update a draft for a specific step
   */
  async saveDraft(
    userId: string,
    stepNumber: number,
    stepData: any
  ): Promise<SelfIntroDraft> {
    try {
      if (stepNumber < 1 || stepNumber > 6) {
        throw new Error("Step number must be between 1 and 6");
      }

      // Check if draft exists for this step
      const [existingDraft] = await db
        .select()
        .from(selfIntroDrafts)
        .where(
          and(
            eq(selfIntroDrafts.userId, userId),
            eq(selfIntroDrafts.stepNumber, stepNumber)
          )
        )
        .limit(1);

      let result: SelfIntroDraft;

      if (existingDraft) {
        // Update existing draft
        [result] = await db
          .update(selfIntroDrafts)
          .set({
            stepData,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(selfIntroDrafts.userId, userId),
              eq(selfIntroDrafts.stepNumber, stepNumber)
            )
          )
          .returning();

        console.log(
          `✅ Updated draft step ${stepNumber} for user ${userId}`
        );
      } else {
        // Create new draft
        const draftData: InsertSelfIntroDraft = {
          userId,
          stepNumber,
          stepData,
        };

        [result] = await db
          .insert(selfIntroDrafts)
          .values(draftData)
          .returning();

        console.log(
          `✅ Created draft step ${stepNumber} for user ${userId}`
        );
      }

      return result;
    } catch (error) {
      console.error("❌ Error saving self-intro draft:", error);
      throw new Error(`Failed to save draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all draft steps for a user
   */
  async getDrafts(userId: string): Promise<SelfIntroDraft[]> {
    try {
      const drafts = await db
        .select()
        .from(selfIntroDrafts)
        .where(eq(selfIntroDrafts.userId, userId))
        .orderBy(selfIntroDrafts.stepNumber);

      console.log(
        `✅ Retrieved ${drafts.length} draft steps for user ${userId}`
      );
      return drafts;
    } catch (error) {
      console.error("❌ Error retrieving self-intro drafts:", error);
      throw new Error(`Failed to retrieve drafts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get draft for a specific step
   */
  async getDraftByStep(
    userId: string,
    stepNumber: number
  ): Promise<SelfIntroDraft | null> {
    try {
      const [draft] = await db
        .select()
        .from(selfIntroDrafts)
        .where(
          and(
            eq(selfIntroDrafts.userId, userId),
            eq(selfIntroDrafts.stepNumber, stepNumber)
          )
        )
        .limit(1);

      return draft || null;
    } catch (error) {
      console.error("❌ Error retrieving draft step:", error);
      throw new Error(`Failed to retrieve draft step: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate AI feedback for a self-introduction script
   */
  async generateFeedback(script: string): Promise<{
    structureScore: number;
    clarityScore: number;
    impactScore: number;
    overallScore: number;
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  }> {
    try {
      const prompt = `Evaluate this self-introduction script for a job interview. Provide structured feedback.

Self-Introduction Script:
"""
${script}
"""

Evaluate on:
1. Structure (0-100): Opening, body, closing organization
2. Clarity (0-100): Clear communication, conciseness
3. Impact (0-100): Memorable, professional, engaging

Respond with ONLY a JSON object in this exact format:
{
  "structureScore": <number 0-100>,
  "clarityScore": <number 0-100>,
  "impactScore": <number 0-100>,
  "overallScore": <number 0-100>,
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2"],
  "suggestions": ["suggestion1", "suggestion2"]
}`;

      const response = await this.openAIService.generateResponse({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        maxTokens: 1500,
        temperature: 0.7,
      });

      // Parse AI response
      const feedbackText = response.trim() || "{}";

      // Extract JSON from potential markdown code blocks
      const jsonMatch = feedbackText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : feedbackText;

      const feedback = JSON.parse(jsonText);

      console.log(
        `✅ Generated AI feedback with overall score: ${feedback.overallScore}`
      );

      return feedback;
    } catch (error) {
      console.error("❌ Error generating AI feedback:", error);
      // Return default feedback on error
      return {
        structureScore: 50,
        clarityScore: 50,
        impactScore: 50,
        overallScore: 50,
        strengths: ["Self-introduction provided"],
        improvements: ["Consider refining your introduction"],
        suggestions: ["Review examples of strong self-introductions"],
      };
    }
  }

  /**
   * Finalize self-introduction with AI assessment
   */
  async finalizeIntro(
    userId: string,
    script: string,
    videoUrl?: string,
    videoDuration?: number
  ): Promise<SelfIntro> {
    try {
      // Generate AI feedback
      const feedback = await this.generateFeedback(script);

      // Deactivate previous active intros
      await db
        .update(selfIntros)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(selfIntros.userId, userId),
            eq(selfIntros.isActive, true)
          )
        );

      // Get next version number
      const previousIntros = await db
        .select()
        .from(selfIntros)
        .where(eq(selfIntros.userId, userId))
        .orderBy(desc(selfIntros.version))
        .limit(1);

      const nextVersion = previousIntros.length > 0
        ? (previousIntros[0].version || 1) + 1
        : 1;

      // Create finalized self-intro
      const introData: InsertSelfIntro = {
        userId,
        version: nextVersion,
        script,
        videoUrl,
        videoDurationSeconds: videoDuration,
        aiFeedback: feedback,
        overallScore: feedback.overallScore,
        isActive: true,
      };

      const [result] = await db
        .insert(selfIntros)
        .values(introData)
        .returning();

      console.log(
        `✅ Finalized self-intro v${nextVersion} for user ${userId} (score: ${feedback.overallScore})`
      );

      return result;
    } catch (error) {
      console.error("❌ Error finalizing self-intro:", error);
      throw new Error(`Failed to finalize intro: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get active self-introduction for a user
   */
  async getActiveIntro(userId: string): Promise<SelfIntro | null> {
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

      return intro || null;
    } catch (error) {
      console.error("❌ Error retrieving active self-intro:", error);
      throw new Error(`Failed to retrieve active intro: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all self-introduction versions for a user
   */
  async getAllVersions(userId: string): Promise<SelfIntro[]> {
    try {
      const intros = await db
        .select()
        .from(selfIntros)
        .where(eq(selfIntros.userId, userId))
        .orderBy(desc(selfIntros.version));

      console.log(
        `✅ Retrieved ${intros.length} self-intro version(s) for user ${userId}`
      );
      return intros;
    } catch (error) {
      console.error("❌ Error retrieving self-intro versions:", error);
      throw new Error(`Failed to retrieve versions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete draft steps (clear wizard progress)
   */
  async clearDrafts(userId: string): Promise<void> {
    try {
      await db
        .delete(selfIntroDrafts)
        .where(eq(selfIntroDrafts.userId, userId));

      console.log(`✅ Cleared all draft steps for user ${userId}`);
    } catch (error) {
      console.error("❌ Error clearing drafts:", error);
      throw new Error(`Failed to clear drafts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
