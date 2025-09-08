import {
  users,
  interviewScenarios,
  interviewSessions,
  interviewMessages,
  aiEvaluationResults,
  preparationSessions,
  studyPlans,
  preparationResources,
  preparationProgress,
  practiceTests,
  practiceTestResults,
  companyResearch,
  starPracticeSessions,
  // New coaching system tables
  coachingSessions,
  coachingMessages,
  industryQuestions,
  industryKnowledge,
  coachingFeedback,
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
  type PreparationSession,
  type InsertPreparationSession,
  type StudyPlan,
  type InsertStudyPlan,
  type PreparationResource,
  type InsertPreparationResource,
  type PreparationProgress,
  type InsertPreparationProgress,
  type PracticeTest,
  type InsertPracticeTest,
  type PracticeTestResult,
  type InsertPracticeTestResult,
  type CompanyResearch,
  type InsertCompanyResearch,
  type StarPracticeSession,
  type InsertStarPracticeSession,
  // New coaching system types
  type CoachingSession,
  type InsertCoachingSession,
  type CoachingMessage,
  type InsertCoachingMessage,
  type IndustryQuestion,
  type InsertIndustryQuestion,
  type IndustryKnowledge,
  type InsertIndustryKnowledge,
  type CoachingFeedback,
  type InsertCoachingFeedback,
  type CoachingSessionWithMessages,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, avg, sql, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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

  // Industry-specific coaching system operations
  // Coaching sessions
  createCoachingSession(session: InsertCoachingSession): Promise<CoachingSession>;
  getCoachingSession(id: string): Promise<CoachingSessionWithMessages | undefined>;
  updateCoachingSession(id: string, updates: Partial<InsertCoachingSession>): Promise<CoachingSession>;
  getUserCoachingSessions(userId: string): Promise<CoachingSession[]>;
  
  // Coaching messages
  addCoachingMessage(message: InsertCoachingMessage): Promise<CoachingMessage>;
  getCoachingMessages(sessionId: string): Promise<CoachingMessage[]>;
  updateCoachingMessage(id: string, updates: Partial<InsertCoachingMessage>): Promise<CoachingMessage>;
  
  // Industry questions
  createIndustryQuestion(question: InsertIndustryQuestion): Promise<IndustryQuestion>;
  getIndustryQuestions(filters: {
    industry?: string;
    subfield?: string;
    specialization?: string;
    interviewStage?: string;
    difficultyLevel?: string;
    limit?: number;
  }): Promise<IndustryQuestion[]>;
  getIndustryQuestion(id: string): Promise<IndustryQuestion | undefined>;
  updateIndustryQuestion(id: string, updates: Partial<InsertIndustryQuestion>): Promise<IndustryQuestion>;
  
  // Industry knowledge base
  createIndustryKnowledge(knowledge: InsertIndustryKnowledge): Promise<IndustryKnowledge>;
  getIndustryKnowledge(knowledgeType: string, entityName: string): Promise<IndustryKnowledge | undefined>;
  getIndustryKnowledgeByIndustry(industry: string): Promise<IndustryKnowledge[]>;
  updateIndustryKnowledge(id: string, updates: Partial<InsertIndustryKnowledge>): Promise<IndustryKnowledge>;
  
  // Coaching feedback
  createCoachingFeedback(feedback: InsertCoachingFeedback): Promise<CoachingFeedback>;
  getCoachingFeedback(sessionId: string, messageId?: string): Promise<CoachingFeedback[]>;
  updateCoachingFeedback(id: string, updates: Partial<InsertCoachingFeedback>): Promise<CoachingFeedback>;

  // Session lifecycle management
  cleanupAbandonedSessions(cutoffTime: Date): Promise<number>;
  archiveOldCompletedSessions(olderThanDate: Date): Promise<number>;
  getSessionOwner(sessionId: string): Promise<string | undefined>;
}

