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
  uniqueIndex,
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
  'zh-sg': '中文 (Chinese - Singapore)'
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Session storage table for express-session auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for authentication
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"), // For secure password authentication
  role: varchar("role").default("user"), // user, admin

  // Subscription and billing fields (NEW - Admin Subscription System)
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  planType: varchar("plan_type", { length: 20 }).default("FREE"), // FREE, PRO, ADVANCED
  subscriptionStatus: varchar("subscription_status", { length: 20 }), // active, canceled, past_due
  currentPeriodEnd: timestamp("current_period_end"),

  // Credit management fields (UPDATED - Admin Subscription System)
  accountTier: varchar("account_tier", { length: 50 }).default("free"), // DEPRECATED: Use planType instead
  monthlyCreditAllocation: integer("monthly_credit_allocation").default(50), // Monthly subscription credits (resets each cycle)
  creditBalance: integer("credit_balance").default(50), // Current available credits (subscription + top-up)
  topUpCredits: integer("top_up_credits").default(0), // One-time purchased credits (never expire)

  // Billing cycle tracking
  billingCycleStart: timestamp("billing_cycle_start"),
  billingCycleEnd: timestamp("billing_cycle_end"),

  // Email verification fields
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),

  // Password reset fields
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),

  // OAuth fields
  googleId: varchar("google_id").unique(),
  authProvider: varchar("auth_provider", { length: 20 }).default("local"), // 'local', 'google', 'both'

  // Gamification and referral fields (Redesign Phase 1)
  xpPoints: integer("xp_points").default(0),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastActivityDate: timestamp("last_activity_date"),
  readinessScore: integer("readiness_score").default(0),
  referralCode: varchar("referral_code", { length: 50 }).unique(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===========================================
// ADMIN SUBSCRIPTION SYSTEM TABLES
// ===========================================

// Subscriptions table - tracks user subscription lifecycle
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Plan details
  planType: varchar("plan_type", { length: 20 }).notNull(), // FREE, PRO, ADVANCED
  billingCycle: varchar("billing_cycle", { length: 20 }).default("monthly"), // monthly (future: quarterly, annual)
  monthlyCredits: integer("monthly_credits").notNull(),
  pricePerMonth: numeric("price_per_month", { precision: 10, scale: 2 }).notNull(),

  // Status and lifecycle
  status: varchar("status", { length: 20 }).default("active"), // active, canceled, past_due
  nextRenewalDate: timestamp("next_renewal_date"),
  autoRenew: boolean("auto_renew").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Credit transactions table - audit log for all credit changes
export const creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Transaction details
  transactionType: varchar("transaction_type", { length: 30 }).notNull(), // consumption, allocation, top-up, admin-adjustment
  creditsAmount: integer("credits_amount").notNull(), // Can be negative for consumption
  balanceAfter: integer("balance_after").notNull(),
  description: text("description").notNull(),

  // Context
  featureUsed: varchar("feature_used", { length: 100 }), // e.g., "practice-session", "prepare-session"
  relatedSessionId: uuid("related_session_id"), // Link to practice/prepare session

  createdAt: timestamp("created_at").defaultNow(),
});

// Invoices table - tracks billing and payment history
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),

  // Invoice details
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).unique().notNull(),
  billingPeriodStart: timestamp("billing_period_start").notNull(),
  billingPeriodEnd: timestamp("billing_period_end").notNull(),

  // Status and payment
  status: varchar("status", { length: 20 }).default("pending"), // paid, pending, failed
  stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 }),
  pdfUrl: varchar("pdf_url", { length: 500 }),

  createdAt: timestamp("created_at").defaultNow(),
  paidAt: timestamp("paid_at"),
});

// Credit costs configuration table - admin-configurable pricing per feature
export const creditCosts = pgTable("credit_costs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

  // Feature configuration
  featureName: varchar("feature_name", { length: 100 }).unique().notNull(), // "practice-session", "prepare-session"
  creditCost: integer("credit_cost").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),

  // Audit trail
  updatedBy: uuid("updated_by").references(() => users.id), // Admin who last changed it

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===========================================
// REDESIGN GAMIFICATION & LEARNING TABLES
// ===========================================

export const jobDescriptions = pgTable("job_descriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }),
  fileSizeBytes: integer("file_size_bytes"),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const badges = pgTable("badges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description").notNull(),
  iconName: varchar("icon_name", { length: 50 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  requirementType: varchar("requirement_type", { length: 50 }).notNull(),
  requirementValue: integer("requirement_value").notNull(),
  requirementCriteria: jsonb("requirement_criteria"),
  xpReward: integer("xp_reward").default(0),
  rarity: varchar("rarity", { length: 20 }).default("common"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userBadges = pgTable(
  "user_badges",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    badgeId: uuid("badge_id").notNull().references(() => badges.id, { onDelete: "cascade" }),
    progress: integer("progress").default(0),
    earnedDate: timestamp("earned_date"),
    isClaimed: boolean("is_claimed").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    uniqueUserBadge: uniqueIndex("user_badges_user_id_badge_id_key").on(
      table.userId,
      table.badgeId,
    ),
  }),
);

export const learningModules = pgTable(
  "learning_modules",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    stage: varchar("stage", { length: 50 }).notNull(),
    moduleNumber: integer("module_number").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull(),
    moduleType: varchar("module_type", { length: 50 }).notNull(),
    componentName: varchar("component_name", { length: 100 }),
    estimatedMinutes: integer("estimated_minutes").default(15),
    difficulty: varchar("difficulty", { length: 20 }).default("beginner"),
    xpReward: integer("xp_reward").default(10),
    creditCost: integer("credit_cost").default(0),
    prerequisites: jsonb("prerequisites"),
    learningObjectives: jsonb("learning_objectives"),
    content: jsonb("content"),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    uniqueStageModule: uniqueIndex("learning_modules_stage_module_number_key").on(
      table.stage,
      table.moduleNumber,
    ),
  }),
);

export const userModuleProgress = pgTable(
  "user_module_progress",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    moduleId: uuid("module_id").notNull().references(() => learningModules.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at").defaultNow(),
    completedAt: timestamp("completed_at"),
    isCompleted: boolean("is_completed").default(false),
    timeSpentMinutes: integer("time_spent_minutes").default(0),
    score: integer("score"),
    userData: jsonb("user_data"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    uniqueUserModule: uniqueIndex("user_module_progress_user_id_module_id_key").on(
      table.userId,
      table.moduleId,
    ),
  }),
);

export const selfIntroDrafts = pgTable(
  "self_intro_drafts",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    stepNumber: integer("step_number").notNull(),
    stepData: jsonb("step_data").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    uniqueUserStep: uniqueIndex("self_intro_drafts_user_id_step_number_key").on(
      table.userId,
      table.stepNumber,
    ),
  }),
);

