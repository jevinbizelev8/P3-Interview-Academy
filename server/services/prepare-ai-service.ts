// AI-Powered Interview Preparation Service
// Main orchestration service for AI-driven interview preparation sessions

import { db } from "../db.js";
import { 
  aiPrepareSessions, 
  aiPrepareQuestions, 
  aiPrepareResponses,
  type InsertAiPrepareSession,
  type AiPrepareSession,
  type InsertAiPrepareQuestion,
  type AiPrepareQuestion,
  type InsertAiPrepareResponse,
  type AiPrepareResponse
} from "../../shared/schema.js";
import { eq, desc } from "drizzle-orm";
import { AIQuestionGenerator } from "./ai-question-generator.js";
import { ResponseEvaluationService } from "./response-evaluation-service.js";

interface SessionConfiguration {
  jobPosition: string;
  companyName?: string;
  interviewStage: string;
  experienceLevel: string;
  preferredLanguage?: string;
  voiceEnabled?: boolean;
  speechRate?: string;
  difficultyLevel?: string;
  focusAreas?: string[];
  questionCategories?: string[];
}

interface SessionProgress {
  totalQuestions: number;
  questionsAnswered: number;
  currentQuestionNumber: number;
  progressPercentage: number;
  averageStarScore: number;
  timeSpent: number;
}

interface QuestionRequest {
  sessionId: string;
  userId: string;
  previousResponses?: AiPrepareResponse[];
  adaptiveDifficulty?: boolean;
}

export class PrepareAIService {
  private questionGenerator: AIQuestionGenerator;
  private evaluationService: ResponseEvaluationService;

  constructor() {
    this.questionGenerator = new AIQuestionGenerator();
    this.evaluationService = new ResponseEvaluationService();
  }

