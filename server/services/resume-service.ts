import { db } from "../db";
import {
  resumes,
  resumeAnalysisHistory,
  jobDescriptions,
  type Resume,
  type ResumeAnalysisHistory,
  type InsertResume,
  type InsertResumeAnalysisHistory,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { OpenAIService } from "./openai-service";
import crypto from "crypto";

/**
 * Resume Service
 *
 * Handles all resume operations including:
 * - Resume upload and storage
 * - AI-powered resume analysis
 * - ATS scoring
 * - Job description matching
 * - Resume optimization suggestions
 */
export class ResumeService {
  private openAIService: OpenAIService;

  constructor() {
    this.openAIService = new OpenAIService();
  }

  /**
   * Upload and store a resume
   */
  async uploadResume(
    userId: string,
    filename: string,
    fileUrl: string,
    fileSizeBytes: number,
    parsedContent: string,
    jobDescriptionId?: string
  ): Promise<Resume> {
    try {
      // Deactivate previous active resumes
      await db
        .update(resumes)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(resumes.userId, userId),
            eq(resumes.isActive, true)
          )
        );

      // Create new resume entry
      const resumeData: InsertResume = {
        userId,
        filename,
        fileUrl,
        fileSizeBytes,
        parsedContent,
        jobDescriptionId,
        isActive: true,
      };

      const [result] = await db
        .insert(resumes)
        .values(resumeData)
        .returning();

      console.log(
        `✅ Uploaded resume for user ${userId}: ${filename} (${fileSizeBytes} bytes)`
      );

      return result;
    } catch (error) {
      console.error("❌ Error uploading resume:", error);
      throw new Error(`Failed to upload resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get active resume for a user
   */
  async getActiveResume(userId: string): Promise<Resume | null> {
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

      return resume || null;
    } catch (error) {
      console.error("❌ Error retrieving active resume:", error);
      throw new Error(`Failed to retrieve active resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get resume by ID
   */
  async getResumeById(resumeId: string): Promise<Resume | null> {
    try {
      const [resume] = await db
        .select()
        .from(resumes)
        .where(eq(resumes.id, resumeId))
        .limit(1);

      return resume || null;
    } catch (error) {
      console.error("❌ Error retrieving resume:", error);
      throw new Error(`Failed to retrieve resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze resume with AI (with optional job description)
   */
  async analyzeResume(
    resumeId: string,
    jobDescriptionText?: string
  ): Promise<{
    atsScore: number;
    jdMatchPercentage: number;
    strengths: string[];
    gaps: string[];
    keywords: string[];
    atsTips: string[];
    suggestions: string[];
  }> {
    try {
      // Get resume
      const resume = await this.getResumeById(resumeId);
      if (!resume) {
        throw new Error("Resume not found");
      }

      // Get job description if ID is provided
      let jdText = jobDescriptionText;
      if (!jdText && resume.jobDescriptionId) {
        const [jd] = await db
          .select()
          .from(jobDescriptions)
          .where(eq(jobDescriptions.id, resume.jobDescriptionId))
          .limit(1);

        if (jd) {
          jdText = jd.content || "";
        }
      }

      // Generate AI analysis
      const analysis = await this.generateAIAnalysis(
        resume.parsedContent || "",
        jdText
      );

      // Update resume with analysis results
      await db
        .update(resumes)
        .set({
          aiAnalysis: analysis,
          atsScore: analysis.atsScore,
          jdMatchPercentage: analysis.jdMatchPercentage,
          keywords: analysis.keywords,
          updatedAt: new Date(),
        })
        .where(eq(resumes.id, resumeId));

      // Save analysis to history
      await this.saveAnalysisHistory(
        resumeId,
        resume.userId,
        analysis,
        resume.jobDescriptionId || undefined
      );

      console.log(
        `✅ Analyzed resume ${resumeId}: ATS ${analysis.atsScore}/100, JD Match ${analysis.jdMatchPercentage}%`
      );

      return analysis;
    } catch (error) {
      console.error("❌ Error analyzing resume:", error);
      throw new Error(`Failed to analyze resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate AI-powered resume analysis
   */
  private async generateAIAnalysis(
    resumeContent: string,
    jobDescription?: string
  ): Promise<{
    atsScore: number;
    jdMatchPercentage: number;
    strengths: string[];
    gaps: string[];
    keywords: string[];
    atsTips: string[];
    suggestions: string[];
  }> {
    try {
      const prompt = `Analyze this resume${jobDescription ? ' against the job description' : ''} and provide structured feedback.

Resume Content:
"""
${resumeContent}
"""

${jobDescription ? `Job Description:\n"""\n${jobDescription}\n"""` : ''}

Provide:
1. ATS Score (0-100): How well the resume would pass Applicant Tracking Systems
2. ${jobDescription ? 'JD Match Percentage (0-100)' : 'Overall Optimization Score (0-100)'}: How well aligned it is
3. Strengths: What the resume does well (3-5 points)
4. Gaps: What's missing or weak ${jobDescription ? 'compared to JD requirements' : ''} (2-4 points)
5. Keywords: Important keywords ${jobDescription ? 'from the JD that should be included' : 'that should be added'} (5-10 keywords)
6. ATS Tips: Specific formatting/structure improvements (3-5 tips)
7. Suggestions: Content improvements (3-5 suggestions)

Respond with ONLY a JSON object in this exact format:
{
  "atsScore": <number 0-100>,
  "jdMatchPercentage": <number 0-100>,
  "strengths": ["strength1", "strength2", "strength3"],
  "gaps": ["gap1", "gap2"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "atsTips": ["tip1", "tip2", "tip3"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`;

      const response = await this.openAIService.generateResponse({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        maxTokens: 2000,
        temperature: 0.7,
      });

      // Parse AI response
      const analysisText = response.trim() || "{}";

      // Extract JSON from potential markdown code blocks
      const jsonMatch = analysisText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : analysisText;

      const analysis = JSON.parse(jsonText);

      console.log(
        `✅ Generated AI analysis: ATS ${analysis.atsScore}/100, Match ${analysis.jdMatchPercentage}%`
      );

      return analysis;
    } catch (error) {
      console.error("❌ Error generating AI analysis:", error);
      // Return default analysis on error
      return {
        atsScore: 60,
        jdMatchPercentage: 50,
        strengths: ["Resume content provided"],
        gaps: ["Consider adding more specific achievements"],
        keywords: ["skills", "experience", "achievements"],
        atsTips: ["Use standard section headings", "Include relevant keywords"],
        suggestions: ["Quantify achievements with metrics"],
      };
    }
  }

  /**
   * Save analysis to history for audit trail
   */
  private async saveAnalysisHistory(
    resumeId: string,
    userId: string,
    analysis: any,
    jobDescriptionId?: string
  ): Promise<void> {
    try {
      const modelVersion = "gpt-4-turbo-preview";
      const prompt = JSON.stringify({ resumeId, jobDescriptionId });
      const response = JSON.stringify(analysis);

      const promptHash = crypto.createHash("sha256").update(prompt).digest("hex");
      const responseHash = crypto.createHash("sha256").update(response).digest("hex");

      const historyData: InsertResumeAnalysisHistory = {
        resumeId,
        userId,
        score: analysis.atsScore,
        strengths: analysis.strengths,
        gaps: analysis.gaps,
        keywordsMatched: analysis.keywords,
        atsTips: analysis.atsTips,
        jobDescriptionId,
        modelVersion,
        promptHash,
        responseHash,
      };

      await db
        .insert(resumeAnalysisHistory)
        .values(historyData);

      console.log(`✅ Saved analysis history for resume ${resumeId}`);
    } catch (error) {
      console.error("❌ Error saving analysis history:", error);
      // Don't throw - history failure shouldn't block analysis
    }
  }

  /**
   * Get analysis history for a resume
   */
  async getAnalysisHistory(resumeId: string): Promise<ResumeAnalysisHistory[]> {
    try {
      const history = await db
        .select()
        .from(resumeAnalysisHistory)
        .where(eq(resumeAnalysisHistory.resumeId, resumeId))
        .orderBy(desc(resumeAnalysisHistory.createdAt));

      console.log(
        `✅ Retrieved ${history.length} analysis history record(s) for resume ${resumeId}`
      );
      return history;
    } catch (error) {
      console.error("❌ Error retrieving analysis history:", error);
      throw new Error(`Failed to retrieve analysis history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all resumes for a user
   */
  async getUserResumes(userId: string): Promise<Resume[]> {
    try {
      const userResumes = await db
        .select()
        .from(resumes)
        .where(eq(resumes.userId, userId))
        .orderBy(desc(resumes.createdAt));

      console.log(
        `✅ Retrieved ${userResumes.length} resume(s) for user ${userId}`
      );
      return userResumes;
    } catch (error) {
      console.error("❌ Error retrieving user resumes:", error);
      throw new Error(`Failed to retrieve user resumes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