// Simple in-memory cache for question banks
interface QuestionCacheEntry {
  data: IndustryQuestion[];
  timestamp: number;
  expiry: number;
}

class QuestionBankCache {
  private cache = new Map<string, QuestionCacheEntry>();
  private readonly DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes for question banks
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of cached entries
  private accessOrder = new Map<string, number>(); // Track access order for LRU eviction

  set(key: string, data: IndustryQuestion[], ttl: number = this.DEFAULT_TTL): void {
    // Clean expired entries before adding new ones
    this.cleanExpired();
    
    // If cache is at capacity, remove oldest entries (LRU)
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    });
    
    this.accessOrder.set(key, Date.now());
  }

  get(key: string): IndustryQuestion[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return null;
    }
    
    // Update access order for LRU
    this.accessOrder.set(key, Date.now());
    
    return entry.data;
  }

  // Clean expired entries
  private cleanExpired(): void {
    const now = Date.now();
    const expiredKeys = Array.from(this.cache.entries())
      .filter(([_, entry]) => now > entry.expiry)
      .map(([key]) => key);
    
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    });
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleaned ${expiredKeys.length} expired cache entries`);
    }
  }

  // Evict oldest entries when cache is full (LRU)
  private evictOldest(): void {
    const entries = Array.from(this.accessOrder.entries())
      .sort(([,a], [,b]) => a - b); // Sort by access time
    
    const toEvict = Math.ceil(this.MAX_CACHE_SIZE * 0.1); // Remove 10% of entries
    const keysToEvict = entries.slice(0, toEvict).map(([key]) => key);
    
    keysToEvict.forEach(key => {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    });
    
    console.log(`🧹 Evicted ${keysToEvict.length} old cache entries (LRU)`);
  }

  // Get cache statistics
  getStats(): { size: number; maxSize: number; memoryUsage: string } {
    const sizeInBytes = JSON.stringify(Array.from(this.cache.values())).length;
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      memoryUsage: `${Math.round(sizeInBytes / 1024)}KB`
    };
  }

  clear(): void {
    this.cache.clear();
  }
}

export class DatabaseStorage implements IStorage {
  private questionCache = new QuestionBankCache();
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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
      .leftJoin(interviewSessions, sql`${interviewScenarios.id}::text = ${interviewSessions.scenarioId}`)
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
        // Silently handle UUID mismatch - this is expected for string scenario IDs
        // console.error('Error fetching scenario:', error);
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
    // First get all sessions for the user without JOIN to avoid type conflicts
    const sessions = await db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.userId, userId))
      .orderBy(desc(interviewSessions.createdAt));

    // Process each session and add scenario data
    const sessionsWithScenarios = await Promise.all(
      sessions.map(async (session) => {
        let scenario = null;
        
        // Handle dynamic scenarios vs UUID scenarios
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
            sessionCount: 0,
            averageRating: 0
          };
        } else if (session.scenarioId) {
          // Try to fetch from database for UUID scenarios (only if it looks like a UUID)
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session.scenarioId);
          if (isUUID) {
            try {
              const [dbScenario] = await db
                .select()
                .from(interviewScenarios)
                .where(eq(interviewScenarios.id, session.scenarioId));
              scenario = dbScenario;
            } catch (error) {
              console.error('Error fetching scenario:', error);
              // Fallback scenario
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
                sessionCount: 0,
                averageRating: 0
              };
            }
          }
        }

        return { 
          ...session, 
          scenario: scenario as any, // Type assertion to handle dynamic scenario creation
          userJobPosition: session.userJobPosition || null,
          userCompanyName: session.userCompanyName || null,
          interviewLanguage: session.interviewLanguage || 'en',
          messages: [] // Don't load messages for the sessions list to avoid type conflicts
        };
      })
    );

    return sessionsWithScenarios;
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

  // Batch version to avoid N+1 queries with safety limits
  async getBatchEvaluationResults(sessionIds: string[]): Promise<AiEvaluationResult[]> {
    if (sessionIds.length === 0) return [];
    
    // Safety limit: prevent excessive batch queries
    const MAX_BATCH_SIZE = 200;
    const limitedSessionIds = sessionIds.slice(0, MAX_BATCH_SIZE);
    
    if (sessionIds.length > MAX_BATCH_SIZE) {
      console.warn(`⚠️  Batch query limited from ${sessionIds.length} to ${MAX_BATCH_SIZE} sessions for performance`);
    }
    
    const startTime = Date.now();
    
    try {
      const results = await db.select()
        .from(aiEvaluationResults)
        .where(
          limitedSessionIds.length === 1 
            ? eq(aiEvaluationResults.sessionId, limitedSessionIds[0])
            : or(...limitedSessionIds.map(id => eq(aiEvaluationResults.sessionId, id)))
        );
      
      console.log(`⏱️  getBatchEvaluationResults took: ${Date.now() - startTime}ms, found ${results.length} evaluations (${limitedSessionIds.length} sessions)`);
      return results;
    } catch (error) {
      console.error("❌ Error in getBatchEvaluationResults:", error);
      return [];
    }
  }

  // ================================
  // PREPARE MODULE STORAGE METHODS
  // ================================

  // Preparation Sessions
  async createPreparationSession(userId: string, data: InsertPreparationSession): Promise<PreparationSession> {
    const [session] = await db
      .insert(preparationSessions)
      .values({ ...data, userId })
      .returning();
    return session;
  }

  async getPreparationSession(sessionId: string): Promise<PreparationSession | null> {
    const [session] = await db
      .select()
      .from(preparationSessions)
      .where(eq(preparationSessions.id, sessionId));
    return session || null;
  }

  async getUserPreparationSessions(userId: string): Promise<PreparationSession[]> {
    return await db
      .select()
      .from(preparationSessions)
      .where(eq(preparationSessions.userId, userId))
      .orderBy(desc(preparationSessions.createdAt));
  }

  async updatePreparationSession(sessionId: string, updates: Partial<PreparationSession>): Promise<PreparationSession> {
    const [session] = await db
      .update(preparationSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(preparationSessions.id, sessionId))
      .returning();
    return session;
  }

  // Study Plans
  async createStudyPlan(data: InsertStudyPlan): Promise<StudyPlan> {
    const [plan] = await db
      .insert(studyPlans)
      .values(data)
      .returning();
    return plan;
  }

  async getStudyPlan(planId: string): Promise<StudyPlan | null> {
    const [plan] = await db
      .select()
      .from(studyPlans)
      .where(eq(studyPlans.id, planId));
    return plan || null;
  }

  async updateStudyPlan(planId: string, updates: Partial<StudyPlan>): Promise<StudyPlan> {
    const [plan] = await db
      .update(studyPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(studyPlans.id, planId))
      .returning();
    return plan;
  }

  // Preparation Resources
  async createPreparationResource(data: InsertPreparationResource): Promise<PreparationResource> {
    const [resource] = await db
      .insert(preparationResources)
      .values(data)
      .returning();
    return resource;
  }

  async getPreparationResources(filters: {
    category?: string;
    interviewStage?: string;
    industry?: string;
    difficulty?: string;
    language?: string;
  }): Promise<PreparationResource[]> {
    const conditions = [eq(preparationResources.isActive, true)];

    if (filters.category) {
      conditions.push(eq(preparationResources.category, filters.category));
    }
    if (filters.interviewStage) {
      conditions.push(eq(preparationResources.interviewStage, filters.interviewStage));
    }
    if (filters.industry) {
      conditions.push(eq(preparationResources.industry, filters.industry));
    }
    if (filters.difficulty) {
      conditions.push(eq(preparationResources.difficulty, filters.difficulty));
    }
    if (filters.language) {
      conditions.push(eq(preparationResources.language, filters.language));
    }

    return await db
      .select()
      .from(preparationResources)
      .where(and(...conditions))
      .orderBy(desc(preparationResources.popularity), desc(preparationResources.createdAt));
  }

  // Preparation Progress
  async createPreparationProgress(data: InsertPreparationProgress): Promise<PreparationProgress> {
    const [progress] = await db
      .insert(preparationProgress)
      .values(data)
      .returning();
    return progress;
  }

  async getPreparationProgress(userId: string, preparationSessionId: string, activityType: string, activityId?: string): Promise<PreparationProgress | null> {
    const conditions = [
      eq(preparationProgress.userId, userId),
      eq(preparationProgress.preparationSessionId, preparationSessionId),
      eq(preparationProgress.activityType, activityType)
    ];

    if (activityId) {
      conditions.push(eq(preparationProgress.activityId, activityId));
    }

    const [progress] = await db
      .select()
      .from(preparationProgress)
      .where(and(...conditions));
      
    return progress || null;
  }

  async updatePreparationProgress(progressId: string, updates: Partial<PreparationProgress>): Promise<PreparationProgress> {
    const [progress] = await db
      .update(preparationProgress)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(preparationProgress.id, progressId))
      .returning();
    return progress;
  }

  async getSessionProgress(preparationSessionId: string): Promise<PreparationProgress[]> {
    return await db
      .select()
      .from(preparationProgress)
      .where(eq(preparationProgress.preparationSessionId, preparationSessionId))
      .orderBy(desc(preparationProgress.createdAt));
  }

  // Practice Tests
  async createPracticeTest(data: InsertPracticeTest): Promise<PracticeTest> {
    const [test] = await db
      .insert(practiceTests)
      .values(data)
      .returning();
    return test;
  }

  async getPracticeTest(testId: string): Promise<PracticeTest | null> {
    const [test] = await db
      .select()
      .from(practiceTests)
      .where(eq(practiceTests.id, testId));
    return test || null;
  }

  async getPracticeTests(filters: {
    testType?: string;
    interviewStage?: string;
    industry?: string;
    difficulty?: string;
  }): Promise<PracticeTest[]> {
    const conditions = [eq(practiceTests.isActive, true)];

    if (filters.testType) {
      conditions.push(eq(practiceTests.testType, filters.testType));
    }
    if (filters.interviewStage) {
      conditions.push(eq(practiceTests.interviewStage, filters.interviewStage));
    }
    if (filters.industry) {
      conditions.push(eq(practiceTests.industry, filters.industry));
    }
    if (filters.difficulty) {
      conditions.push(eq(practiceTests.difficulty, filters.difficulty));
    }

    return await db
      .select()
      .from(practiceTests)
      .where(and(...conditions))
      .orderBy(desc(practiceTests.createdAt));
  }

  // Practice Test Results
  async createPracticeTestResult(data: InsertPracticeTestResult): Promise<PracticeTestResult> {
    const [result] = await db
      .insert(practiceTestResults)
      .values(data)
      .returning();
    return result;
  }

  async getUserPracticeTestResults(userId: string, testId?: string): Promise<PracticeTestResult[]> {
    const conditions = [eq(practiceTestResults.userId, userId)];
    
    if (testId) {
      conditions.push(eq(practiceTestResults.practiceTestId, testId));
    }

    return await db
      .select()
      .from(practiceTestResults)
      .where(and(...conditions))
      .orderBy(desc(practiceTestResults.completedAt));
  }

  // Company Research
  async createCompanyResearch(data: InsertCompanyResearch): Promise<CompanyResearch> {
    const [research] = await db
      .insert(companyResearch)
      .values(data)
      .returning();
    return research;
  }

  async getCompanyResearch(userId: string, companyName: string): Promise<CompanyResearch | null> {
    const [research] = await db
      .select()
      .from(companyResearch)
      .where(
        and(
          eq(companyResearch.userId, userId),
          eq(companyResearch.companyName, companyName)
        )
      )
      .orderBy(desc(companyResearch.lastUpdated));
    return research || null;
  }

  async updateCompanyResearch(researchId: string, updates: Partial<CompanyResearch>): Promise<CompanyResearch> {
    const [research] = await db
      .update(companyResearch)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(companyResearch.id, researchId))
      .returning();
    return research;
  }

  // STAR Practice Sessions
  async createStarPracticeSession(data: InsertStarPracticeSession): Promise<StarPracticeSession> {
    const [session] = await db
      .insert(starPracticeSessions)
      .values(data)
      .returning();
    return session;
  }

  async getStarPracticeSession(sessionId: string): Promise<StarPracticeSession | null> {
    const [session] = await db
      .select()
      .from(starPracticeSessions)
      .where(eq(starPracticeSessions.id, sessionId));
    return session || null;
  }

  async updateStarPracticeSession(sessionId: string, updates: Partial<StarPracticeSession>): Promise<StarPracticeSession> {
    const [session] = await db
      .update(starPracticeSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(starPracticeSessions.id, sessionId))
      .returning();
    return session;
  }

  async getUserStarPracticeSessions(userId: string, preparationSessionId?: string): Promise<StarPracticeSession[]> {
    const conditions = [eq(starPracticeSessions.userId, userId)];
    
    if (preparationSessionId) {
      conditions.push(eq(starPracticeSessions.preparationSessionId, preparationSessionId));
    }

    return await db.select()
      .from(starPracticeSessions)
      .where(and(...conditions))
      .orderBy(desc(starPracticeSessions.createdAt));
  }

  // ================================
  // INDUSTRY-SPECIFIC COACHING SYSTEM METHODS
  // ================================

  // Coaching sessions operations
  async createCoachingSession(sessionData: InsertCoachingSession): Promise<CoachingSession> {
    const [session] = await db
      .insert(coachingSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async getCoachingSession(id: string): Promise<CoachingSessionWithMessages | undefined> {
    const [session] = await db
      .select()
      .from(coachingSessions)
      .where(eq(coachingSessions.id, id));

    if (!session) return undefined;

    // Get related messages and feedback
    const messages = await this.getCoachingMessages(id);
    const feedback = await this.getCoachingFeedback(id);

    return {
      ...session,
      messages,
      feedback,
      industryInsights: [] // TODO: Add industry insights fetching
    };
  }

  async updateCoachingSession(id: string, updates: Partial<InsertCoachingSession>): Promise<CoachingSession> {
    const [session] = await db
      .update(coachingSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(coachingSessions.id, id))
      .returning();
    return session;
  }

  async getUserCoachingSessions(userId: string): Promise<CoachingSession[]> {
    return await db
      .select()
      .from(coachingSessions)
      .where(eq(coachingSessions.userId, userId))
      .orderBy(desc(coachingSessions.createdAt));
  }

  // Coaching messages operations
  async addCoachingMessage(messageData: InsertCoachingMessage): Promise<CoachingMessage> {
    const [message] = await db
      .insert(coachingMessages)
      .values(messageData)
      .returning();
    return message;
  }

  async getCoachingMessages(sessionId: string): Promise<CoachingMessage[]> {
    return await db
      .select()
      .from(coachingMessages)
      .where(eq(coachingMessages.sessionId, sessionId))
      .orderBy(coachingMessages.timestamp);
  }

  async updateCoachingMessage(id: string, updates: Partial<InsertCoachingMessage>): Promise<CoachingMessage> {
    const [message] = await db
      .update(coachingMessages)
      .set(updates)
      .where(eq(coachingMessages.id, id))
      .returning();
    return message;
  }

  // Industry questions operations
  async createIndustryQuestion(questionData: InsertIndustryQuestion): Promise<IndustryQuestion> {
    const [question] = await db
      .insert(industryQuestions)
      .values(questionData)
      .returning();
    return question;
  }

  async getIndustryQuestions(filters: {
    industry?: string;
    subfield?: string;
    specialization?: string;
    interviewStage?: string;
    difficultyLevel?: string;
    limit?: number;
  }): Promise<IndustryQuestion[]> {
    // Create cache key from filters
    const cacheKey = `questions:${[
      filters.industry || 'any',
      filters.subfield || 'any', 
      filters.specialization || 'any',
      filters.interviewStage || 'any',
      filters.difficultyLevel || 'any',
      filters.limit || 50
    ].join(':')}`;

    // Check cache first
    const cached = this.questionCache.get(cacheKey);
    if (cached) {
      console.log(`🚀 Cache hit for question bank: ${cacheKey}`);
      return cached;
    }

    const conditions = [eq(industryQuestions.isActive, true)];

    // Apply filters
    if (filters.industry) {
      conditions.push(eq(industryQuestions.industry, filters.industry));
    }
    if (filters.subfield) {
      conditions.push(eq(industryQuestions.subfield, filters.subfield));
    }
    if (filters.specialization) {
      conditions.push(eq(industryQuestions.specialization, filters.specialization));
    }
    if (filters.interviewStage) {
      conditions.push(eq(industryQuestions.interviewStage, filters.interviewStage));
    }
    if (filters.difficultyLevel) {
      conditions.push(eq(industryQuestions.difficultyLevel, filters.difficultyLevel));
    }

    // Optimize query by selecting only needed fields and using proper indexing
    const result = await db
      .select()
      .from(industryQuestions)
      .where(and(...conditions))
      .orderBy(desc(industryQuestions.popularity), desc(industryQuestions.createdAt))
      .limit(Math.min(filters.limit || 50, 100)); // Cap at 100 for performance
    
    // Cache the result with optimized fields
    const optimizedResult = result.map(q => ({
      id: q.id,
      questionText: q.questionText,
      industry: q.industry,
      subfield: q.subfield,
      specialization: q.specialization,
      interviewStage: q.interviewStage,
      difficultyLevel: q.difficultyLevel,
      technicalDepth: q.technicalDepth,
      questionType: q.questionType,
      estimatedTime: q.estimatedTime,
      modelAnswerStar: q.modelAnswerStar,
      evaluationCriteria: q.evaluationCriteria,
      commonFollowups: q.commonFollowups,
      industryInsights: q.industryInsights,
      tags: q.tags,
      isActive: q.isActive,
      aiGenerated: q.aiGenerated,
      popularity: q.popularity,
      createdBy: q.createdBy,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
      contextRequirements: q.contextRequirements
    }));
    
    this.questionCache.set(cacheKey, optimizedResult);
    console.log(`💾 Cached question bank: ${cacheKey} (${optimizedResult.length} questions)`);

    return optimizedResult;
  }

  async getIndustryQuestion(id: string): Promise<IndustryQuestion | undefined> {
    const [question] = await db
      .select()
      .from(industryQuestions)
      .where(eq(industryQuestions.id, id));
    return question;
  }

  async updateIndustryQuestion(id: string, updates: Partial<InsertIndustryQuestion>): Promise<IndustryQuestion> {
    const [question] = await db
      .update(industryQuestions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(industryQuestions.id, id))
      .returning();
    return question;
  }

  // Industry knowledge base operations
  async createIndustryKnowledge(knowledgeData: InsertIndustryKnowledge): Promise<IndustryKnowledge> {
    const [knowledge] = await db
      .insert(industryKnowledge)
      .values(knowledgeData)
      .returning();
    return knowledge;
  }

  async getIndustryKnowledge(knowledgeType: string, entityName: string): Promise<IndustryKnowledge | undefined> {
    const [knowledge] = await db
      .select()
      .from(industryKnowledge)
      .where(
        and(
          eq(industryKnowledge.knowledgeType, knowledgeType),
          eq(industryKnowledge.entityName, entityName),
          eq(industryKnowledge.isActive, true)
        )
      );
    return knowledge;
  }

  async getIndustryKnowledgeByIndustry(industry: string): Promise<IndustryKnowledge[]> {
    return await db
      .select()
      .from(industryKnowledge)
      .where(
        and(
          eq(industryKnowledge.primaryIndustry, industry),
          eq(industryKnowledge.isActive, true)
        )
      )
      .orderBy(desc(industryKnowledge.confidenceScore), desc(industryKnowledge.createdAt));
  }

  async updateIndustryKnowledge(id: string, updates: Partial<InsertIndustryKnowledge>): Promise<IndustryKnowledge> {
    const [knowledge] = await db
      .update(industryKnowledge)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(industryKnowledge.id, id))
      .returning();
    return knowledge;
  }

  // Coaching feedback operations
  async createCoachingFeedback(feedbackData: InsertCoachingFeedback): Promise<CoachingFeedback> {
    const [feedback] = await db
      .insert(coachingFeedback)
      .values(feedbackData)
      .returning();
    return feedback;
  }

  async getCoachingFeedback(sessionId: string, messageId?: string): Promise<CoachingFeedback[]> {
    const conditions = [eq(coachingFeedback.sessionId, sessionId)];

    if (messageId) {
      conditions.push(eq(coachingFeedback.messageId, messageId));
    }

    return await db
      .select()
      .from(coachingFeedback)
      .where(and(...conditions))
      .orderBy(desc(coachingFeedback.createdAt));
  }

  async updateCoachingFeedback(id: string, updates: Partial<InsertCoachingFeedback>): Promise<CoachingFeedback> {
    const [feedback] = await db
      .update(coachingFeedback)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(coachingFeedback.id, id))
      .returning();
    return feedback;
  }

  // ================================
  // SESSION LIFECYCLE MANAGEMENT METHODS
  // ================================

  async cleanupAbandonedSessions(cutoffTime: Date): Promise<number> {
    try {
      // Delete abandoned sessions that are not completed and haven't been updated since cutoff
      const result = await db
        .delete(interviewSessions)
        .where(
          and(
            sql`${interviewSessions.status} != 'completed'`,
            sql`COALESCE(${interviewSessions.autoSavedAt}, ${interviewSessions.createdAt}) < ${cutoffTime}`
          )
        )
        .returning({ id: interviewSessions.id });

      console.log(`🧹 Cleaned up ${result.length} abandoned sessions older than ${cutoffTime.toISOString()}`);
      return result.length;
    } catch (error) {
      console.error('Error in cleanupAbandonedSessions:', error);
      return 0;
    }
  }

  async archiveOldCompletedSessions(olderThanDate: Date): Promise<number> {
    try {
      // For now, we'll just delete old completed sessions
      // In a real production system, you might want to move them to an archive table
      const result = await db
        .delete(interviewSessions)
        .where(
          and(
            eq(interviewSessions.status, 'completed'),
            sql`${interviewSessions.completedAt} < ${olderThanDate}`
          )
        )
        .returning({ id: interviewSessions.id });

      console.log(`📦 Archived ${result.length} completed sessions older than ${olderThanDate.toISOString()}`);
      return result.length;
    } catch (error) {
      console.error('Error in archiveOldCompletedSessions:', error);
      return 0;
    }
  }

  async getSessionOwner(sessionId: string): Promise<string | undefined> {
    try {
      const [session] = await db
        .select({ userId: interviewSessions.userId })
        .from(interviewSessions)
        .where(eq(interviewSessions.id, sessionId));
      return session?.userId;
    } catch (error) {
      console.error('Error getting session owner:', error);
      return undefined;
    }
  }
}

export const storage = new DatabaseStorage();
