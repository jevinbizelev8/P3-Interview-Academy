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

// Prepare Module Schema Extensions
export const prepareSessions = pgTable("prepare_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: varchar("title").notNull(),
  status: varchar("status").notNull().default("in_progress"), // 'in_progress', 'completed', 'paused'
  sessionType: varchar("session_type").notNull().default("wgll_framework"), // 'wgll_framework', 'star_practice', etc.
  stage: varchar("stage").notNull(), // 'wonder', 'gather', 'link', 'launch' for WGLL
  currentQuestionIndex: integer("current_question_index").default(0),
  totalQuestions: integer("total_questions").default(12),
  interviewType: varchar("interview_type"), // 'phone-screening', 'functional-team', etc.
  position: varchar("position"),
  company: varchar("company"),
  industry: varchar("industry"), // For subject-matter-expertise stage
  jobDescriptionId: varchar("job_description_id"),
  responses: jsonb("responses").default([]),
  evaluationScores: jsonb("evaluation_scores").default({}),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const prepareQuestions = pgTable("prepare_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // interview type
  question: text("question").notNull(),
  tags: jsonb("tags").default([]),
  difficulty: varchar("difficulty").notNull(), // 'easy', 'medium', 'hard'
  starGuidance: jsonb("star_guidance").default({}),
  industry: varchar("industry"),
});

export const prepareResponses = pgTable("prepare_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => prepareSessions.id).notNull(),
  questionId: varchar("question_id").references(() => prepareQuestions.id).notNull(),
  responseText: text("response_text"),
  responseAudio: text("response_audio"),
  inputMode: varchar("input_mode").notNull(), // 'text' or 'voice'
  feedback: jsonb("feedback").default({}),
  evaluationScores: jsonb("evaluation_scores").default({}),
  timeSpent: integer("time_spent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const jobDescriptions = pgTable("job_descriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  fileName: varchar("file_name").notNull(),
  fileUrl: varchar("file_url").notNull(),
  extractedText: text("extracted_text"),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Insert schemas for Prepare module
export const insertPrepareSessionSchema = createInsertSchema(prepareSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPrepareQuestionSchema = createInsertSchema(prepareQuestions).omit({
  id: true,
});

export const insertPrepareResponseSchema = createInsertSchema(prepareResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobDescriptionSchema = createInsertSchema(jobDescriptions).omit({
  id: true,
  uploadedAt: true,
});

// Types for Prepare Module
export type PrepareSession = typeof prepareSessions.$inferSelect;
export type PrepareQuestion = typeof prepareQuestions.$inferSelect;
export type PrepareResponse = typeof prepareResponses.$inferSelect;
export type JobDescription = typeof jobDescriptions.$inferSelect;

export type InsertPrepareSession = z.infer<typeof insertPrepareSessionSchema>;
export type InsertPrepareQuestion = z.infer<typeof insertPrepareQuestionSchema>;
export type InsertPrepareResponse = z.infer<typeof insertPrepareResponseSchema>;
export type InsertJobDescription = z.infer<typeof insertJobDescriptionSchema>;

export type InterviewType = 'phone-screening' | 'functional-team' | 'hiring-manager' | 'subject-matter-expertise' | 'executive-final';
export type InputMode = 'text' | 'voice';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type EvaluationCriteria = {
  relevant: number;
  structured: number;
  specific: number;
  aligned: number;
  outcomeOrientated: number;
};

export type STARGuidance = {
  situation: string;
  task: string;
  action: string;
  result: string;
};
