import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  stage: text("stage").notNull(), // 'setup', 'stage-selection', 'preparation', 'review', 'complete'
  currentQuestionIndex: integer("current_question_index").default(0),
  totalQuestions: integer("total_questions").default(12),
  interviewType: text("interview_type"), // 'phone-screening', 'functional-team', 'hiring-manager', 'subject-matter-expertise', 'executive-final'
  position: text("position"),
  company: text("company"),
  industry: text("industry"), // Specific industry for Stage 4 (subject-matter-expertise)
  jobDescriptionId: varchar("job_description_id"), // Reference to uploaded JD
  responses: jsonb("responses").default([]), // Array of question responses
  evaluationScores: jsonb("evaluation_scores").default({}), // Star ratings for criteria
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const jobDescriptions = pgTable("job_descriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(), // URL to stored file
  extractedText: text("extracted_text"), // Extracted text content for AI processing
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'phone-screening', 'functional-team', 'hiring-manager', 'subject-matter-expertise', 'executive-final'
  question: text("question").notNull(),
  tags: jsonb("tags").default([]), // Array of skill tags
  difficulty: text("difficulty").notNull(), // 'easy', 'medium', 'hard'
  starGuidance: jsonb("star_guidance").default({}), // STAR framework guidance
  industry: text("industry"), // Specific industry from the 50 industries list
});

export const responses = pgTable("responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => sessions.id).notNull(),
  questionId: varchar("question_id").references(() => questions.id).notNull(),
  responseText: text("response_text"),
  responseAudio: text("response_audio"), // URL to audio file
  inputMode: text("input_mode").notNull(), // 'text' or 'voice'
  feedback: jsonb("feedback").default({}), // AI-generated feedback
  evaluationScores: jsonb("evaluation_scores").default({}), // Individual question scores
  timeSpent: integer("time_spent"), // seconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const wgllContent = pgTable("wgll_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").references(() => questions.id).notNull(),
  modelAnswer: text("model_answer").notNull(),
  expertTips: jsonb("expert_tips").default([]), // Array of tips
  performanceMetrics: jsonb("performance_metrics").default({}),
});

// Insert schemas
export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  jobDescriptionId: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
}).extend({
  industry: z.string().nullable().optional(),
});

export const insertResponseSchema = createInsertSchema(responses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWgllContentSchema = createInsertSchema(wgllContent).omit({
  id: true,
});

export const insertJobDescriptionSchema = createInsertSchema(jobDescriptions).omit({
  id: true,
  uploadedAt: true,
});

// Types
export type Session = typeof sessions.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Response = typeof responses.$inferSelect;
export type WgllContent = typeof wgllContent.$inferSelect;
export type JobDescription = typeof jobDescriptions.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertResponse = z.infer<typeof insertResponseSchema>;
export type InsertWgllContent = z.infer<typeof insertWgllContentSchema>;
export type InsertJobDescription = z.infer<typeof insertJobDescriptionSchema>;

// Additional types for frontend
export type InterviewStage = 'setup' | 'stage-selection' | 'preparation' | 'review' | 'complete';
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

// STAR-focused evaluation alternatives
export type STARComponentScoring = {
  situation: number;    // 1-5: How well they set the scene with relevant context
  task: number;         // 1-5: How clearly they explained their responsibility/objective
  action: number;       // 1-5: How specifically they described what they did
  result: number;       // 1-5: How well they quantified outcomes and impact
  overall: number;      // 1-5: Overall coherence and effectiveness of the STAR story
};

export type STARQualityMetrics = {
  contextClarity: number;      // How well situation provides necessary background
  responsibilityOwnership: number; // How clearly they defined their role/task
  actionSpecificity: number;   // Level of detail in actions taken
  resultQuantification: number; // Use of numbers, metrics, concrete outcomes
  storyCoherence: number;      // How well the story flows and connects
};

export type STARCompetencyScoring = {
  starStructure: number;       // 1-5: Follows STAR format effectively
  technicalDepth: number;      // 1-5: Demonstrates required technical skills
  problemSolving: number;      // 1-5: Shows analytical and solution-oriented thinking
  leadership: number;          // 1-5: Demonstrates leadership and influence
  communication: number;       // 1-5: Clear, engaging storytelling
};

export type STARGuidance = {
  situation: string;
  task: string;
  action: string;
  result: string;
};

export type FeedbackItem = {
  type: 'positive' | 'improvement';
  message: string;
};

export type SessionData = Session & {
  currentQuestion?: Question;
  allQuestions?: Question[];
  currentResponse?: Response;
};
