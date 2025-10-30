/**
 * React Query Hooks for P3 Interview Academy MVP APIs
 *
 * Provides hooks for all API modules:
 * - Prepare (learning modules, self-intro, resume, STAR stories)
 * - Practice (simulations, history, assessment)
 * - Perform (interviews, reflections, analytics)
 * - Gamification (badges, XP, streaks, leaderboard)
 * - Credits (balance, history, purchases)
 * - Referrals (codes, stats, list)
 * - Support (tickets, feedback)
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import * as prepareApi from '../api/prepare';
import * as practiceApi from '../api/practice';
import * as performApi from '../api/perform';
import * as gamificationApi from '../api/gamification';
import * as creditsApi from '../api/credits';
import * as referralsApi from '../api/referrals';
import * as supportApi from '../api/support';

// ============================================================================
// Query Keys
// ============================================================================

export const queryKeys = {
  // Prepare Module
  learningModules: ['learningModules'] as const,
  learningModulesByStage: (stage: string) => ['learningModules', stage] as const,
  userModuleProgress: ['userModuleProgress'] as const,
  selfIntroDraft: ['selfIntroDraft'] as const,
  selfIntro: ['selfIntro'] as const,
  resumes: ['resumes'] as const,
  resume: (id: string) => ['resume', id] as const,
  starStories: ['starStories'] as const,
  readinessScore: ['readinessScore'] as const,

  // Practice Module
  practiceHistory: (params?: any) => ['practiceHistory', params] as const,
  assessment: (sessionId: string) => ['assessment', sessionId] as const,

  // Perform Module
  actualInterviews: ['actualInterviews'] as const,
  reflections: (params?: any) => ['reflections', params] as const,
  insights: ['insights'] as const,
  performanceChart: (period?: string) => ['performanceChart', period] as const,
  performanceStats: ['performanceStats'] as const,
  interviewStats: ['interviewStats'] as const,
  interviewTimeline: ['interviewTimeline'] as const,

  // Gamification Module
  badges: ['badges'] as const,
  userBadges: ['userBadges'] as const,
  xpPoints: ['xpPoints'] as const,
  streak: ['streak'] as const,
  leaderboard: (params?: any) => ['leaderboard', params] as const,

  // Credits Module
  creditBalance: ['creditBalance'] as const,
  creditHistory: (params?: any) => ['creditHistory', params] as const,
  creditCosts: ['creditCosts'] as const,

  // Referrals Module
  referralCode: ['referralCode'] as const,
  referralStats: ['referralStats'] as const,
  userReferrals: (params?: any) => ['userReferrals', params] as const,

  // Support Module
  tickets: (params?: any) => ['tickets', params] as const,
  ticket: (id: string) => ['ticket', id] as const,
  ticketStats: ['ticketStats'] as const,
  feedback: (params?: any) => ['feedback', params] as const,
  feedbackItem: (id: string) => ['feedback', id] as const,
};

// ============================================================================
// Prepare Module Hooks
// ============================================================================

export function useLearningModules(options?: UseQueryOptions<prepareApi.LearningModule[]>) {
  return useQuery({
    queryKey: queryKeys.learningModules,
    queryFn: prepareApi.getLearningModules,
    ...options,
  });
}

export function useLearningModulesByStage(stage: string, options?: UseQueryOptions<prepareApi.LearningModule[]>) {
  return useQuery({
    queryKey: queryKeys.learningModulesByStage(stage),
    queryFn: () => prepareApi.getLearningModulesByStage(stage),
    ...options,
  });
}

export function useUserModuleProgress(options?: UseQueryOptions<prepareApi.UserModuleProgress[]>) {
  return useQuery({
    queryKey: queryKeys.userModuleProgress,
    queryFn: prepareApi.getUserModuleProgress,
    ...options,
  });
}

export function useUpdateModuleProgress(options?: UseMutationOptions<prepareApi.UserModuleProgress, Error, Parameters<typeof prepareApi.updateModuleProgress>[0]>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: prepareApi.updateModuleProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userModuleProgress });
      queryClient.invalidateQueries({ queryKey: queryKeys.readinessScore });
    },
    ...options,
  });
}

export function useSelfIntroDraft(options?: UseQueryOptions<prepareApi.SelfIntroDraft | null>) {
  return useQuery({
    queryKey: queryKeys.selfIntroDraft,
    queryFn: prepareApi.getSelfIntroDraft,
    ...options,
  });
}

export function useSaveSelfIntroDraft(options?: UseMutationOptions<prepareApi.SelfIntroDraft, Error, Parameters<typeof prepareApi.saveSelfIntroDraft>[0]>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: prepareApi.saveSelfIntroDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.selfIntroDraft });
    },
    ...options,
  });
}

export function useFinalizeSelfIntro(options?: UseMutationOptions<prepareApi.SelfIntro, Error, Parameters<typeof prepareApi.finalizeSelfIntro>[0]>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: prepareApi.finalizeSelfIntro,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.selfIntro });
      queryClient.invalidateQueries({ queryKey: queryKeys.selfIntroDraft });
      queryClient.invalidateQueries({ queryKey: queryKeys.readinessScore });
    },
    ...options,
  });
}

export function useSelfIntro(options?: UseQueryOptions<prepareApi.SelfIntro | null>) {
  return useQuery({
    queryKey: queryKeys.selfIntro,
    queryFn: prepareApi.getSelfIntro,
    ...options,
  });
}

export function useResumes(options?: UseQueryOptions<prepareApi.Resume[]>) {
  return useQuery({
    queryKey: queryKeys.resumes,
    queryFn: prepareApi.listResumes,
    ...options,
  });
}

export function useResume(resumeId: string, options?: UseQueryOptions<prepareApi.Resume>) {
  return useQuery({
    queryKey: queryKeys.resume(resumeId),
    queryFn: () => prepareApi.getResume(resumeId),
    enabled: !!resumeId,
    ...options,
  });
}

export function useUploadResume(options?: UseMutationOptions<prepareApi.Resume, Error, File>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: prepareApi.uploadResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resumes });
    },
    ...options,
  });
}

export function useAnalyzeResume(options?: UseMutationOptions<prepareApi.ResumeAnalysis, Error, Parameters<typeof prepareApi.analyzeResume>[0]>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: prepareApi.analyzeResume,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume(variables.resumeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.resumes });
      queryClient.invalidateQueries({ queryKey: queryKeys.readinessScore });
    },
    ...options,
  });
}

export function useStarStories(options?: UseQueryOptions<prepareApi.StarStory[]>) {
  return useQuery({
    queryKey: queryKeys.starStories,
    queryFn: prepareApi.getStarStories,
    ...options,
  });
}

export function useCreateStarStory(options?: UseMutationOptions<prepareApi.StarStory, Error, Parameters<typeof prepareApi.createStarStory>[0]>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: prepareApi.createStarStory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.starStories });
    },
    ...options,
  });
}

export function useUpdateStarStory(options?: UseMutationOptions<prepareApi.StarStory, Error, { storyId: string } & Parameters<typeof prepareApi.updateStarStory>[1]>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ storyId, ...params }) => prepareApi.updateStarStory(storyId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.starStories });
    },
    ...options,
  });
}

export function useDeleteStarStory(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: prepareApi.deleteStarStory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.starStories });
    },
    ...options,
  });
}

export function useReadinessScore(options?: UseQueryOptions<prepareApi.ReadinessScore>) {
  return useQuery({
    queryKey: queryKeys.readinessScore,
    queryFn: prepareApi.getReadinessScore,
    ...options,
  });
}

// ============================================================================
// Practice Module Hooks
// ============================================================================

export function useCreatePracticeSession(options?: UseMutationOptions<practiceApi.PracticeSession, Error, Parameters<typeof practiceApi.createPracticeSession>[0]>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: practiceApi.createPracticeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.practiceHistory() });
      queryClient.invalidateQueries({ queryKey: queryKeys.creditBalance });
    },
    ...options,
  });
}

export function useSimulationHistory(params?: Parameters<typeof practiceApi.getSimulationHistory>[0], options?: UseQueryOptions<{ sessions: practiceApi.SimulationHistoryItem[]; total: number }>) {
  return useQuery({
    queryKey: queryKeys.practiceHistory(params),
    queryFn: () => practiceApi.getSimulationHistory(params),
    ...options,
  });
}

export function useAssessment(sessionId: string, options?: UseQueryOptions<practiceApi.Assessment>) {
  return useQuery({
    queryKey: queryKeys.assessment(sessionId),
    queryFn: () => practiceApi.getAssessment(sessionId),
    enabled: !!sessionId,
    ...options,
  });
}

// ============================================================================
// Perform Module Hooks
// ============================================================================

export function useActualInterviews(options?: UseQueryOptions<performApi.ActualInterview[]>) {
  return useQuery({
    queryKey: queryKeys.actualInterviews,
    queryFn: performApi.getActualInterviews,
    ...options,
  });
}

export function useCreateActualInterview(options?: UseMutationOptions<performApi.ActualInterview, Error, Parameters<typeof performApi.createActualInterview>[0]>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: performApi.createActualInterview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.actualInterviews });
      queryClient.invalidateQueries({ queryKey: queryKeys.interviewStats });
      queryClient.invalidateQueries({ queryKey: queryKeys.interviewTimeline });
    },
    ...options,
  });
}

export function useUpdateActualInterview(options?: UseMutationOptions<performApi.ActualInterview, Error, { interviewId: string } & Partial<performApi.ActualInterview>>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ interviewId, ...params }) => performApi.updateActualInterview(interviewId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.actualInterviews });
      queryClient.invalidateQueries({ queryKey: queryKeys.interviewStats });
    },
    ...options,
  });
}

export function useDeleteActualInterview(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: performApi.deleteActualInterview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.actualInterviews });
      queryClient.invalidateQueries({ queryKey: queryKeys.interviewStats });
    },
    ...options,
  });
}

export function useReflections(params?: Parameters<typeof performApi.getReflections>[0], options?: UseQueryOptions<{ reflections: performApi.ReflectionJournal[]; total: number }>) {
  return useQuery({
    queryKey: queryKeys.reflections(params),
    queryFn: () => performApi.getReflections(params),
    ...options,
  });
}

export function useCreateReflection(options?: UseMutationOptions<performApi.ReflectionJournal, Error, Parameters<typeof performApi.createReflection>[0]>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: performApi.createReflection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reflections() });
    },
    ...options,
  });
}

export function useInsights(options?: UseQueryOptions<performApi.PerformanceInsights>) {
  return useQuery({
    queryKey: queryKeys.insights,
    queryFn: performApi.getInsights,
    ...options,
  });
}

export function usePerformanceChart(period?: '7d' | '30d' | '90d', options?: UseQueryOptions<performApi.PerformanceChartData>) {
  return useQuery({
    queryKey: queryKeys.performanceChart(period),
    queryFn: () => performApi.getPerformanceChart(period),
    ...options,
  });
}

export function usePerformanceStats(options?: UseQueryOptions<performApi.PerformanceStats>) {
  return useQuery({
    queryKey: queryKeys.performanceStats,
    queryFn: performApi.getPerformanceStats,
    ...options,
  });
}

export function useInterviewStats(options?: UseQueryOptions<performApi.InterviewStats>) {
  return useQuery({
    queryKey: queryKeys.interviewStats,
    queryFn: performApi.getInterviewStats,
    ...options,
  });
}

export function useInterviewTimeline(options?: UseQueryOptions<performApi.InterviewTimelineItem[]>) {
  return useQuery({
    queryKey: queryKeys.interviewTimeline,
    queryFn: performApi.getInterviewTimeline,
    ...options,
  });
}

// ============================================================================
// Gamification Module Hooks
// ============================================================================

export function useBadges(options?: UseQueryOptions<gamificationApi.Badge[]>) {
  return useQuery({
    queryKey: queryKeys.badges,
    queryFn: gamificationApi.getAllBadges,
    ...options,
  });
}

export function useUserBadges(options?: UseQueryOptions<gamificationApi.UserBadge[]>) {
  return useQuery({
    queryKey: queryKeys.userBadges,
    queryFn: gamificationApi.getUserBadges,
    ...options,
  });
}

export function useAwardBadge(options?: UseMutationOptions<gamificationApi.UserBadge, Error, string>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: gamificationApi.awardBadge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userBadges });
      queryClient.invalidateQueries({ queryKey: queryKeys.xpPoints });
    },
    ...options,
  });
}

export function useXPPoints(options?: UseQueryOptions<gamificationApi.XPPoints>) {
  return useQuery({
    queryKey: queryKeys.xpPoints,
    queryFn: gamificationApi.getPoints,
    ...options,
  });
}

export function useAddPoints(options?: UseMutationOptions<gamificationApi.XPPoints, Error, Parameters<typeof gamificationApi.addPoints>[0]>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: gamificationApi.addPoints,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.xpPoints });
    },
    ...options,
  });
}

export function useStreak(options?: UseQueryOptions<gamificationApi.Streak>) {
  return useQuery({
    queryKey: queryKeys.streak,
    queryFn: gamificationApi.getStreak,
    ...options,
  });
}

export function useUpdateStreak(options?: UseMutationOptions<gamificationApi.Streak, Error>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: gamificationApi.updateStreak,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streak });
    },
    ...options,
  });
}

export function useLeaderboard(params?: Parameters<typeof gamificationApi.getLeaderboard>[0], options?: UseQueryOptions<{ leaderboard: gamificationApi.LeaderboardEntry[]; total: number; userRank?: number }>) {
  return useQuery({
    queryKey: queryKeys.leaderboard(params),
    queryFn: () => gamificationApi.getLeaderboard(params),
    ...options,
  });
}

// ============================================================================
// Credits Module Hooks
// ============================================================================

export function useCreditBalance(options?: UseQueryOptions<creditsApi.CreditBalance>) {
  return useQuery({
    queryKey: queryKeys.creditBalance,
    queryFn: creditsApi.getCreditBalance,
    ...options,
  });
}

export function useCreditHistory(params?: Parameters<typeof creditsApi.getCreditHistory>[0], options?: UseQueryOptions<{ transactions: creditsApi.CreditTransaction[]; total: number }>) {
  return useQuery({
    queryKey: queryKeys.creditHistory(params),
    queryFn: () => creditsApi.getCreditHistory(params),
    ...options,
  });
}

export function usePurchaseCredits(options?: UseMutationOptions<creditsApi.PurchaseResponse, Error, Parameters<typeof creditsApi.purchaseCredits>[0]>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creditsApi.purchaseCredits,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creditBalance });
      queryClient.invalidateQueries({ queryKey: queryKeys.creditHistory() });
    },
    ...options,
  });
}

export function useCreditCosts(options?: UseQueryOptions<{ practice_session: number; ai_analysis: number; premium_module: number }>) {
  return useQuery({
    queryKey: queryKeys.creditCosts,
    queryFn: creditsApi.getCreditCosts,
    ...options,
  });
}

// ============================================================================
// Referrals Module Hooks
// ============================================================================

export function useReferralCode(options?: UseQueryOptions<referralsApi.ReferralCode>) {
  return useQuery({
    queryKey: queryKeys.referralCode,
    queryFn: referralsApi.getReferralCode,
    ...options,
  });
}

export function useCreateReferralCode(options?: UseMutationOptions<referralsApi.ReferralCode, Error>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: referralsApi.createReferralCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.referralCode });
    },
    ...options,
  });
}

export function useApplyReferralCode(options?: UseMutationOptions<referralsApi.ApplyReferralResponse, Error, Parameters<typeof referralsApi.applyReferralCode>[0]>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: referralsApi.applyReferralCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creditBalance });
    },
    ...options,
  });
}

export function useReferralStats(options?: UseQueryOptions<referralsApi.ReferralStats>) {
  return useQuery({
    queryKey: queryKeys.referralStats,
    queryFn: referralsApi.getReferralStats,
    ...options,
  });
}

export function useUserReferrals(params?: Parameters<typeof referralsApi.getUserReferrals>[0], options?: UseQueryOptions<{ referrals: referralsApi.Referral[]; total: number; limit: number }>) {
  return useQuery({
    queryKey: queryKeys.userReferrals(params),
    queryFn: () => referralsApi.getUserReferrals(params),
    ...options,
  });
}

// ============================================================================
// Support Module Hooks
// ============================================================================

export function useTickets(params?: Parameters<typeof supportApi.getTickets>[0], options?: UseQueryOptions<{ tickets: supportApi.SupportTicket[]; total: number }>) {
  return useQuery({
    queryKey: queryKeys.tickets(params),
    queryFn: () => supportApi.getTickets(params),
    ...options,
  });
}

export function useTicket(ticketId: string, options?: UseQueryOptions<supportApi.SupportTicket>) {
  return useQuery({
    queryKey: queryKeys.ticket(ticketId),
    queryFn: () => supportApi.getTicket(ticketId),
    enabled: !!ticketId,
    ...options,
  });
}

export function useCreateTicket(options?: UseMutationOptions<supportApi.SupportTicket, Error, Parameters<typeof supportApi.createTicket>[0]>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets() });
      queryClient.invalidateQueries({ queryKey: queryKeys.ticketStats });
    },
    ...options,
  });
}

export function useUpdateTicket(options?: UseMutationOptions<supportApi.SupportTicket, Error, { ticketId: string } & Parameters<typeof supportApi.updateTicket>[1]>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, ...params }) => supportApi.updateTicket(ticketId, params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ticket(variables.ticketId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets() });
      queryClient.invalidateQueries({ queryKey: queryKeys.ticketStats });
    },
    ...options,
  });
}

export function useTicketStats(options?: UseQueryOptions<supportApi.TicketStats>) {
  return useQuery({
    queryKey: queryKeys.ticketStats,
    queryFn: supportApi.getTicketStats,
    ...options,
  });
}

export function useFeedback(params?: Parameters<typeof supportApi.getFeedback>[0], options?: UseQueryOptions<{ feedback: supportApi.Feedback[]; total: number }>) {
  return useQuery({
    queryKey: queryKeys.feedback(params),
    queryFn: () => supportApi.getFeedback(params),
    ...options,
  });
}

export function useFeedbackById(feedbackId: string, options?: UseQueryOptions<supportApi.Feedback>) {
  return useQuery({
    queryKey: queryKeys.feedbackItem(feedbackId),
    queryFn: () => supportApi.getFeedbackById(feedbackId),
    enabled: !!feedbackId,
    ...options,
  });
}

export function useSubmitFeedback(options?: UseMutationOptions<supportApi.Feedback, Error, Parameters<typeof supportApi.submitFeedback>[0]>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.submitFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback() });
    },
    ...options,
  });
}
