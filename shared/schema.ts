import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  jsonb,
  boolean,
  index,
  uuid,
  numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Supported languages for Southeast Asia
export const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'ms': 'Bahasa Malaysia',
  'id': 'Bahasa Indonesia', 
  'th': 'ไทย (Thai)',
  'vi': 'Tiếng Việt (Vietnamese)',
  'fil': 'Filipino',
  'my': 'မြန်မာ (Myanmar)',
  'km': 'ខ្មែរ (Khmer)',
  'lo': 'ລາວ (Lao)',
  'zh-sg': '中文 (Chinese - Singapore)'
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user"), // user, admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Interview scenarios table
export const interviewScenarios = pgTable("interview_scenarios", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  interviewStage: varchar("interview_stage", { length: 100 }).notNull(), // phone-screening, functional-team, etc.
  industry: varchar("industry", { length: 100 }).notNull(),
  jobRole: varchar("job_role", { length: 100 }).notNull(),
  companyBackground: text("company_background").notNull(),
  roleDescription: text("role_description").notNull(),
  candidateBackground: text("candidate_background").notNull(),
  keyObjectives: text("key_objectives").notNull(),
  interviewerName: varchar("interviewer_name", { length: 100 }).notNull(),
  interviewerTitle: varchar("interviewer_title", { length: 100 }).notNull(),
  interviewerStyle: varchar("interviewer_style", { length: 100 }).notNull(),
  personalityTraits: text("personality_traits").notNull(),
  status: varchar("status", { length: 20 }).default("active"), // active, draft, inactive
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Interview sessions table
export const interviewSessions = pgTable("interview_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  scenarioId: varchar("scenario_id").notNull(), // Can be UUID or dynamic ID
  status: varchar("status", { length: 20 }).default("in_progress"), // in_progress, completed, abandoned
  currentQuestion: integer("current_question").default(1),
  totalQuestions: integer("total_questions").default(15),
  // User-provided job context for personalized AI questions
  userJobPosition: varchar("user_job_position", { length: 200 }),
  userCompanyName: varchar("user_company_name", { length: 200 }),
  // Interview language preference
  interviewLanguage: varchar("interview_language", { length: 10 }).default("en"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // in seconds
  overallScore: numeric("overall_score", { precision: 3, scale: 2 }),
  situationScore: numeric("situation_score", { precision: 3, scale: 2 }),
  taskScore: numeric("task_score", { precision: 3, scale: 2 }),
  actionScore: numeric("action_score", { precision: 3, scale: 2 }),
  resultScore: numeric("result_score", { precision: 3, scale: 2 }),
  flowScore: numeric("flow_score", { precision: 3, scale: 2 }),
  qualitativeFeedback: text("qualitative_feedback"),
  strengths: jsonb("strengths"), // array of strings
  improvements: jsonb("improvements"), // array of strings
  recommendations: jsonb("recommendations"), // array of strings
  transcript: jsonb("transcript"), // conversation history
  autoSavedAt: timestamp("auto_saved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Interview messages table for chat history
export const interviewMessages = pgTable("interview_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  messageType: varchar("message_type", { length: 20 }).notNull(), // ai, user
  content: text("content").notNull(),
  questionNumber: integer("question_number"),
  timestamp: timestamp("timestamp").defaultNow(),
  feedback: text("feedback"), // real-time feedback for user messages
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Evaluation Results table for the 10 features
export const aiEvaluationResults = pgTable("ai_evaluation_results", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  // Feature 1: Overall Performance Score
  overallScore: numeric("overall_score", { precision: 3, scale: 2 }),
  overallRating: varchar("overall_rating", { length: 50 }), // "Competent", "Needs Practice", etc.
  // Feature 2: Key Performance Indicators
  communicationScore: numeric("communication_score", { precision: 3, scale: 2 }),
  empathyScore: numeric("empathy_score", { precision: 3, scale: 2 }),
  problemSolvingScore: numeric("problem_solving_score", { precision: 3, scale: 2 }),
  culturalAlignmentScore: numeric("cultural_alignment_score", { precision: 3, scale: 2 }),
  // Feature 3: Qualitative Observations
  qualitativeObservations: text("qualitative_observations"),
  strengths: jsonb("strengths"), // array of strings
  improvementAreas: jsonb("improvement_areas"), // array of strings
  // Feature 4: Actionable Insights
  actionableInsights: jsonb("actionable_insights"), // array of specific recommendations
  // Feature 5: Personalized Drills
  personalizedDrills: jsonb("personalized_drills"), // array of drill recommendations
  // Feature 6: Self-Reflection Prompts
  reflectionPrompts: jsonb("reflection_prompts"), // array of open-ended questions
  // Feature 7: AI Coach reflection summary (will be updated when user reflects)
  coachReflectionSummary: text("coach_reflection_summary"),
  // Feature 8: Share Progress data
  shareableData: jsonb("shareable_data"), // anonymized performance summary
  // Feature 9: Performance Badge
  badgeEarned: varchar("badge_earned", { length: 100 }),
  // Feature 10: Gamification rewards
  pointsEarned: integer("points_earned").default(0),
  rewardsUnlocked: jsonb("rewards_unlocked"), // array of rewards
  // Metadata
  evaluationLanguage: varchar("evaluation_language", { length: 10 }).default("en"),
  culturalContext: varchar("cultural_context", { length: 50 }), // SEA cultural adaptation
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdScenarios: many(interviewScenarios),
  interviewSessions: many(interviewSessions),
}));

export const interviewScenariosRelations = relations(interviewScenarios, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [interviewScenarios.createdBy],
    references: [users.id],
  }),
  sessions: many(interviewSessions),
}));