export const selfIntros = pgTable("self_intros", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  version: integer("version").default(1),
  script: text("script").notNull(),
  videoUrl: varchar("video_url", { length: 500 }),
  videoDurationSeconds: integer("video_duration_seconds"),
  aiFeedback: jsonb("ai_feedback"),
  overallScore: integer("overall_score"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const resumes = pgTable("resumes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  fileSizeBytes: integer("file_size_bytes"),
  parsedContent: text("parsed_content"),
  aiAnalysis: jsonb("ai_analysis"),
  atsScore: integer("ats_score"),
  jdMatchPercentage: integer("jd_match_percentage"),
  jobDescriptionId: uuid("job_description_id").references(() => jobDescriptions.id),
  keywords: jsonb("keywords"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const resumeAnalysisHistory = pgTable("resume_analysis_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  resumeId: uuid("resume_id").notNull().references(() => resumes.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  strengths: jsonb("strengths").notNull(),
  gaps: jsonb("gaps").notNull(),
  keywordsMatched: jsonb("keywords_matched"),
  atsTips: jsonb("ats_tips"),
  jobDescriptionId: uuid("job_description_id").references(() => jobDescriptions.id),
  modelVersion: varchar("model_version", { length: 50 }).notNull(),
  promptHash: varchar("prompt_hash", { length: 64 }).notNull(),
  responseHash: varchar("response_hash", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const starStories = pgTable("star_stories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  situation: text("situation").notNull(),
  task: text("task").notNull(),
  action: text("action").notNull(),
  result: text("result").notNull(),
  tags: jsonb("tags"),
  aiFeedback: jsonb("ai_feedback"),
  overallScore: integer("overall_score"),
  isFavorite: boolean("is_favorite").default(false),
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const actualInterviews = pgTable("actual_interviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  position: varchar("position", { length: 200 }).notNull(),
  jobDescription: text("job_description"),
  interviewDate: timestamp("interview_date").notNull(),
  interviewType: varchar("interview_type", { length: 50 }),
  stage: varchar("stage", { length: 50 }),
  outcome: varchar("outcome", { length: 50 }),
  confidenceLevel: integer("confidence_level"),
  notes: text("notes"),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reflectionJournals = pgTable("reflection_journals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  practiceSessionId: uuid("practice_session_id").references(() => practiceSessions.id, { onDelete: "set null" }),
  strengths: text("strengths").notNull(),
  improvements: text("improvements").notNull(),
  actionItems: text("action_items"),
  overallFeeling: varchar("overall_feeling", { length: 50 }),
  moodScore: integer("mood_score"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: uuid("referrer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referralCode: varchar("referral_code", { length: 50 }).notNull(),
  referredEmail: varchar("referred_email", { length: 255 }).notNull(),
  referredUserId: uuid("referred_user_id").references(() => users.id, { onDelete: "set null" }),
  status: varchar("status", { length: 50 }).default("pending"),
  rewardType: varchar("reward_type", { length: 50 }),
  rewardValue: integer("reward_value"),
  rewardGiven: boolean("reward_given").default(false),
  referredAt: timestamp("referred_at").defaultNow(),
  signedUpAt: timestamp("signed_up_at"),
  rewardGivenAt: timestamp("reward_given_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  feedbackType: varchar("feedback_type", { length: 50 }).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  pageUrl: varchar("page_url", { length: 500 }),
  browserInfo: jsonb("browser_info"),
  screenshotUrl: varchar("screenshot_url", { length: 500 }),
  status: varchar("status", { length: 50 }).default("open"),
  priority: varchar("priority", { length: 20 }).default("normal"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ticketNumber: varchar("ticket_number", { length: 50 }).notNull().unique(),
  category: varchar("category", { length: 50 }).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 50 }).default("open"),
  priority: varchar("priority", { length: 20 }).default("normal"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===========================================
// INTERVIEW MODULE TABLES
// ===========================================

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
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Interview sessions table
export const interviewSessions = pgTable("interview_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
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
  overallScore: numeric("overall_score", { precision: 5, scale: 2 }),
  situationScore: numeric("situation_score", { precision: 5, scale: 2 }),
  taskScore: numeric("task_score", { precision: 5, scale: 2 }),
  actionScore: numeric("action_score", { precision: 5, scale: 2 }),
  resultScore: numeric("result_score", { precision: 5, scale: 2 }),
  flowScore: numeric("flow_score", { precision: 5, scale: 2 }),
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

// AI Evaluation Results table with new 9-criteria rubric scoring
export const aiEvaluationResults = pgTable("ai_evaluation_results", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  
  // New 9-Criteria Interview Scoring Rubric (1-5 scale)
  // 1. Relevance of Response (15%)
  relevanceScore: numeric("relevance_score", { precision: 5, scale: 2 }),
  relevanceFeedback: text("relevance_feedback"),
  
  // 2. Structured using STAR Method (15%)
  starStructureScore: numeric("star_structure_score", { precision: 5, scale: 2 }),
  starStructureFeedback: text("star_structure_feedback"),
  
  // 3. Specific Evidence Usage (15%)
  specificEvidenceScore: numeric("specific_evidence_score", { precision: 5, scale: 2 }),
  specificEvidenceFeedback: text("specific_evidence_feedback"),
  
  // 4. Aligned with Role (15%)
  roleAlignmentScore: numeric("role_alignment_score", { precision: 5, scale: 2 }),
  roleAlignmentFeedback: text("role_alignment_feedback"),
  
  // 5. Outcome-Oriented (15%)
  outcomeOrientedScore: numeric("outcome_oriented_score", { precision: 5, scale: 2 }),
  outcomeOrientedFeedback: text("outcome_oriented_feedback"),
  
  // 6. Communication Skills (10%)
  communicationScore: numeric("communication_score", { precision: 5, scale: 2 }),
  communicationFeedback: text("communication_feedback"),
  
  // 7. Problem-Solving / Critical Thinking (10%)
  problemSolvingScore: numeric("problem_solving_score", { precision: 5, scale: 2 }),
  problemSolvingFeedback: text("problem_solving_feedback"),
  
  // 8. Cultural Fit / Values Alignment (5%)
  culturalFitScore: numeric("cultural_fit_score", { precision: 5, scale: 2 }),
  culturalFitFeedback: text("cultural_fit_feedback"),
  
  // 9. Learning Agility / Adaptability (5%)
  learningAgilityScore: numeric("learning_agility_score", { precision: 5, scale: 2 }),
  learningAgilityFeedback: text("learning_agility_feedback"),
  
  // Calculated weighted overall score (1-5 scale)
  weightedOverallScore: numeric("weighted_overall_score", { precision: 5, scale: 2 }),
  overallRating: varchar("overall_rating", { length: 50 }), // "Pass", "Borderline", "Fail"
  
  // Legacy fields for backwards compatibility (now derived from new rubric)
  empathyScore: numeric("empathy_score", { precision: 5, scale: 2 }),
  culturalAlignmentScore: numeric("cultural_alignment_score", { precision: 5, scale: 2 }),
  
  // Feature 1: Overall Performance Score (derived from weighted scores)
  overallScore: numeric("overall_score", { precision: 5, scale: 2 }),
  
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

// ===========================================
// PRACTICE MODULE TABLES
// ===========================================

// Practice sessions for interactive practice interviews
export const practiceSessions = pgTable("practice_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  scenarioId: varchar("scenario_id").notNull(), // Reference to interview scenario
  
  // Session Configuration
  jobPosition: varchar("job_position", { length: 200 }),
  companyName: varchar("company_name", { length: 200 }),
  interviewStage: varchar("interview_stage", { length: 100 }).notNull(),
  difficultyLevel: varchar("difficulty_level", { length: 20 }).default("intermediate"),
  preferredLanguage: varchar("preferred_language", { length: 10 }).default("en"),
  
  // Session State
  status: varchar("status", { length: 20 }).default("active"), // active, completed, abandoned
  currentQuestionNumber: integer("current_question_number").default(1),
  totalQuestions: integer("total_questions").default(25),
  
  // Session Timing
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  totalDuration: integer("total_duration"), // in seconds
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Practice messages for conversation flow
export const practiceMessages = pgTable("practice_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid("session_id").notNull().references(() => practiceSessions.id, { onDelete: "cascade" }),
  
  // Message Content
  messageType: varchar("message_type", { length: 20 }).notNull(), // "ai_question", "user_response"
  content: text("content").notNull(),
  questionNumber: integer("question_number"),
  
  // Message Metadata
  inputMethod: varchar("input_method", { length: 20 }).default("text"), // "text", "voice"
  language: varchar("language", { length: 10 }).default("en"),
  
  // Timing
  responseTime: integer("response_time"), // seconds for user responses
  timestamp: timestamp("timestamp").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Practice reports for end-of-session evaluation
export const practiceReports = pgTable("practice_reports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid("session_id").notNull().references(() => practiceSessions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  
  // Overall Evaluation
  overallScore: numeric("overall_score", { precision: 5, scale: 2 }),
  
  // 9-Criteria Official Rubric Scores (1-5 scale)
  relevanceScore: numeric("relevance_score", { precision: 5, scale: 2 }),              // 15% - Direct, focused answers
  starStructureScore: numeric("star_structure_score", { precision: 5, scale: 2 }),    // 15% - STAR method organization
  specificEvidenceScore: numeric("specific_evidence_score", { precision: 5, scale: 2 }), // 15% - Concrete examples with metrics
  roleAlignmentScore: numeric("role_alignment_score", { precision: 5, scale: 2 }),    // 15% - Job/company relevance
  outcomeOrientedScore: numeric("outcome_oriented_score", { precision: 5, scale: 2 }), // 15% - Measurable results focus
  communicationScore: numeric("communication_score", { precision: 5, scale: 2 }),     // 10% - Clear, professional tone
  problemSolvingScore: numeric("problem_solving_score", { precision: 5, scale: 2 }),  // 10% - Analytical thinking
  culturalFitScore: numeric("cultural_fit_score", { precision: 5, scale: 2 }),        // 5% - Teamwork, adaptability
  learningAgilityScore: numeric("learning_agility_score", { precision: 5, scale: 2 }), // 5% - Growth orientation
  
  // Legacy STAR Method Scoring (for backward compatibility)
  situationScore: numeric("situation_score", { precision: 5, scale: 2 }),
  taskScore: numeric("task_score", { precision: 5, scale: 2 }),
  actionScore: numeric("action_score", { precision: 5, scale: 2 }),
  resultScore: numeric("result_score", { precision: 5, scale: 2 }),
  
  // Qualitative Feedback
  strengths: jsonb("strengths").default("[]"), // array of strings
  weaknesses: jsonb("weaknesses").default("[]"), // array of strings
  improvements: jsonb("improvements").default("[]"), // array of improvement suggestions
  detailedFeedback: text("detailed_feedback"),
  
  // Performance Insights
  keyInsights: jsonb("key_insights").default("[]"),
  recommendedActions: jsonb("recommended_actions").default("[]"),
  
  // Report Metadata
  evaluatedBy: varchar("evaluated_by", { length: 50 }).default("ai"), // "ai", "manual"
  evaluationCompleted: boolean("evaluation_completed").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  // Subscription system relations
  subscriptions: many(subscriptions),
  creditTransactions: many(creditTransactions),
  invoices: many(invoices),
  updatedCreditCosts: many(creditCosts),
  jobDescriptions: many(jobDescriptions),
  userBadges: many(userBadges),
  moduleProgress: many(userModuleProgress),
  selfIntroDrafts: many(selfIntroDrafts),
  selfIntros: many(selfIntros),
  resumes: many(resumes),
  resumeAnalysisHistory: many(resumeAnalysisHistory),
  starStories: many(starStories),
  actualInterviews: many(actualInterviews),
  reflectionJournals: many(reflectionJournals),
  referralsSent: many(referrals, { relationName: "referrer" }),
  referralsReceived: many(referrals, { relationName: "referred" }),
  feedback: many(feedback),
  supportTickets: many(supportTickets),
  // Interview module relations
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

// Subscription system relations
export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  invoices: many(invoices),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [invoices.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const creditCostsRelations = relations(creditCosts, ({ one }) => ({
  updatedBy: one(users, {
    fields: [creditCosts.updatedBy],
    references: [users.id],
  }),
}));

export const jobDescriptionsRelations = relations(jobDescriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [jobDescriptions.userId],
    references: [users.id],
  }),
  resumes: many(resumes),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  progress: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

export const learningModulesRelations = relations(learningModules, ({ many }) => ({
  progress: many(userModuleProgress),
}));

export const userModuleProgressRelations = relations(userModuleProgress, ({ one }) => ({
  user: one(users, {
    fields: [userModuleProgress.userId],
    references: [users.id],
  }),
  module: one(learningModules, {
    fields: [userModuleProgress.moduleId],
    references: [learningModules.id],
  }),
}));

export const selfIntroDraftsRelations = relations(selfIntroDrafts, ({ one }) => ({
  user: one(users, {
    fields: [selfIntroDrafts.userId],
    references: [users.id],
  }),
}));

export const selfIntrosRelations = relations(selfIntros, ({ one }) => ({
  user: one(users, {
    fields: [selfIntros.userId],
    references: [users.id],
  }),
}));

export const resumesRelations = relations(resumes, ({ one, many }) => ({
  user: one(users, {
    fields: [resumes.userId],
    references: [users.id],
  }),
  jobDescription: one(jobDescriptions, {
    fields: [resumes.jobDescriptionId],
    references: [jobDescriptions.id],
  }),
  analysisHistory: many(resumeAnalysisHistory),
}));

export const resumeAnalysisHistoryRelations = relations(resumeAnalysisHistory, ({ one }) => ({
  resume: one(resumes, {
    fields: [resumeAnalysisHistory.resumeId],
    references: [resumes.id],
  }),
  user: one(users, {
    fields: [resumeAnalysisHistory.userId],
    references: [users.id],
  }),
  jobDescription: one(jobDescriptions, {
    fields: [resumeAnalysisHistory.jobDescriptionId],
    references: [jobDescriptions.id],
  }),
}));

export const starStoriesRelations = relations(starStories, ({ one }) => ({
  user: one(users, {
    fields: [starStories.userId],
    references: [users.id],
  }),
}));

export const actualInterviewsRelations = relations(actualInterviews, ({ one }) => ({
  user: one(users, {
    fields: [actualInterviews.userId],
    references: [users.id],
  }),
}));

export const reflectionJournalsRelations = relations(reflectionJournals, ({ one }) => ({
  user: one(users, {
    fields: [reflectionJournals.userId],
    references: [users.id],
  }),
  practiceSession: one(practiceSessions, {
    fields: [reflectionJournals.practiceSessionId],
    references: [practiceSessions.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: "referrer",
  }),
  referredUser: one(users, {
    fields: [referrals.referredUserId],
    references: [users.id],
    relationName: "referred",
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [supportTickets.assignedTo],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  passwordHash: true,
  role: true,
  emailVerified: true,
  emailVerificationToken: true,
  emailVerificationExpires: true,
  passwordResetToken: true,
  passwordResetExpires: true,
  googleId: true,
  authProvider: true,
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

// Subscription system insert schemas
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertCreditCostSchema = createInsertSchema(creditCosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobDescriptionSchema = createInsertSchema(jobDescriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLearningModuleSchema = createInsertSchema(learningModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserModuleProgressSchema = createInsertSchema(userModuleProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSelfIntroDraftSchema = createInsertSchema(selfIntroDrafts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSelfIntroSchema = createInsertSchema(selfIntros).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResumeSchema = createInsertSchema(resumes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResumeAnalysisHistorySchema = createInsertSchema(resumeAnalysisHistory).omit({
  id: true,
  createdAt: true,
});

export const insertStarStorySchema = createInsertSchema(starStories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActualInterviewSchema = createInsertSchema(actualInterviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReflectionJournalSchema = createInsertSchema(reflectionJournals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
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

// Subscription system types
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertCreditCost = z.infer<typeof insertCreditCostSchema>;
export type CreditCost = typeof creditCosts.$inferSelect;

export type InsertJobDescription = z.infer<typeof insertJobDescriptionSchema>;
export type JobDescriptionRecord = typeof jobDescriptions.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertLearningModule = z.infer<typeof insertLearningModuleSchema>;
export type LearningModule = typeof learningModules.$inferSelect;
export type InsertUserModuleProgress = z.infer<typeof insertUserModuleProgressSchema>;
export type UserModuleProgressRecord = typeof userModuleProgress.$inferSelect;
export type UserModuleProgress = UserModuleProgressRecord; // Alias for convenience
export type InsertSelfIntroDraft = z.infer<typeof insertSelfIntroDraftSchema>;
export type SelfIntroDraft = typeof selfIntroDrafts.$inferSelect;
export type InsertSelfIntro = z.infer<typeof insertSelfIntroSchema>;
export type SelfIntro = typeof selfIntros.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumes.$inferSelect;
export type InsertResumeAnalysisHistory = z.infer<typeof insertResumeAnalysisHistorySchema>;
export type ResumeAnalysisHistoryRecord = typeof resumeAnalysisHistory.$inferSelect;
export type ResumeAnalysisHistory = ResumeAnalysisHistoryRecord; // Alias for convenience
export type InsertStarStory = z.infer<typeof insertStarStorySchema>;
export type StarStory = typeof starStories.$inferSelect;
export type InsertActualInterview = z.infer<typeof insertActualInterviewSchema>;
export type ActualInterview = typeof actualInterviews.$inferSelect;
export type InsertReflectionJournal = z.infer<typeof insertReflectionJournalSchema>;
export type ReflectionJournal = typeof reflectionJournals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type FeedbackRecord = typeof feedback.$inferSelect;
export type Feedback = FeedbackRecord; // Alias for convenience
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;

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
  userId: uuid("user_id").notNull().references(() => users.id),
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
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User progress tracking for preparation activities
export const preparationProgress = pgTable("preparation_progress", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  preparationSessionId: uuid("preparation_session_id").notNull().references(() => preparationSessions.id, { onDelete: "cascade" }),
  activityType: varchar("activity_type", { length: 50 }).notNull(), // resource-read, practice-test, star-practice, etc.
  activityId: varchar("activity_id", { length: 255 }), // reference to specific activity
  status: varchar("status", { length: 20 }).default("not_started"), // not_started, in_progress, completed
  progress: numeric("progress", { precision: 5, scale: 2 }).default("0"), // 0-100%
  timeSpent: integer("time_spent").default(0), // minutes spent
  score: numeric("score", { precision: 5, scale: 2 }), // for assessments
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
  passingScore: numeric("passing_score", { precision: 5, scale: 2 }), // minimum score to pass
  difficulty: varchar("difficulty", { length: 20 }), // beginner, intermediate, advanced
  tags: jsonb("tags"), // array of tags
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Practice test results
export const practiceTestResults = pgTable("practice_test_results", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  practiceTestId: uuid("practice_test_id").notNull().references(() => practiceTests.id, { onDelete: "cascade" }),
  preparationSessionId: uuid("preparation_session_id").references(() => preparationSessions.id, { onDelete: "cascade" }),
  score: numeric("score", { precision: 5, scale: 2 }).notNull(),
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
  userId: uuid("user_id").notNull().references(() => users.id),
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
  userId: uuid("user_id").notNull().references(() => users.id),
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

// Relations for industry-specific coaching system will be defined after all tables

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

// Insert schemas for industry-specific coaching system will be defined after tables

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

// Types for industry-specific coaching system will be defined after schemas

export type IndustryQuestionWithContext = IndustryQuestion & {
  industryKnowledge?: IndustryKnowledge;
  relatedQuestions?: IndustryQuestion[];
};

// Industry context interfaces for type safety
export interface IndustryContext {
  primaryIndustry: string;
  specializations: string[];
  experienceLevel: 'intermediate' | 'senior' | 'expert';
  technicalDepth: string;
  companyContext: {
    type: 'startup' | 'enterprise' | 'consulting' | 'agency';
    businessModel: string;
    technicalStack?: string[];
    regulatoryEnvironment?: string;
  };
}

export interface CoachingGoals {
  starMethodImprovement: boolean;
  industryKnowledge: boolean;
  technicalDepth: boolean;
  communicationSkills: boolean;
  confidenceBuilding: boolean;
  customGoals: string[];
}

export interface StarAnalysis {
  situation: {
    score: number;
    feedback: string;
    improvementAreas: string[];
  };
  task: {
    score: number;
    feedback: string;
    improvementAreas: string[];
  };
  action: {
    score: number;
    feedback: string;
    improvementAreas: string[];
  };
  result: {
    score: number;
    feedback: string;
    improvementAreas: string[];
  };
  overallFlow: {
    score: number;
    feedback: string;
    improvementAreas: string[];
  };
}

// Industry classification constants
export const INDUSTRY_CATEGORIES = {
  technology: {
    name: 'Technology',
    subfields: ['software-engineering', 'data-science', 'cybersecurity', 'ai-ml', 'devops', 'mobile-development', 'web-development', 'cloud-computing'],
    questionTypes: ['system-design', 'coding-concepts', 'architecture', 'troubleshooting', 'scalability', 'performance-optimization']
  },
  finance: {
    name: 'Finance & Banking',
    subfields: ['investment-banking', 'risk-management', 'fintech', 'trading', 'compliance', 'wealth-management', 'corporate-finance'],
    questionTypes: ['market-analysis', 'regulatory-knowledge', 'quantitative-methods', 'risk-assessment', 'financial-modeling']
  },
  healthcare: {
    name: 'Healthcare & Life Sciences',
    subfields: ['clinical', 'pharmaceutical', 'medical-devices', 'health-tech', 'biotechnology', 'nursing', 'healthcare-administration'],
    questionTypes: ['patient-care', 'regulatory-compliance', 'clinical-protocols', 'safety-procedures', 'ethical-considerations']
  },
  consulting: {
    name: 'Consulting',
    subfields: ['strategy', 'management', 'technology', 'operations', 'financial-advisory', 'hr-consulting'],
    questionTypes: ['case-studies', 'problem-solving', 'client-management', 'analytical-thinking', 'presentation-skills']
  },
  marketing: {
    name: 'Marketing & Communications',
    subfields: ['digital-marketing', 'brand-management', 'content-marketing', 'social-media', 'advertising', 'public-relations'],
    questionTypes: ['campaign-strategy', 'brand-positioning', 'customer-insights', 'creative-thinking', 'data-analysis']
  }
} as const;

export type IndustryCategory = keyof typeof INDUSTRY_CATEGORIES;
export type IndustrySubfield = typeof INDUSTRY_CATEGORIES[IndustryCategory]['subfields'][number];
export type QuestionType = typeof INDUSTRY_CATEGORIES[IndustryCategory]['questionTypes'][number];

// ===========================================
// INDUSTRY-SPECIFIC COACHING SYSTEM
// ===========================================

// Enhanced coaching sessions with industry intelligence
export const coachingSessions = pgTable("coaching_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  jobPosition: varchar("job_position", { length: 200 }).notNull(),
  companyName: varchar("company_name", { length: 200 }),
  interviewStage: varchar("interview_stage", { length: 50 }).notNull(), // phone-screening, functional-team, hiring-manager, subject-matter-expertise, executive-final
  preferredLanguage: varchar("preferred_language", { length: 10 }).default("en"),
  
  // Industry-specific context
  primaryIndustry: varchar("primary_industry", { length: 100 }),
  specializations: jsonb("specializations"), // Array of technical specializations
  experienceLevel: varchar("experience_level", { length: 20 }), // intermediate, senior, expert
  technicalDepth: varchar("technical_depth", { length: 20 }),
  
  // Company and industry context
  industryContext: jsonb("industry_context"), // Company type, tech stack, business model, regulations
  coachingGoals: jsonb("coaching_goals"), // Array of specific coaching objectives
  
  // Session management
  status: varchar("status", { length: 20 }).default("active"), // active, completed, paused
  totalQuestions: integer("total_questions").default(15),
  currentQuestion: integer("current_question").default(0),
  timeAllocation: integer("time_allocation").default(60), // minutes
  
  // Progress tracking
  overallProgress: numeric("overall_progress", { precision: 5, scale: 2 }).default("0"), // 0-100%
  coachingScore: numeric("coaching_score", { precision: 3, scale: 2 }), // Overall coaching effectiveness score
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Coaching conversation messages
export const coachingMessages = pgTable("coaching_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid("session_id").notNull().references(() => coachingSessions.id, { onDelete: "cascade" }),
  messageType: varchar("message_type", { length: 20 }).notNull(), // coach, user, system
  content: text("content").notNull(),
  
  // Message context
  questionNumber: integer("question_number"),
  industryContext: jsonb("industry_context"), // Industry-specific metadata
  technicalTags: jsonb("technical_tags"), // Specialization tags
  coachingType: varchar("coaching_type", { length: 30 }), // question, response, tip, model_answer, learning, feedback
  
  // Multi-language support
  originalLanguage: varchar("original_language", { length: 10 }).default("en"),
  translatedContent: jsonb("translated_content"), // Translations in other languages
  
  // AI metadata
  aiMetadata: jsonb("ai_metadata"), // AI generation parameters and confidence scores
  feedback: text("feedback"), // Real-time coaching feedback
  
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Industry-specific question bank (750+ questions across 50+ industries)
export const industryQuestions = pgTable("industry_questions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Industry classification
  industry: varchar("industry", { length: 100 }).notNull(), // technology, finance, healthcare, etc.
  subfield: varchar("subfield", { length: 100 }), // software-engineering, data-science, cybersecurity, etc.
  specialization: varchar("specialization", { length: 100 }), // machine-learning, backend-development, etc.
  
  // Question details
  questionText: text("question_text").notNull(),
  interviewStage: varchar("interview_stage", { length: 50 }).notNull(),
  difficultyLevel: varchar("difficulty_level", { length: 20 }).notNull(), // beginner, intermediate, advanced
  technicalDepth: varchar("technical_depth", { length: 20 }), // intermediate, senior, expert
  
  // Question metadata
  contextRequirements: jsonb("context_requirements"), // Required context for the question
  questionType: varchar("question_type", { length: 50 }), // behavioral, situational, technical, scenario-based
  estimatedTime: integer("estimated_time").default(5), // minutes to answer
  
  // Model answer and evaluation
  modelAnswerStar: jsonb("model_answer_star"), // STAR-structured industry-specific answer
  evaluationCriteria: jsonb("evaluation_criteria"), // Industry-specific evaluation points
  commonFollowups: jsonb("common_followups"), // Follow-up questions
  industryInsights: text("industry_insights"), // Why this question matters in this industry
  
  // Content management
  tags: jsonb("tags"), // Array of tags for filtering
  isActive: boolean("is_active").default(true),
  aiGenerated: boolean("ai_generated").default(false),
  popularity: integer("popularity").default(0),
  
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Industry knowledge base for context-aware coaching
export const industryKnowledge = pgTable("industry_knowledge", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Knowledge classification
  knowledgeType: varchar("knowledge_type", { length: 30 }).notNull(), // company, industry, role, trend
  entityName: varchar("entity_name", { length: 200 }).notNull(), // Company/Industry/Role name
  
  // Industry context
  primaryIndustry: varchar("primary_industry", { length: 100 }),
  relatedIndustries: jsonb("related_industries"), // Array of related industries
  
  // Knowledge content
  overview: text("overview"),
  keyInsights: jsonb("key_insights"), // Array of key insights
  currentTrends: jsonb("current_trends"), // Recent trends and developments
  challenges: jsonb("challenges"), // Current industry/company challenges
  opportunities: jsonb("opportunities"), // Growth opportunities
  
  // Interview-specific information
  interviewFocus: jsonb("interview_focus"), // What interviewers prioritize
  commonScenarios: jsonb("common_scenarios"), // Typical interview scenarios
  keyTerminology: jsonb("key_terminology"), // Industry-specific terms and definitions
  culturalNorms: text("cultural_norms"), // Interview culture and expectations
  
  // Company-specific data (when applicable)
  companySize: varchar("company_size", { length: 50 }), // startup, small, medium, large, enterprise
  headquarters: varchar("headquarters", { length: 100 }),
  businessModel: varchar("business_model", { length: 100 }),
  technicalStack: jsonb("technical_stack"), // For tech companies
  recentNews: jsonb("recent_news"), // Recent company/industry news
  leadership: jsonb("leadership"), // Key leaders and their backgrounds
  competitors: jsonb("competitors"), // Main competitors
  
  // Content metadata
  confidenceScore: numeric("confidence_score", { precision: 3, scale: 2 }), // AI confidence in the information
  lastUpdated: timestamp("last_updated").defaultNow(),
  sources: jsonb("sources"), // Information sources
  isActive: boolean("is_active").default(true),
  
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Structured coaching feedback (tips, model answers, learning paths)
export const coachingFeedback = pgTable("coaching_feedback", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid("session_id").notNull().references(() => coachingSessions.id, { onDelete: "cascade" }),
  messageId: uuid("message_id").references(() => coachingMessages.id, { onDelete: "cascade" }),
  
  // Feedback classification
  feedbackType: varchar("feedback_type", { length: 30 }).notNull(), // coaching_tip, model_answer, learning_path, improvement_area
  category: varchar("category", { length: 50 }), // star_method, technical_depth, industry_knowledge, communication
  
  // Content
  title: varchar("title", { length: 200 }),
  content: text("content").notNull(),
  
  // Industry-specific context
  industryContext: varchar("industry_context", { length: 100 }),
  specialization: varchar("specialization", { length: 100 }),
  technicalLevel: varchar("technical_level", { length: 20 }),
  
  // Structured feedback data
  starAnalysis: jsonb("star_analysis"), // STAR method analysis
  improvementAreas: jsonb("improvement_areas"), // Specific areas for improvement
  strengths: jsonb("strengths"), // Identified strengths
  actionableSteps: jsonb("actionable_steps"), // Specific next steps
  resources: jsonb("resources"), // Recommended learning resources
  
  // Model answer data (when applicable)
  modelAnswerStar: jsonb("model_answer_star"), // Complete STAR-structured example
  alternativeApproaches: jsonb("alternative_approaches"), // Other valid approaches
  industryBestPractices: jsonb("industry_best_practices"), // Industry-specific best practices
  
  // Multi-language support
  language: varchar("language", { length: 10 }).default("en"),
  translations: jsonb("translations"), // Feedback in other languages
  
  // Effectiveness tracking
  helpfulnessScore: numeric("helpfulness_score", { precision: 3, scale: 2 }), // User-rated helpfulness
  relevanceScore: numeric("relevance_score", { precision: 3, scale: 2 }), // AI-calculated relevance
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for industry-specific coaching system
export const coachingSessionsRelations = relations(coachingSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [coachingSessions.userId],
    references: [users.id],
  }),
  messages: many(coachingMessages),
  feedback: many(coachingFeedback),
}));

export const coachingMessagesRelations = relations(coachingMessages, ({ one, many }) => ({
  session: one(coachingSessions, {
    fields: [coachingMessages.sessionId],
    references: [coachingSessions.id],
  }),
  feedback: many(coachingFeedback),
}));

export const industryQuestionsRelations = relations(industryQuestions, ({ one }) => ({
  createdBy: one(users, {
    fields: [industryQuestions.createdBy],
    references: [users.id],
  }),
}));

export const industryKnowledgeRelations = relations(industryKnowledge, ({ one }) => ({
  createdBy: one(users, {
    fields: [industryKnowledge.createdBy],
    references: [users.id],
  }),
}));

export const coachingFeedbackRelations = relations(coachingFeedback, ({ one }) => ({
  session: one(coachingSessions, {
    fields: [coachingFeedback.sessionId],
    references: [coachingSessions.id],
  }),
  message: one(coachingMessages, {
    fields: [coachingFeedback.messageId],
    references: [coachingMessages.id],
  }),
}));

// Insert schemas for industry-specific coaching system
export const insertCoachingSessionSchema = createInsertSchema(coachingSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCoachingMessageSchema = createInsertSchema(coachingMessages).omit({
  id: true,
  timestamp: true,
  createdAt: true,
});

export const insertIndustryQuestionSchema = createInsertSchema(industryQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIndustryKnowledgeSchema = createInsertSchema(industryKnowledge).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCoachingFeedbackSchema = createInsertSchema(coachingFeedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for industry-specific coaching system
export type CoachingSession = typeof coachingSessions.$inferSelect;
export type InsertCoachingSession = z.infer<typeof insertCoachingSessionSchema>;
export type CoachingMessage = typeof coachingMessages.$inferSelect;
export type InsertCoachingMessage = z.infer<typeof insertCoachingMessageSchema>;
export type IndustryQuestion = typeof industryQuestions.$inferSelect;
export type InsertIndustryQuestion = z.infer<typeof insertIndustryQuestionSchema>;
export type IndustryKnowledge = typeof industryKnowledge.$inferSelect;
export type InsertIndustryKnowledge = z.infer<typeof insertIndustryKnowledgeSchema>;
export type CoachingFeedback = typeof coachingFeedback.$inferSelect;
export type InsertCoachingFeedback = z.infer<typeof insertCoachingFeedbackSchema>;

// Extended types for coaching system API responses
export type CoachingSessionWithMessages = CoachingSession & {
  messages: CoachingMessage[];
  feedback: CoachingFeedback[];
  industryInsights?: IndustryKnowledge[];
};

export type CoachingMessageWithFeedback = CoachingMessage & {
  feedback?: CoachingFeedback[];
  relatedQuestions?: IndustryQuestion[];
};

// ===========================================
// AI-POWERED PREPARE MODULE TABLES
// ===========================================

// AI Preparation Sessions with Voice Capabilities
export const aiPrepareSessions = pgTable("ai_prepare_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  
  // Session Configuration
  sessionName: varchar("session_name", { length: 255 }),
  jobPosition: varchar("job_position", { length: 200 }).notNull(),
  companyName: varchar("company_name", { length: 200 }),
  interviewStage: varchar("interview_stage", { length: 50 }).notNull(), // phone-screening, functional-team, etc.
  experienceLevel: varchar("experience_level", { length: 20 }).notNull(), // intermediate, senior, expert
  preferredLanguage: varchar("preferred_language", { length: 10 }).default("en"),
  
  // AI Configuration
  difficultyLevel: varchar("difficulty_level", { length: 20 }).default("adaptive"), // adaptive, beginner, intermediate, advanced
  focusAreas: jsonb("focus_areas").default("[]"), // ["behavioral", "technical", "situational"]
  questionCategories: jsonb("question_categories").default("[]"),
  maxQuestions: integer("max_questions").default(20),
  timeLimitMinutes: integer("time_limit_minutes").default(60),
  
  // Session State
  status: varchar("status", { length: 20 }).default("active"), // active, completed, paused, abandoned
  currentQuestionNumber: integer("current_question_number").default(1),
  totalQuestionsAsked: integer("total_questions_asked").default(0),
  sessionProgress: numeric("session_progress", { precision: 5, scale: 2 }).default("0.00"), // 0-100%
  
  // Performance Tracking
  averageStarScore: numeric("average_star_score", { precision: 3, scale: 2 }),
  totalTimeSpent: integer("total_time_spent").default(0), // seconds
  questionsAnswered: integer("questions_answered").default(0),
  
  // Voice Settings
  voiceEnabled: boolean("voice_enabled").default(true),
  preferredVoice: varchar("preferred_voice", { length: 50 }),
  speechRate: numeric("speech_rate", { precision: 2, scale: 1 }).default("1.0"),
  autoPlayQuestions: boolean("auto_play_questions").default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  startedAt: timestamp("started_at"),
  pausedAt: timestamp("paused_at"),
  completedAt: timestamp("completed_at"),
});

// AI-Generated Questions with Cultural Context
export const aiPrepareQuestions = pgTable("ai_prepare_questions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid("session_id").notNull().references(() => aiPrepareSessions.id, { onDelete: "cascade" }),
  
  // Question Content
  questionText: text("question_text").notNull(),
  questionTextTranslated: text("question_text_translated"), // Translated version
  questionCategory: varchar("question_category", { length: 50 }).notNull(), // behavioral, situational, technical, company-specific
  questionType: varchar("question_type", { length: 30 }).notNull(), // behavioral, situational, technical, general
  difficultyLevel: varchar("difficulty_level", { length: 20 }).notNull(),
  
  // Question Metadata
  expectedAnswerTime: integer("expected_answer_time").default(180), // seconds
  starMethodRelevant: boolean("star_method_relevant").default(true),
  culturalContext: text("cultural_context"),
  industrySpecific: boolean("industry_specific").default(false),
  followUpQuestions: jsonb("follow_up_questions").default("[]"),
  
  // Question State
  questionNumber: integer("question_number").notNull(),
  isAnswered: boolean("is_answered").default(false),
  timeSpent: integer("time_spent").default(0),
  attempts: integer("attempts").default(0),
  
  // AI Generation Info
  generatedBy: varchar("generated_by", { length: 20 }).default("sealion"), // sealion, openai, fallback, curated
  generationPrompt: text("generation_prompt"),
  generationTimestamp: timestamp("generation_timestamp").defaultNow(),

  // CSV Question Tracking (Google Sheets integration)
  csvQuestionNumber: integer("csv_question_number"), // Q# from Google Sheets (1-125)
  csvQuestionStage: varchar("csv_question_stage", { length: 50 }), // phone-screening, functional-team, etc.
  isFromCuratedBank: boolean("is_from_curated_bank").default(false), // true if from CSV, false if AI-generated

  createdAt: timestamp("created_at").defaultNow(),
});

// User Responses with Voice & AI Evaluation
export const aiPrepareResponses = pgTable("ai_prepare_responses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid("session_id").notNull().references(() => aiPrepareSessions.id, { onDelete: "cascade" }),
  questionId: uuid("question_id").notNull().references(() => aiPrepareQuestions.id, { onDelete: "cascade" }),
  
  // Response Content
  responseText: text("response_text").notNull(),
  responseLanguage: varchar("response_language", { length: 10 }).default("en"),
  inputMethod: varchar("input_method", { length: 20 }).default("text"), // text, voice, hybrid
  
  // Audio Data (if voice input)
  audioFileUrl: text("audio_file_url"),
  audioDuration: integer("audio_duration"), // seconds
  transcriptionConfidence: numeric("transcription_confidence", { precision: 3, scale: 2 }),
  
  // AI Evaluation Results
  starScores: jsonb("star_scores").notNull(), // {situation: 4, task: 3, action: 5, result: 4, overall: 4}
  detailedFeedback: jsonb("detailed_feedback").notNull(), // {strengths: [], weaknesses: [], suggestions: []}
  modelAnswer: text("model_answer"),
  modelAnswerTranslated: text("model_answer_translated"),
  
  // Performance Metrics
  relevanceScore: numeric("relevance_score", { precision: 3, scale: 2 }),
  communicationScore: numeric("communication_score", { precision: 3, scale: 2 }),
  completenessScore: numeric("completeness_score", { precision: 3, scale: 2 }),

  // 9-Criteria Official Rubric Scores (1-5 scale) - Google Sheets Integration
  // Rubric: https://docs.google.com/spreadsheets/d/e/2PACX-1vQlowLLYOvBywNMirisORd1rDOcNVsCzF61nUa5sty2y7EXF_ix8XhvaEe5vx5llYPaIYGnQPvcC8o_/pub?output=csv
  starStructureScore: numeric("star_structure_score", { precision: 3, scale: 2 }), // 15% weight
  specificEvidenceScore: numeric("specific_evidence_score", { precision: 3, scale: 2 }), // 15% weight
  roleAlignmentScore: numeric("role_alignment_score", { precision: 3, scale: 2 }), // 15% weight
  outcomeOrientedScore: numeric("outcome_oriented_score", { precision: 3, scale: 2 }), // 15% weight
  problemSolvingScore: numeric("problem_solving_score", { precision: 3, scale: 2 }), // 10% weight
  culturalFitScore: numeric("cultural_fit_score", { precision: 3, scale: 2 }), // 5% weight
  learningAgilityScore: numeric("learning_agility_score", { precision: 3, scale: 2 }), // 5% weight

  // Calculated Weighted Scores
  weightedOverallScore: numeric("weighted_overall_score", { precision: 3, scale: 2 }), // Weighted average (1-5)
  overallRating: varchar("overall_rating", { length: 30 }), // Pass/Borderline/Needs Improvement

  improvementAreas: jsonb("improvement_areas").default("[]"),
  
  // Evaluation Metadata
  evaluatedBy: varchar("evaluated_by", { length: 20 }).default("sealion"),
  evaluationTimestamp: timestamp("evaluation_timestamp").defaultNow(),
  evaluationDuration: integer("evaluation_duration"), // milliseconds
  
  // Response Metadata
  timeTaken: integer("time_taken").notNull(), // seconds to answer
  wordCount: integer("word_count"),
  retryCount: integer("retry_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Session Analytics and Performance Tracking
export const aiPrepareAnalytics = pgTable("ai_prepare_analytics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid("session_id").notNull().references(() => aiPrepareSessions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  
  // Performance Metrics
  overallPerformance: jsonb("overall_performance").notNull(), // detailed performance breakdown
  categoryScores: jsonb("category_scores").default("{}"), // scores by question category
  improvementOverTime: jsonb("improvement_over_time").default("[]"), // performance progression
  
  // Behavioral Analysis
  responsePatterns: jsonb("response_patterns").default("{}"), // common patterns in responses
  strengthsIdentified: jsonb("strengths_identified").default("[]"),
  areasForImprovement: jsonb("areas_for_improvement").default("[]"),
  personalizedRecommendations: jsonb("personalized_recommendations").default("[]"),
  
  // Voice Analytics (if applicable)
  voiceMetrics: jsonb("voice_metrics").default("{}"), // speech rate, clarity, confidence
  
  // Session Statistics
  totalSessionTime: integer("total_session_time").notNull(),
  averageResponseTime: numeric("average_response_time", { precision: 5, scale: 2 }),
  questionsAnswered: integer("questions_answered").notNull(),
  questionsSkipped: integer("questions_skipped").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for AI Prepare Module
export const aiPrepareSessionsRelations = relations(aiPrepareSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [aiPrepareSessions.userId],
    references: [users.id],
  }),
  questions: many(aiPrepareQuestions),
  responses: many(aiPrepareResponses),
  analytics: one(aiPrepareAnalytics),
}));

export const aiPrepareQuestionsRelations = relations(aiPrepareQuestions, ({ one, many }) => ({
  session: one(aiPrepareSessions, {
    fields: [aiPrepareQuestions.sessionId],
    references: [aiPrepareSessions.id],
  }),
  responses: many(aiPrepareResponses),
}));

export const aiPrepareResponsesRelations = relations(aiPrepareResponses, ({ one }) => ({
  session: one(aiPrepareSessions, {
    fields: [aiPrepareResponses.sessionId],
    references: [aiPrepareSessions.id],
  }),
  question: one(aiPrepareQuestions, {
    fields: [aiPrepareResponses.questionId],
    references: [aiPrepareQuestions.id],
  }),
}));

export const aiPrepareAnalyticsRelations = relations(aiPrepareAnalytics, ({ one }) => ({
  session: one(aiPrepareSessions, {
    fields: [aiPrepareAnalytics.sessionId],
    references: [aiPrepareSessions.id],
  }),
  user: one(users, {
    fields: [aiPrepareAnalytics.userId],
    references: [users.id],
  }),
}));

// Practice module relations
export const practiceSessionsRelations = relations(practiceSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [practiceSessions.userId],
    references: [users.id],
  }),
  messages: many(practiceMessages),
  report: one(practiceReports),
}));

export const practiceMessagesRelations = relations(practiceMessages, ({ one }) => ({
  session: one(practiceSessions, {
    fields: [practiceMessages.sessionId],
    references: [practiceSessions.id],
  }),
}));

export const practiceReportsRelations = relations(practiceReports, ({ one }) => ({
  session: one(practiceSessions, {
    fields: [practiceReports.sessionId],
    references: [practiceSessions.id],
  }),
  user: one(users, {
    fields: [practiceReports.userId],
    references: [users.id],
  }),
}));

// Insert schemas for AI Prepare Module
export const insertAiPrepareSessionSchema = createInsertSchema(aiPrepareSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiPrepareQuestionSchema = createInsertSchema(aiPrepareQuestions).omit({
  id: true,
  createdAt: true,
});

export const insertAiPrepareResponseSchema = createInsertSchema(aiPrepareResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiPrepareAnalyticsSchema = createInsertSchema(aiPrepareAnalytics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Insert schemas for Practice Module
export const insertPracticeSessionSchema = createInsertSchema(practiceSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPracticeMessageSchema = createInsertSchema(practiceMessages).omit({
  id: true,
  createdAt: true,
});

export const insertPracticeReportSchema = createInsertSchema(practiceReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for AI Prepare Module
export type AiPrepareSession = typeof aiPrepareSessions.$inferSelect;
export type InsertAiPrepareSession = z.infer<typeof insertAiPrepareSessionSchema>;
export type AiPrepareQuestion = typeof aiPrepareQuestions.$inferSelect;
export type InsertAiPrepareQuestion = z.infer<typeof insertAiPrepareQuestionSchema>;
export type AiPrepareResponse = typeof aiPrepareResponses.$inferSelect;
export type InsertAiPrepareResponse = z.infer<typeof insertAiPrepareResponseSchema>;
export type AiPrepareAnalytics = typeof aiPrepareAnalytics.$inferSelect;
export type InsertAiPrepareAnalytics = z.infer<typeof insertAiPrepareAnalyticsSchema>;

// Extended types for API responses
export type AiPrepareSessionWithDetails = AiPrepareSession & {
  questions?: AiPrepareQuestion[];
  responses?: AiPrepareResponse[];
  analytics?: AiPrepareAnalytics;
  currentQuestion?: AiPrepareQuestion;
  lastResponse?: AiPrepareResponse;
};

export type AiPrepareQuestionWithResponse = AiPrepareQuestion & {
  response?: AiPrepareResponse;
  nextQuestion?: AiPrepareQuestion;
};

export type AiPrepareSessionProgress = {
  sessionId: string;
  overallProgress: number;
  questionsAnswered: number;
  totalQuestions: number;
  averageStarScore: number;
  timeSpent: number;
  strengthAreas: string[];
  improvementAreas: string[];
};

// Types for Practice Module
export type PracticeSession = typeof practiceSessions.$inferSelect;
export type InsertPracticeSession = z.infer<typeof insertPracticeSessionSchema>;
export type PracticeMessage = typeof practiceMessages.$inferSelect;
export type InsertPracticeMessage = z.infer<typeof insertPracticeMessageSchema>;
export type PracticeReport = typeof practiceReports.$inferSelect;
export type InsertPracticeReport = z.infer<typeof insertPracticeReportSchema>;

// Extended types for API responses
export type PracticeSessionWithMessages = PracticeSession & {
  messages: PracticeMessage[];
  report?: PracticeReport;
};

export type PracticeSessionOverview = {
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  recentSessions: PracticeSession[];
  improvementTrends: {
    category: string;
    trend: 'improving' | 'declining' | 'stable';
    score: number;
  }[];
};


// Voice service types
export type VoiceInputMethod = 'text' | 'voice' | 'hybrid';
export type VoiceQuality = 'excellent' | 'good' | 'fair' | 'poor';

export interface VoiceTranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  processingTime: number;
  quality: VoiceQuality;
}

export interface VoiceSynthesisOptions {
  language: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

// AI evaluation types
export interface StarMethodScores {
  situation: number;
  task: number;
  action: number;
  result: number;
  overall: number;
}

export interface DetailedFeedback {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  overallComment: string;
}

export interface ModelAnswer {
  situation: string;
  task: string;
  action: string;
  result: string;
  fullAnswer: string;
  keyPoints: string[];
}

