import {
  users,
  interviewScenarios,
  interviewSessions,
  interviewMessages,
  prepareSessions,
  prepareQuestions,
  prepareResponses,
  jobDescriptions,
  type User,
  type UpsertUser,
  type InsertInterviewScenario,
  type InterviewScenario,
  type InsertInterviewSession,
  type InterviewSession,
  type InsertInterviewMessage,
  type InterviewMessage,
  type InterviewSessionWithScenario,
  type InterviewScenarioWithStats,
  type PrepareSession,
  type PrepareQuestion,
  type PrepareResponse,
  type JobDescription,
  type InsertPrepareSession,
  type InsertPrepareQuestion,
  type InsertPrepareResponse,
  type InsertJobDescription,
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

  // Prepare Module operations
  createPrepareSession(session: InsertPrepareSession): Promise<PrepareSession>;
  getPrepareSession(id: string): Promise<PrepareSession | undefined>;
  updatePrepareSession(id: string, session: Partial<InsertPrepareSession>): Promise<PrepareSession>;
  getUserPrepareSessions(userId: string): Promise<PrepareSession[]>;
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
  async createInterviewSession(session: InsertInterviewSession): Promise<InterviewSession> {
    const [newSession] = await db
      .insert(interviewSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getInterviewSession(id: string): Promise<InterviewSessionWithScenario | undefined> {
    const [session] = await db
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
      .where(eq(interviewSessions.id, id));

    if (!session) return undefined;

    const messages = await this.getSessionMessages(id);
    return { ...session, messages };
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
        return { ...session, messages };
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

  // Prepare Module operations
  async createPrepareSession(session: InsertPrepareSession): Promise<PrepareSession> {
    const [newSession] = await db
      .insert(prepareSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getPrepareSession(id: string): Promise<PrepareSession | undefined> {
    const [session] = await db
      .select()
      .from(prepareSessions)
      .where(eq(prepareSessions.id, id));
    return session;
  }

  async updatePrepareSession(id: string, session: Partial<InsertPrepareSession>): Promise<PrepareSession> {
    const [updatedSession] = await db
      .update(prepareSessions)
      .set({ ...session, updatedAt: new Date() })
      .where(eq(prepareSessions.id, id))
      .returning();
    return updatedSession;
  }

  async getUserPrepareSessions(userId: string): Promise<PrepareSession[]> {
    return await db
      .select()
      .from(prepareSessions)
      .where(eq(prepareSessions.userId, userId))
      .orderBy(desc(prepareSessions.createdAt));
  }
}

export const storage = new DatabaseStorage();
