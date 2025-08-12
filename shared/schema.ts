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
  scenarioId: uuid("scenario_id").notNull().references(() => interviewScenarios.id),
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
  sessionId: uuid("session_id").notNull().references(() => interviewSessions.id, { onDelete: "cascade" }),
  messageType: varchar("message_type", { length: 20 }).notNull(), // ai, user
  content: text("content").notNull(),
  questionNumber: integer("question_number"),
  timestamp: timestamp("timestamp").defaultNow(),
  feedback: text("feedback"), // real-time feedback for user messages
  createdAt: timestamp("created_at").defaultNow(),
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
}));

export const interviewMessagesRelations = relations(interviewMessages, ({ one }) => ({
  session: one(interviewSessions, {
    fields: [interviewMessages.sessionId],
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
});

export const insertInterviewMessageSchema = createInsertSchema(interviewMessages).omit({
  id: true,
  createdAt: true,
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

// Extended types for API responses
export type InterviewSessionWithScenario = InterviewSession & {
  scenario: InterviewScenario;
  messages: InterviewMessage[];
};

export type InterviewScenarioWithStats = InterviewScenario & {
  sessionCount: number;
  averageRating: number;
};

// Assessment tables for Perform module - Enhanced based on team requirements
export const assessments = pgTable("assessments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid("session_id").notNull().references(() => interviewSessions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Core Performance Indicators (KPIs) - Visual representation scores
  communicationScore: integer("communication_score").notNull(),
  empathyScore: integer("empathy_score").notNull(),
  problemSolvingScore: integer("problem_solving_score").notNull(),
  culturalAlignmentScore: integer("cultural_alignment_score").notNull(),
  
  // Overall Performance Score Rating
  overallScore: varchar("overall_score").notNull(),
  overallRating: varchar("overall_rating", { length: 20 }).notNull(), // "Competent", "Needs Practice", etc.
  
  // Qualitative Observations - AI-generated summary
  strengths: text("strengths").notNull(),
  improvementAreas: text("improvement_areas").notNull(),
  qualitativeObservations: text("qualitative_observations").notNull(),
  
  // Actionable Insights - Personalized recommendations
  actionableInsights: text("actionable_insights").notNull(),
  starMethodRecommendations: text("star_method_recommendations"),
  
  // Personalized Drills - Links to targeted practice
  personalizedDrills: jsonb("personalized_drills").notNull(), // Array of drill recommendations
  
  // Self-Reflection Integration
  selfReflectionPrompts: jsonb("self_reflection_prompts"), // AI-generated reflection questions
  
  // Progress Tracking
  performanceBadge: varchar("performance_badge", { length: 50 }), // Achievement badge
  progressLevel: integer("progress_level").default(1), // Learning progression level
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI-Generated Simulation Questions based on job role and company
export const simulationQuestions = pgTable("simulation_questions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  jobRole: varchar("job_role", { length: 100 }).notNull(),
  companyName: varchar("company_name", { length: 100 }).notNull(),
  questionType: varchar("question_type", { length: 50 }).notNull(), // "behavioral", "technical", "situational"
  question: text("question").notNull(),
  context: text("context"), // Additional context for the question
  expectedOutcomes: jsonb("expected_outcomes"), // What good answers should include
  difficultyLevel: integer("difficulty_level").default(3), // 1-5 scale
  generatedAt: timestamp("generated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Performance Indicators Tracking
export const performanceIndicators = pgTable("performance_indicators", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: uuid("assessment_id").notNull().references(() => assessments.id),
  indicatorType: varchar("indicator_type", { length: 50 }).notNull(),
  score: integer("score").notNull(),
  description: text("description").notNull(),
  visualData: jsonb("visual_data"), // Data for radar charts, bar charts, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Personalized Learning Drills
export const learningDrills = pgTable("learning_drills", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: uuid("assessment_id").notNull().references(() => assessments.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  drillType: varchar("drill_type", { length: 50 }).notNull(), // "star_method", "communication", etc.
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  scenario: text("scenario").notNull(),
  targetSkill: varchar("target_skill", { length: 100 }).notNull(),
  estimatedDuration: integer("estimated_duration"), // in minutes
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const performanceTrends = pgTable("performance_trends", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  criteriaName: varchar("criteria_name", { length: 50 }).notNull(),
  scores: jsonb("scores").notNull(), // Array of historical scores with dates
  trend: varchar("trend", { length: 20 }).notNull(), // "improving", "stable", "declining"
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Assessment relations - Updated for new schema
export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  user: one(users, {
    fields: [assessments.userId],
    references: [users.id],
  }),
  session: one(interviewSessions, {
    fields: [assessments.sessionId],
    references: [interviewSessions.id],
  }),
  indicators: many(performanceIndicators),
  drills: many(learningDrills),
}));

export const performanceIndicatorsRelations = relations(performanceIndicators, ({ one }) => ({
  assessment: one(assessments, {
    fields: [performanceIndicators.assessmentId],
    references: [assessments.id],
  }),
}));

export const learningDrillsRelations = relations(learningDrills, ({ one }) => ({
  assessment: one(assessments, {
    fields: [learningDrills.assessmentId],
    references: [assessments.id],
  }),
  user: one(users, {
    fields: [learningDrills.userId],
    references: [users.id],
  }),
}));

export const simulationQuestionsRelations = relations(simulationQuestions, ({ many }) => ({
  // Can be linked to sessions if needed
}));

export const performanceTrendsRelations = relations(performanceTrends, ({ one }) => ({
  user: one(users, {
    fields: [performanceTrends.userId],
    references: [users.id],
  }),
}));

// Insert schemas for new assessment system
export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  assessmentDate: true,
  createdAt: true,
});

export const insertSimulationQuestionSchema = createInsertSchema(simulationQuestions).omit({
  id: true,
  generatedAt: true,
  createdAt: true,
});

export const insertPerformanceIndicatorSchema = createInsertSchema(performanceIndicators).omit({
  id: true,
  createdAt: true,
});

export const insertLearningDrillSchema = createInsertSchema(learningDrills).omit({
  id: true,
  completedAt: true,
  createdAt: true,
});

// Assessment types
export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type SimulationQuestion = typeof simulationQuestions.$inferSelect;
export type InsertSimulationQuestion = z.infer<typeof insertSimulationQuestionSchema>;
export type PerformanceIndicator = typeof performanceIndicators.$inferSelect;
export type InsertPerformanceIndicator = z.infer<typeof insertPerformanceIndicatorSchema>;
export type LearningDrill = typeof learningDrills.$inferSelect;
export type InsertLearningDrill = z.infer<typeof insertLearningDrillSchema>;
export type PerformanceTrend = typeof performanceTrends.$inferSelect;

// Extended assessment types for new system
export type AssessmentWithDetails = Assessment & {
  indicators: PerformanceIndicator[];
  drills: LearningDrill[];
  session: InterviewSession & {
    scenario: InterviewScenario;
  };
};

export type UserPerformanceOverview = {
  user: User;
  totalAssessments: number;
  averageScore: number;
  currentRating: string;
  strongestIndicator: string;
  weakestIndicator: string;
  recentTrend: string;
  progressLevel: number;
  completedDrills: number;
  availableDrills: number;
  performanceBadges: string[];
  assessments: Assessment[];
};

export type SimulationRequest = {
  jobRole: string;
  companyName: string;
  questionCount: number;
  difficultyLevel: number;
  questionTypes: string[];
};
