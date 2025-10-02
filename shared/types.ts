// Interface definitions for AI services

export interface InterviewerPersona {
  name: string;
  title: string;
  style: string;
  personality: string;
}

export interface InterviewContext {
  stage: string;
  jobRole: string;
  company: string;
  candidateBackground: string;
  keyObjectives: string;
  userJobPosition?: string;
  userCompanyName?: string;
}

export interface AIResponse {
  content: string;
  questionNumber?: number;
  feedback?: string;
}

export interface UsageBreakdownEntry {
  module: string;
  sessionCount: number;
  creditsConsumed: number;
}

export interface UserUsageSummary {
  totalCreditsConsumed: number;
  breakdown: UsageBreakdownEntry[];
}

export interface CreditLedgerSnapshot {
  id: string;
  amount: number;
  balanceAfter: number | null;
  reason: string;
  module?: string | null;
  sessionId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface UsageEventSnapshot {
  id: string;
  module: string;
  sessionId?: string | null;
  creditsConsumed: number;
  occurredAt: Date;
  metadata?: Record<string, unknown> | null;
}

export interface UserCreditSummary extends UserUsageSummary {
  userId: string;
  accountTier: string;
  monthlyCreditAllocation: number;
  creditBalance: number;
  billingCycleStart: Date | null;
  billingCycleEnd: Date | null;
  recentLedger: CreditLedgerSnapshot[];
  recentUsageEvents: UsageEventSnapshot[];
}

export interface STARAssessment {
  situation: number;
  task: number;
  action: number;
  result: number;
  flow: number;
  overall: number;
  qualitative: string;
  strengths: string[];
  improvements: string[];
}