  /**
   * Create a new AI preparation session
   */
  async createSession(
    userId: string, 
    config: SessionConfiguration
  ): Promise<AiPrepareSession> {
    try {
      const sessionData: InsertAiPrepareSession = {
        userId,
        jobPosition: config.jobPosition,
        companyName: config.companyName,
        interviewStage: config.interviewStage,
        experienceLevel: config.experienceLevel,
        preferredLanguage: config.preferredLanguage || "en",
        voiceEnabled: config.voiceEnabled ?? true,
        speechRate: config.speechRate || "1.0",
        difficultyLevel: config.difficultyLevel || "adaptive",
        focusAreas: config.focusAreas || ["behavioral", "situational"],
        questionCategories: config.questionCategories || ["general"]
      };

      const [session] = await db.insert(aiPrepareSessions)
        .values(sessionData)
        .returning();

      console.log(`✅ AI Prepare Session created: ${session.id}`);
      return session;

    } catch (error) {
      console.error("❌ Error creating AI prepare session:", error);
      throw new Error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get session with full details including questions and responses
   */
  async getSession(sessionId: string): Promise<any> {
    try {
      const session = await db.query.aiPrepareSessions.findFirst({
        where: eq(aiPrepareSessions.id, sessionId),
        with: {
          questions: {
            orderBy: [desc(aiPrepareQuestions.createdAt)],
            with: {
              responses: {
                orderBy: [desc(aiPrepareResponses.createdAt)]
              }
            }
          },
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      return session;

    } catch (error) {
      console.error("❌ Error retrieving session:", error);
      throw new Error(`Failed to get session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's session history with pagination
   */
  async getUserSessions(
    userId: string, 
    limit: number = 10, 
    offset: number = 0
  ): Promise<AiPrepareSession[]> {
    try {
      const sessions = await db.query.aiPrepareSessions.findMany({
        where: eq(aiPrepareSessions.userId, userId),
        orderBy: [desc(aiPrepareSessions.createdAt)],
        limit,
        offset,
        with: {
          questions: {
            columns: { id: true }
          },
          responses: {
            columns: { id: true }
          }
        }
      });

      return sessions;

    } catch (error) {
      console.error("❌ Error retrieving user sessions:", error);
      throw new Error(`Failed to get user sessions: ${error.message}`);
    }
  }

  /**
   * Generate next question for session
   */
  async generateNextQuestion(request: QuestionRequest): Promise<AiPrepareQuestion> {
    try {
      const session = await this.getSession(request.sessionId);
      if (!session) {
        throw new Error(`Session not found: ${request.sessionId}`);
      }

      const currentQuestionNumber = session.questions.length + 1;
      
      // Generate question using AI Question Generator
      const questionData = await this.questionGenerator.generateQuestion({
        jobPosition: session.jobPosition,
        companyName: session.companyName,
        interviewStage: session.interviewStage,
        experienceLevel: session.experienceLevel,
        preferredLanguage: session.preferredLanguage,
        difficultyLevel: session.difficultyLevel,
        focusAreas: session.focusAreas,
        questionCategories: session.questionCategories,
        questionNumber: currentQuestionNumber,
        previousResponses: request.previousResponses,
        adaptiveDifficulty: request.adaptiveDifficulty
      });

      // Insert question into database
      const [question] = await db.insert(aiPrepareQuestions)
        .values({
          sessionId: request.sessionId,
          questionText: questionData.questionText,
          questionTextTranslated: questionData.questionTextTranslated,
          questionCategory: questionData.questionCategory,
          questionType: questionData.questionType,
          difficultyLevel: questionData.difficultyLevel,
          expectedAnswerTime: questionData.expectedAnswerTime,
          culturalContext: questionData.culturalContext,
          questionNumber: currentQuestionNumber,
          starMethodRelevant: questionData.starMethodRelevant,
          generatedBy: questionData.generatedBy
        })
        .returning();

      console.log(`✅ Question generated for session ${request.sessionId}: ${question.id}`);
      return question;

    } catch (error) {
      console.error("❌ Error generating question:", error);
      throw new Error(`Failed to generate question: ${error.message}`);
    }
  }

  /**
   * Process user response and get AI evaluation
   */
  async processResponse(
    sessionId: string,
    questionId: string,
    responseText: string,
    responseData: {
      responseLanguage?: string;
      inputMethod?: 'voice' | 'text';
      audioDuration?: number;
      transcriptionConfidence?: string;
    }
  ): Promise<AiPrepareResponse> {
    try {
      const session = await this.getSession(sessionId);
      const question = session.questions.find((q: any) => q.id === questionId);
      
      if (!question) {
        throw new Error(`Question not found: ${questionId}`);
      }

      const startTime = Date.now();
      
      // Get AI evaluation
      const evaluation = await this.evaluationService.evaluateResponse({
        questionText: question.questionText,
        questionCategory: question.questionCategory,
        questionType: question.questionType,
        responseText,
        responseLanguage: responseData.responseLanguage || session.preferredLanguage,
        culturalContext: question.culturalContext,
        jobPosition: session.jobPosition,
        experienceLevel: session.experienceLevel,
        starMethodRelevant: question.starMethodRelevant
      });

      const evaluationTime = Date.now() - startTime;
      const wordCount = responseText.split(/\s+/).length;

      // Insert response with evaluation
      const [response] = await db.insert(aiPrepareResponses)
        .values({
          sessionId,
          questionId,
          responseText,
          responseLanguage: responseData.responseLanguage || session.preferredLanguage,
          inputMethod: responseData.inputMethod || 'text',
          audioDuration: responseData.audioDuration,
          transcriptionConfidence: responseData.transcriptionConfidence,
          starScores: evaluation.starScores,
          detailedFeedback: evaluation.detailedFeedback,
          modelAnswer: evaluation.modelAnswer,
          relevanceScore: evaluation.relevanceScore.toString(),
          communicationScore: evaluation.communicationScore.toString(),
          completenessScore: evaluation.completenessScore.toString(),
          timeTaken: Math.floor(evaluationTime / 1000),
          wordCount,
          evaluatedBy: evaluation.evaluatedBy
        })
        .returning();

      // Update session progress
      await this.updateSessionProgress(sessionId);

      console.log(`✅ Response processed for session ${sessionId}: ${response.id}`);
      return response;

    } catch (error) {
      console.error("❌ Error processing response:", error);
      throw new Error(`Failed to process response: ${error.message}`);
    }
  }

  /**
   * Update session progress metrics
   */
  async updateSessionProgress(sessionId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      const responses = session.questions.flatMap((q: any) => q.responses);
      
      if (responses.length === 0) return;

      // Calculate metrics
      const questionsAnswered = responses.length;
      const totalTimeSpent = responses.reduce((sum: number, r: any) => sum + (r.timeTaken || 0), 0);
      
      // Calculate average STAR score
      const starScores = responses.map((r: any) => r.starScores?.overall || 0);
      const averageStarScore = starScores.reduce((sum, score) => sum + score, 0) / starScores.length;
      
      // Calculate progress percentage (assuming 20 questions target)
      const progressPercentage = Math.min((questionsAnswered / 20) * 100, 100);

      // Update session
      await db.update(aiPrepareSessions)
        .set({
          questionsAnswered,
          totalTimeSpent,
          averageStarScore: averageStarScore.toFixed(1),
          sessionProgress: progressPercentage.toFixed(1),
          updatedAt: new Date()
        })
        .where(eq(aiPrepareSessions.id, sessionId));

      console.log(`✅ Session progress updated: ${sessionId} (${progressPercentage.toFixed(1)}%)`);

    } catch (error) {
      console.error("❌ Error updating session progress:", error);
      throw new Error(`Failed to update session progress: ${error.message}`);
    }
  }

  /**
   * Get session progress and analytics
   */
  async getSessionProgress(sessionId: string): Promise<SessionProgress> {
    try {
      const session = await this.getSession(sessionId);
      
      const totalQuestions = session.questions.length;
      const responses = session.questions.flatMap((q: any) => q.responses);
      const questionsAnswered = responses.length;
      const currentQuestionNumber = Math.min(totalQuestions + 1, 20);
      
      // Calculate average STAR score
      const starScores = responses.map((r: any) => r.starScores?.overall || 0);
      const averageStarScore = starScores.length > 0 
        ? starScores.reduce((sum, score) => sum + score, 0) / starScores.length 
        : 0;

      const progressPercentage = Math.min((questionsAnswered / 20) * 100, 100);
      const timeSpent = responses.reduce((sum: number, r: any) => sum + (r.timeTaken || 0), 0);

      return {
        totalQuestions,
        questionsAnswered,
        currentQuestionNumber,
        progressPercentage: Math.round(progressPercentage * 10) / 10,
        averageStarScore: Math.round(averageStarScore * 10) / 10,
        timeSpent
      };

    } catch (error) {
      console.error("❌ Error getting session progress:", error);
      throw new Error(`Failed to get session progress: ${error.message}`);
    }
  }

  /**
   * Complete or pause session
   */
  async updateSessionStatus(
    sessionId: string, 
    status: 'active' | 'paused' | 'completed'
  ): Promise<void> {
    try {
      await db.update(aiPrepareSessions)
        .set({
          status: status,
          ...(status === 'completed' && { completedAt: new Date() }),
          updatedAt: new Date()
        })
        .where(eq(aiPrepareSessions.id, sessionId));

      console.log(`✅ Session status updated: ${sessionId} -> ${status}`);

    } catch (error) {
      console.error("❌ Error updating session status:", error);
      throw new Error(`Failed to update session status: ${error.message}`);
    }
  }

  /**
   * Delete session and all related data
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      // Delete responses first (foreign key constraint)
      await db.delete(aiPrepareResponses)
        .where(eq(aiPrepareResponses.sessionId, sessionId));

      // Delete questions
      await db.delete(aiPrepareQuestions)
        .where(eq(aiPrepareQuestions.sessionId, sessionId));

      // Delete session
      await db.delete(aiPrepareSessions)
        .where(eq(aiPrepareSessions.id, sessionId));

      console.log(`✅ Session deleted: ${sessionId}`);

    } catch (error) {
      console.error("❌ Error deleting session:", error);
      throw new Error(`Failed to delete session: ${error.message}`);
    }
  }
}