export const interviewSessionsRelations = relations(interviewSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [interviewSessions.userId],
    references: [users.id],
  }),
  scenario: one(interviewScenarios, {
    fields: [interviewSessions.scenarioId],
    references: [interviewScenarios.id],
  }),
  messages: many(interviewMessages),
  evaluation: one(aiEvaluationResults),
}));

export const interviewMessagesRelations = relations(interviewMessages, ({ one }) => ({
  session: one(interviewSessions, {
    fields: [interviewMessages.sessionId],
    references: [interviewSessions.id],
  }),
}));

export const aiEvaluationResultsRelations = relations(aiEvaluationResults, ({ one }) => ({
  session: one(interviewSessions, {
    fields: [aiEvaluationResults.sessionId],
    references: [interviewSessions.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
});

export const insertInterviewScenarioSchema = createInsertSchema(interviewScenarios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInterviewSessionSchema = createInsertSchema(interviewSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  scenarioId: z.string().min(1), // Accept any string, not just UUID
});

export const insertInterviewMessageSchema = createInsertSchema(interviewMessages).omit({
  id: true,
  createdAt: true,
});

export const insertAiEvaluationResultSchema = createInsertSchema(aiEvaluationResults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertInterviewScenario = z.infer<typeof insertInterviewScenarioSchema>;
export type InterviewScenario = typeof interviewScenarios.$inferSelect;
export type InsertInterviewSession = z.infer<typeof insertInterviewSessionSchema>;
export type InterviewSession = typeof interviewSessions.$inferSelect;
export type InsertInterviewMessage = z.infer<typeof insertInterviewMessageSchema>;
export type InterviewMessage = typeof interviewMessages.$inferSelect;
export type InsertAiEvaluationResult = z.infer<typeof insertAiEvaluationResultSchema>;
export type AiEvaluationResult = typeof aiEvaluationResults.$inferSelect;

// Extended types for API responses
export type InterviewSessionWithScenario = InterviewSession & {
  scenario: InterviewScenario;
  messages: InterviewMessage[];
  evaluation?: AiEvaluationResult;
};

export type InterviewScenarioWithStats = InterviewScenario & {
  sessionCount: number;
  averageRating: number;
};

// Additional types for prepare module
export type InterviewType = 'phone-screening' | 'functional-team' | 'hiring-manager' | 'subject-matter-expertise' | 'executive-final';

export type InterviewStage = 'setup' | 'practice' | 'evaluation' | 'complete';

export interface JobDescription {
  id: string;
  userId: string;
  fileName: string;
  content: string;
  uploadedAt: Date;
  fileSize?: number;
  fileUrl?: string;
}

export interface Question {
  id: string;
  text: string;
  question?: string; // alias for text
  category?: string;
  difficulty?: number;
  tags?: string[];
}

export interface Response {
  id: string;
  questionId: string;
  text: string;
  responseText?: string; // alias for text
  timestamp: Date;
}

export interface Session {
  id: string;
  userId: string;
  stage: InterviewStage;
  interviewType: InterviewType;
  position: string;
  company: string;
  industry?: string;
  language: string;
  totalQuestions: number;
  currentQuestion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface STARComponentScoring {
  situation: number;
  task: number;
  action: number;
  result: number;
}

// ===========================================
// PREPARE MODULE SPECIFIC TABLES
// ===========================================

// Preparation sessions table
export const preparationSessions = pgTable("preparation_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  jobPosition: varchar("job_position", { length: 200 }),
  companyName: varchar("company_name", { length: 200 }),
  targetInterviewDate: timestamp("target_interview_date"),
  interviewStage: varchar("interview_stage", { length: 50 }), // phone-screening, functional-team, etc.
  preferredLanguage: varchar("preferred_language", { length: 10 }).default("en"),
  status: varchar("status", { length: 20 }).default("active"), // active, completed, paused
  overallProgress: numeric("overall_progress", { precision: 5, scale: 2 }).default("0"), // 0-100%
  studyPlanId: uuid("study_plan_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI-generated study plans table
export const studyPlans = pgTable("study_plans", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  preparationSessionId: uuid("preparation_session_id").notNull().references(() => preparationSessions.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  totalWeeks: integer("total_weeks").default(2),
  targetSkills: jsonb("target_skills"), // array of skills to focus on
  dailyTimeCommitment: integer("daily_time_commitment").default(60), // minutes per day
  milestones: jsonb("milestones"), // array of milestone objects
  generatedContent: jsonb("generated_content"), // AI-generated plan structure
  customizations: jsonb("customizations"), // user customizations
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Preparation resources library
export const preparationResources = pgTable("preparation_resources", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  resourceType: varchar("resource_type", { length: 50 }).notNull(), // article, video, template, checklist, example
  category: varchar("category", { length: 100 }).notNull(), // star-method, company-research, behavioral, etc.
  interviewStage: varchar("interview_stage", { length: 50 }), // applicable interview stage
  industry: varchar("industry", { length: 100 }), // specific industry focus
  content: text("content").notNull(),
  aiGenerated: boolean("ai_generated").default(false),
  language: varchar("language", { length: 10 }).default("en"),
  tags: jsonb("tags"), // array of tags for filtering
  difficulty: varchar("difficulty", { length: 20 }), // beginner, intermediate, advanced
  estimatedReadTime: integer("estimated_read_time"), // minutes
  popularity: integer("popularity").default(0),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User progress tracking for preparation activities
export const preparationProgress = pgTable("preparation_progress", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  preparationSessionId: uuid("preparation_session_id").notNull().references(() => preparationSessions.id, { onDelete: "cascade" }),
  activityType: varchar("activity_type", { length: 50 }).notNull(), // resource-read, practice-test, star-practice, etc.
  activityId: varchar("activity_id", { length: 255 }), // reference to specific activity
  status: varchar("status", { length: 20 }).default("not_started"), // not_started, in_progress, completed
  progress: numeric("progress", { precision: 5, scale: 2 }).default("0"), // 0-100%
  timeSpent: integer("time_spent").default(0), // minutes spent
  score: numeric("score", { precision: 3, scale: 2 }), // for assessments
  notes: text("notes"), // user notes
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Practice tests and skill assessments
export const practiceTests = pgTable("practice_tests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  testType: varchar("test_type", { length: 50 }).notNull(), // star-method, behavioral, situational, etc.
  interviewStage: varchar("interview_stage", { length: 50 }),
  industry: varchar("industry", { length: 100 }),
  questions: jsonb("questions").notNull(), // array of question objects
  totalQuestions: integer("total_questions").notNull(),
  timeLimit: integer("time_limit"), // minutes (null for untimed)
  passingScore: numeric("passing_score", { precision: 3, scale: 2 }), // minimum score to pass
  difficulty: varchar("difficulty", { length: 20 }), // beginner, intermediate, advanced
  tags: jsonb("tags"), // array of tags
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Practice test results
export const practiceTestResults = pgTable("practice_test_results", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  practiceTestId: uuid("practice_test_id").notNull().references(() => practiceTests.id, { onDelete: "cascade" }),
  preparationSessionId: uuid("preparation_session_id").references(() => preparationSessions.id, { onDelete: "cascade" }),
  score: numeric("score", { precision: 3, scale: 2 }).notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  timeSpent: integer("time_spent"), // minutes
  answers: jsonb("answers").notNull(), // array of answer objects
  feedback: jsonb("feedback"), // detailed feedback for each question
  passed: boolean("passed").notNull(),
  strengths: jsonb("strengths"), // identified strengths
  improvementAreas: jsonb("improvement_areas"), // areas for improvement
  completedAt: timestamp("completed_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Company research data
export const companyResearch = pgTable("company_research", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  companySize: varchar("company_size", { length: 50 }), // startup, small, medium, large, enterprise
  headquarters: varchar("headquarters", { length: 100 }),
  website: varchar("website", { length: 255 }),
  description: text("description"),
  keyProducts: jsonb("key_products"), // array of products/services
  recentNews: jsonb("recent_news"), // array of news items
  leadership: jsonb("leadership"), // array of key leaders
  culture: jsonb("culture"), // cultural insights
  values: jsonb("values"), // company values
  financialInfo: jsonb("financial_info"), // financial data
  competitors: jsonb("competitors"), // array of competitors
  industryTrends: jsonb("industry_trends"), // relevant industry trends
  interviewInsights: jsonb("interview_insights"), // specific interview insights
  aiGenerated: boolean("ai_generated").default(false),
  sources: jsonb("sources"), // array of data sources
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// STAR method practice sessions
export const starPracticeSessions = pgTable("star_practice_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  preparationSessionId: uuid("preparation_session_id").references(() => preparationSessions.id, { onDelete: "cascade" }),
  scenario: text("scenario").notNull(), // the practice scenario
  userResponse: jsonb("user_response").notNull(), // STAR components provided by user
  aiAnalysis: jsonb("ai_analysis"), // AI analysis of the response
  scores: jsonb("scores"), // STAR component scores
  feedback: text("feedback"), // detailed feedback
  suggestions: jsonb("suggestions"), // improvement suggestions
  status: varchar("status", { length: 20 }).default("completed"), // draft, completed
  language: varchar("language", { length: 10 }).default("en"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for prepare module tables
export const preparationSessionsRelations = relations(preparationSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [preparationSessions.userId],
    references: [users.id],
  }),
  studyPlan: one(studyPlans, {
    fields: [preparationSessions.studyPlanId],
    references: [studyPlans.id],
  }),
  progressEntries: many(preparationProgress),
  starPracticeSessions: many(starPracticeSessions),
}));

export const studyPlansRelations = relations(studyPlans, ({ one }) => ({
  preparationSession: one(preparationSessions, {
    fields: [studyPlans.preparationSessionId],
    references: [preparationSessions.id],
  }),
}));

export const preparationResourcesRelations = relations(preparationResources, ({ one }) => ({
  createdBy: one(users, {
    fields: [preparationResources.createdBy],
    references: [users.id],
  }),
}));

export const preparationProgressRelations = relations(preparationProgress, ({ one }) => ({
  user: one(users, {
    fields: [preparationProgress.userId],
    references: [users.id],
  }),
  preparationSession: one(preparationSessions, {
    fields: [preparationProgress.preparationSessionId],
    references: [preparationSessions.id],
  }),
}));

export const practiceTestsRelations = relations(practiceTests, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [practiceTests.createdBy],
    references: [users.id],
  }),
  results: many(practiceTestResults),
}));

export const practiceTestResultsRelations = relations(practiceTestResults, ({ one }) => ({
  user: one(users, {
    fields: [practiceTestResults.userId],
    references: [users.id],
  }),
  practiceTest: one(practiceTests, {
    fields: [practiceTestResults.practiceTestId],
    references: [practiceTests.id],
  }),
  preparationSession: one(preparationSessions, {
    fields: [practiceTestResults.preparationSessionId],
    references: [preparationSessions.id],
  }),
}));

export const companyResearchRelations = relations(companyResearch, ({ one }) => ({
  user: one(users, {
    fields: [companyResearch.userId],
    references: [users.id],
  }),
}));

export const starPracticeSessionsRelations = relations(starPracticeSessions, ({ one }) => ({
  user: one(users, {
    fields: [starPracticeSessions.userId],
    references: [users.id],
  }),
  preparationSession: one(preparationSessions, {
    fields: [starPracticeSessions.preparationSessionId],
    references: [preparationSessions.id],
  }),
}));

// Insert schemas for prepare module
export const insertPreparationSessionSchema = createInsertSchema(preparationSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudyPlanSchema = createInsertSchema(studyPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPreparationResourceSchema = createInsertSchema(preparationResources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPreparationProgressSchema = createInsertSchema(preparationProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPracticeTestSchema = createInsertSchema(practiceTests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPracticeTestResultSchema = createInsertSchema(practiceTestResults).omit({
  id: true,
  createdAt: true,
});

export const insertCompanyResearchSchema = createInsertSchema(companyResearch).omit({
  id: true,
  createdAt: true,
});

export const insertStarPracticeSessionSchema = createInsertSchema(starPracticeSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for prepare module
export type PreparationSession = typeof preparationSessions.$inferSelect;
export type InsertPreparationSession = z.infer<typeof insertPreparationSessionSchema>;
export type StudyPlan = typeof studyPlans.$inferSelect;
export type InsertStudyPlan = z.infer<typeof insertStudyPlanSchema>;
export type PreparationResource = typeof preparationResources.$inferSelect;
export type InsertPreparationResource = z.infer<typeof insertPreparationResourceSchema>;
export type PreparationProgress = typeof preparationProgress.$inferSelect;
export type InsertPreparationProgress = z.infer<typeof insertPreparationProgressSchema>;
export type PracticeTest = typeof practiceTests.$inferSelect;
export type InsertPracticeTest = z.infer<typeof insertPracticeTestSchema>;
export type PracticeTestResult = typeof practiceTestResults.$inferSelect;
export type InsertPracticeTestResult = z.infer<typeof insertPracticeTestResultSchema>;
export type CompanyResearch = typeof companyResearch.$inferSelect;
export type InsertCompanyResearch = z.infer<typeof insertCompanyResearchSchema>;
export type StarPracticeSession = typeof starPracticeSessions.$inferSelect;
export type InsertStarPracticeSession = z.infer<typeof insertStarPracticeSessionSchema>;

// Extended types for API responses
export type PreparationSessionWithDetails = PreparationSession & {
  studyPlan?: StudyPlan;
  progressEntries?: PreparationProgress[];
  companyResearch?: CompanyResearch;
};

export type StudyPlanWithProgress = StudyPlan & {
  completedMilestones: number;
  totalMilestones: number;
  progressPercentage: number;
};

export type PracticeTestWithResults = PracticeTest & {
  lastResult?: PracticeTestResult;
  averageScore?: number;
  attemptCount?: number;
};
