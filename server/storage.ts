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
          scenario,
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
    let query = db.select().from(starPracticeSessions).where(eq(starPracticeSessions.userId, userId));
    
    if (preparationSessionId) {
      query = query.where(eq(starPracticeSessions.preparationSessionId, preparationSessionId));
    }

    return await query.orderBy(desc(starPracticeSessions.createdAt));
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
    let query = db
      .select()
      .from(industryQuestions)
      .where(eq(industryQuestions.isActive, true));

    // Apply filters
    if (filters.industry) {
      query = query.where(eq(industryQuestions.industry, filters.industry));
    }
    if (filters.subfield) {
      query = query.where(eq(industryQuestions.subfield, filters.subfield));
    }
    if (filters.specialization) {
      query = query.where(eq(industryQuestions.specialization, filters.specialization));
    }
    if (filters.interviewStage) {
      query = query.where(eq(industryQuestions.interviewStage, filters.interviewStage));
    }
    if (filters.difficultyLevel) {
      query = query.where(eq(industryQuestions.difficultyLevel, filters.difficultyLevel));
    }

    // Apply limit
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    return await query.orderBy(desc(industryQuestions.popularity), desc(industryQuestions.createdAt));
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
    let query = db
      .select()
      .from(coachingFeedback)
      .where(eq(coachingFeedback.sessionId, sessionId));

    if (messageId) {
      query = query.where(eq(coachingFeedback.messageId, messageId));
    }

    return await query.orderBy(desc(coachingFeedback.createdAt));
  }

  async updateCoachingFeedback(id: string, updates: Partial<InsertCoachingFeedback>): Promise<CoachingFeedback> {
    const [feedback] = await db
      .update(coachingFeedback)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(coachingFeedback.id, id))
      .returning();
    return feedback;
  }
}

export const storage = new DatabaseStorage();
