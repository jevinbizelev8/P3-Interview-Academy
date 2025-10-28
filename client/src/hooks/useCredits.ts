import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

/**
 * Credit Balance Response
 */
export interface CreditBalance {
  totalCredits: number;
  monthlyCredits: number;
  topUpCredits: number;
  breakdown: {
    subscription: {
      credits: number;
      description: string;
    };
    topUp: {
      credits: number;
      description: string;
    };
  };
}

/**
 * Credit Transaction
 */
export interface CreditTransaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  feature: string | null;
  sessionId: string | null;
  timestamp: string;
}

/**
 * Credit Cost
 */
export interface CreditCost {
  feature: string;
  creditCost: number;
  description: string;
}

/**
 * Custom hook for fetching and managing credit data
 */
export function useCredits() {
  const queryClient = useQueryClient();

  // Fetch credit balance
  const {
    data: balance,
    isLoading: balanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useQuery<CreditBalance>({
    queryKey: ["/api/credits/balance"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/credits/balance");
      const json = await response.json();
      return json.data;
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Fetch credit transaction history
  const {
    data: history,
    isLoading: historyLoading,
    error: historyError,
  } = useQuery<{ transactions: CreditTransaction[]; count: number; limit: number }>({
    queryKey: ["/api/credits/history"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/credits/history?limit=50");
      const json = await response.json();
      return json.data;
    },
    staleTime: 60000, // Consider data stale after 1 minute
  });

  // Fetch credit costs
  const {
    data: costs,
    isLoading: costsLoading,
    error: costsError,
  } = useQuery<{ costs: CreditCost[] }>({
    queryKey: ["/api/credits/costs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/credits/costs");
      const json = await response.json();
      return json.data;
    },
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  });

  // Mutation for checking if user has enough credits for a feature
  const checkCreditsMutation = useMutation({
    mutationFn: async (featureName: string) => {
      const response = await apiRequest("POST", "/api/credits/check", { featureName });
      const json = await response.json();
      return json.data;
    },
  });

  // Calculate credit percentage for progress bar
  const creditPercentage = balance
    ? Math.min((balance.totalCredits / (balance.monthlyCredits || 50)) * 100, 100)
    : 0;

  // Check if credits are low (< 20%)
  const isLowCredits = balance ? balance.totalCredits < (balance.monthlyCredits * 0.2) : false;

  // Check if credits are critically low (< 10 credits)
  const isCriticallyLow = balance ? balance.totalCredits < 10 : false;

  return {
    // Balance data
    balance,
    balanceLoading,
    balanceError,
    refetchBalance,

    // Transaction history
    history: history?.transactions || [],
    historyCount: history?.count || 0,
    historyLoading,
    historyError,

    // Credit costs
    costs: costs?.costs || [],
    costsLoading,
    costsError,

    // Credit check mutation
    checkCredits: checkCreditsMutation.mutate,
    checkingCredits: checkCreditsMutation.isPending,

    // Computed values
    creditPercentage,
    isLowCredits,
    isCriticallyLow,

    // Utility functions
    invalidateCredits: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits/history"] });
    },
  };
}

/**
 * Hook for subscribing to credit updates (lightweight version)
 * Only fetches balance, useful for navigation widgets
 */
export function useCreditBalance() {
  const {
    data: balance,
    isLoading,
    error,
    refetch,
  } = useQuery<CreditBalance>({
    queryKey: ["/api/credits/balance"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/credits/balance");
      const json = await response.json();
      return json.data;
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 10000,
  });

  return {
    balance,
    isLoading,
    error,
    refetch,
  };
}
