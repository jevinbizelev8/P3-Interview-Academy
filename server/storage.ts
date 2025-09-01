import {
  users,
  interviewScenarios,
  interviewSessions,
  interviewMessages,
  aiEvaluationResults,
  type User,
  type UpsertUser,
  type InsertInterviewScenario,
  type InterviewScenario,
  type InsertInterviewSession,
  type InterviewSession,
  type InsertInterviewMessage,
  type InterviewMessage,
  type InsertAiEvaluationResult,
  type AiEvaluationResult,
  type InterviewSessionWithScenario,
  type InterviewScenarioWithStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, avg, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Interview scenario operations
  getInterviewScenarios(stage?: string): Promise<InterviewScenarioWithStats[]>;
  getInterviewScenario(id: string): Promise<InterviewScenario | undefined>;
  createInterviewScenario(scenario: InsertInterviewScenario): Promise<InterviewScenario>;
  updateInterviewScenario(id: string, scenario: Partial<InsertInterviewScenario>): Promise<InterviewScenario>;
  deleteInterviewScenario(id: string): Promise<void>;

  // Interview session operations
  createInterviewSession(session: InsertInterviewSession): Promise<InterviewSession>;
  getInterviewSession(id: string): Promise<InterviewSessionWithScenario | undefined>;
  updateInterviewSession(id: string, session: Partial<InsertInterviewSession>): Promise<InterviewSession>;
  getUserInterviewSessions(userId: string): Promise<InterviewSessionWithScenario[]>;
  autoSaveSession(sessionId: string, data: Partial<InsertInterviewSession>): Promise<void>;

  // Interview message operations
  addInterviewMessage(message: InsertInterviewMessage): Promise<InterviewMessage>;
  getSessionMessages(sessionId: string): Promise<InterviewMessage[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Interview scenario operations
  async getInterviewScenarios(stage?: string): Promise<InterviewScenarioWithStats[]> {
    const baseQuery = db
      .select({
        id: interviewScenarios.id,
        title: interviewScenarios.title,
        interviewStage: interviewScenarios.interviewStage,
        industry: interviewScenarios.industry,
        jobRole: interviewScenarios.jobRole,
        companyBackground: interviewScenarios.companyBackground,
        roleDescription: interviewScenarios.roleDescription,
        candidateBackground: interviewScenarios.candidateBackground,
        keyObjectives: interviewScenarios.keyObjectives,
        interviewerName: interviewScenarios.interviewerName,
        interviewerTitle: interviewScenarios.interviewerTitle,
        interviewerStyle: interviewScenarios.interviewerStyle,
        personalityTraits: interviewScenarios.personalityTraits,
        status: interviewScenarios.status,
        createdBy: interviewScenarios.createdBy,
        createdAt: interviewScenarios.createdAt,
        updatedAt: interviewScenarios.updatedAt,
        sessionCount: count(interviewSessions.id),
        averageRating: sql<number>`COALESCE(AVG(${interviewSessions.overallScore}), 0)::numeric`,
      })
      .from(interviewScenarios)
      .leftJoin(interviewSessions, eq(interviewScenarios.id, interviewSessions.scenarioId))
      .groupBy(interviewScenarios.id)
      .orderBy(desc(interviewScenarios.createdAt));

    const results = stage 
      ? await baseQuery.where(eq(interviewScenarios.interviewStage, stage))
      : await baseQuery;

    return results.map(result => ({
      ...result,
      sessionCount: Number(result.sessionCount),
      averageRating: Number(result.averageRating) || 0,
    }));
  }

  async getInterviewScenario(id: string): Promise<InterviewScenario | undefined> {
    const [scenario] = await db
      .select()
      .from(interviewScenarios)
      .where(eq(interviewScenarios.id, id));
    return scenario;
  }

  async createInterviewScenario(scenario: InsertInterviewScenario): Promise<InterviewScenario> {
    const [newScenario] = await db
      .insert(interviewScenarios)
      .values(scenario)
      .returning();
    return newScenario;
  }

  async updateInterviewScenario(id: string, scenario: Partial<InsertInterviewScenario>): Promise<InterviewScenario> {
    const [updatedScenario] = await db
      .update(interviewScenarios)
      .set({ ...scenario, updatedAt: new Date() })
      .where(eq(interviewScenarios.id, id))
      .returning();
    return updatedScenario;
  }

  async deleteInterviewScenario(id: string): Promise<void> {
    await db.delete(interviewScenarios).where(eq(interviewScenarios.id, id));
  }

  // Interview session operations
  async createInterviewSession(session: any): Promise<InterviewSession> {
    // Handle both UUID and dynamic scenario IDs
    const sessionValues = {
      ...session,
      // Ensure we have all required fields with defaults
      status: session.status || "in_progress",
      currentQuestion: session.currentQuestion || 1,
      totalQuestions: session.totalQuestions || 15,
      startedAt: new Date(),
    };
    
    const [newSession] = await db
      .insert(interviewSessions)
      .values(sessionValues)
      .returning();
    return newSession;
  }

  async getInterviewSession(id: string): Promise<InterviewSessionWithScenario | undefined> {
    // First fetch the session
    const [session] = await db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.id, id));

    if (!session) return undefined;

    // Try to fetch scenario if it's a UUID, otherwise create dynamic scenario
    let scenario = null;
    if (session.scenarioId?.startsWith('dynamic-')) {
      const [, stage] = session.scenarioId.split('-');
      scenario = {
        id: session.scenarioId,
        title: `${stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Interview`,
        interviewStage: stage,
        industry: 'Technology',
        jobRole: session.userJobPosition || 'Software Engineer',
        companyBackground: session.userCompanyName || 'Technology Company',
        roleDescription: `${session.userJobPosition} role`,
        candidateBackground: 'Experienced professional',
        keyObjectives: `Assess candidate suitability for ${session.userJobPosition} role`,
        interviewerName: 'AI Interviewer',
        interviewerTitle: 'Professional Interview Assistant', 
        interviewerStyle: 'Professional and engaging',
        personalityTraits: 'Thoughtful and supportive',
        status: 'active',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      // Try to fetch from database for UUID scenarios
      try {
        const [dbScenario] = await db
          .select()
          .from(interviewScenarios)
          .where(eq(interviewScenarios.id, session.scenarioId));
        scenario = dbScenario;
      } catch (error) {
        console.error('Error fetching scenario:', error);
        // Fallback to dynamic scenario structure
        scenario = {
          id: session.scenarioId,
          title: 'Interview',
          interviewStage: 'general',
          industry: 'General',
          jobRole: session.userJobPosition || 'Professional',
          companyBackground: session.userCompanyName || 'Company',
          roleDescription: 'Professional role',
          candidateBackground: 'Experienced professional',
          keyObjectives: 'Assess candidate suitability',
          interviewerName: 'AI Interviewer',
          interviewerTitle: 'Professional Interview Assistant',
          interviewerStyle: 'Professional and engaging', 
          personalityTraits: 'Thoughtful and supportive',
          status: 'active',
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    }

    const messages = await this.getSessionMessages(id);
    return { 
      ...session, 
      scenario,
      userJobPosition: session.userJobPosition || null,
      userCompanyName: session.userCompanyName || null,
      interviewLanguage: session.interviewLanguage || 'en',
      messages 
    };
  }

  async updateInterviewSession(id: string, session: Partial<InsertInterviewSession>): Promise<InterviewSession> {
    const [updatedSession] = await db
      .update(interviewSessions)
      .set({ ...session, updatedAt: new Date() })
      .where(eq(interviewSessions.id, id))
      .returning();
    return updatedSession;
  }

  async getUserInterviewSessions(userId: string): Promise<InterviewSessionWithScenario[]> {
    const sessions = await db
      .select({
        // Session fields
        id: interviewSessions.id,
        userId: interviewSessions.userId,
        scenarioId: interviewSessions.scenarioId,
        status: interviewSessions.status,
        currentQuestion: interviewSessions.currentQuestion,
        totalQuestions: interviewSessions.totalQuestions,
        startedAt: interviewSessions.startedAt,
        completedAt: interviewSessions.completedAt,
        duration: interviewSessions.duration,
        overallScore: interviewSessions.overallScore,
        situationScore: interviewSessions.situationScore,
        taskScore: interviewSessions.taskScore,
        actionScore: interviewSessions.actionScore,
        resultScore: interviewSessions.resultScore,
        flowScore: interviewSessions.flowScore,
        qualitativeFeedback: interviewSessions.qualitativeFeedback,
        strengths: interviewSessions.strengths,
        improvements: interviewSessions.improvements,
        recommendations: interviewSessions.recommendations,
        transcript: interviewSessions.transcript,
        userJobPosition: interviewSessions.userJobPosition,
        userCompanyName: interviewSessions.userCompanyName,
        interviewLanguage: interviewSessions.interviewLanguage,
        autoSavedAt: interviewSessions.autoSavedAt,
        createdAt: interviewSessions.createdAt,
        updatedAt: interviewSessions.updatedAt,
        // Scenario fields
        scenario: {
          id: interviewScenarios.id,
          title: interviewScenarios.title,
          interviewStage: interviewScenarios.interviewStage,
          industry: interviewScenarios.industry,
          jobRole: interviewScenarios.jobRole,
          companyBackground: interviewScenarios.companyBackground,
          roleDescription: interviewScenarios.roleDescription,
          candidateBackground: interviewScenarios.candidateBackground,
          keyObjectives: interviewScenarios.keyObjectives,
          interviewerName: interviewScenarios.interviewerName,
          interviewerTitle: interviewScenarios.interviewerTitle,
          interviewerStyle: interviewScenarios.interviewerStyle,
          personalityTraits: interviewScenarios.personalityTraits,
          status: interviewScenarios.status,
          createdBy: interviewScenarios.createdBy,
          createdAt: interviewScenarios.createdAt,
          updatedAt: interviewScenarios.updatedAt,
        },
      })
      .from(interviewSessions)
      .innerJoin(interviewScenarios, eq(interviewSessions.scenarioId, interviewScenarios.id))
      .where(eq(interviewSessions.userId, userId))
      .orderBy(desc(interviewSessions.createdAt));

    // Add messages to each session
    const sessionsWithMessages = await Promise.all(
      sessions.map(async (session) => {
        const messages = await this.getSessionMessages(session.id);
        return { 
          ...session, 
          userJobPosition: session.userJobPosition || null,
          userCompanyName: session.userCompanyName || null,
          interviewLanguage: session.interviewLanguage || 'en',
          messages 
        };
      })
    );

    return sessionsWithMessages;
  }

  async autoSaveSession(sessionId: string, data: Partial<InsertInterviewSession>): Promise<void> {
    await db
      .update(interviewSessions)
      .set({ ...data, autoSavedAt: new Date() })
      .where(eq(interviewSessions.id, sessionId));
  }

  // Interview message operations
  async addInterviewMessage(message: InsertInterviewMessage): Promise<InterviewMessage> {
    const [newMessage] = await db
      .insert(interviewMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getSessionMessages(sessionId: string): Promise<InterviewMessage[]> {
    return await db
      .select()
      .from(interviewMessages)
      .where(eq(interviewMessages.sessionId, sessionId))
      .orderBy(interviewMessages.timestamp);
  }

  // Additional methods for Perform module
  async createInterviewMessage(data: InsertInterviewMessage): Promise<InterviewMessage> {
    const [message] = await db.insert(interviewMessages)
      .values(data)
      .returning();
    return message;
  }

  async updateSessionStatus(sessionId: string, status: string): Promise<void> {
    await db.update(interviewSessions)
      .set({ status, completedAt: status === 'completed' ? new Date() : null })
      .where(eq(interviewSessions.id, sessionId));
  }

  async createEvaluationResult(data: InsertAiEvaluationResult): Promise<AiEvaluationResult> {
    const [evaluation] = await db.insert(aiEvaluationResults)
      .values(data)
      .returning();
    return evaluation;
  }

  async getEvaluationResult(sessionId: string): Promise<AiEvaluationResult | undefined> {
    const [evaluation] = await db.select()
      .from(aiEvaluationResults)
      .where(eq(aiEvaluationResults.sessionId, sessionId));
    return evaluation;
  }
}

export const storage = new DatabaseStorage();
