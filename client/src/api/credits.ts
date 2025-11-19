/**
 * Credits Module API Client
 *
 * Handles all credit system endpoints:
 * - Credit balance
 * - Transaction history
 * - Credit purchases (Stripe integration)
 * - Credit deductions
 */

import apiClient, { type ApiResponse } from './base-client';

// ============================================================================
// Type Definitions
// ============================================================================

export interface CreditBalance {
  balance: number;
  total_earned: number;
  total_spent: number;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  transaction_type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'referral';
  reason?: string;
  reference_id?: string;
  metadata?: any;
  created_at: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  popular?: boolean;
}

export interface PurchaseResponse {
  client_secret?: string; // For Stripe confirmation
  transaction: CreditTransaction;
  message: string;
}

// ============================================================================
// Credit Balance
// ============================================================================

/**
 * Get user's credit balance
 */
export async function getCreditBalance(): Promise<CreditBalance> {
  const { data } = await apiClient.get<ApiResponse<CreditBalance>>(
    '/credits/balance'
  );
  return data.data!;
}

// ============================================================================
// Transaction History
// ============================================================================

/**
 * Get credit transaction history
 */
export async function getCreditHistory(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ transactions: CreditTransaction[]; total: number }> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const { data } = await apiClient.get<ApiResponse<{
    transactions: CreditTransaction[];
    total: number;
  }>>(
    `/credits/history?${queryParams.toString()}`
  );
  return data.data!;
}

// ============================================================================
// Credit Purchases
// ============================================================================

/**
 * Get available credit packages
 */
export async function getCreditPackages(): Promise<CreditPackage[]> {
  const { data } = await apiClient.get<ApiResponse<{ packages: CreditPackage[] }>>(
    '/credits/packages'
  );
  return data.data?.packages || [];
}

/**
 * Purchase credits via Stripe
 */
export async function purchaseCredits(params: {
  package: '100' | '500' | '2000';
  payment_method_id?: string;
}): Promise<PurchaseResponse> {
  const { data } = await apiClient.post<ApiResponse<PurchaseResponse>>(
    '/credits/topup',
    {
      package: params.package,
      payment_method_id: params.payment_method_id,
    }
  );
  return data.data!;
}

// ============================================================================
// Credit Deductions (Internal)
// ============================================================================

/**
 * Deduct credits (internal use - called by backend logic)
 */
export async function deductCredits(params: {
  amount: number;
  reason: string;
  reference_id?: string;
}): Promise<{ new_balance: number; transaction: CreditTransaction }> {
  const { data } = await apiClient.post<ApiResponse<{
    new_balance: number;
    transaction: CreditTransaction;
  }>>(
    '/credits/deduct',
    {
      amount: params.amount,
      reason: params.reason,
      reference_id: params.reference_id,
    }
  );
  return data.data!;
}

// ============================================================================
// Credit Costs
// ============================================================================

/**
 * Get credit costs for various actions
 */
export async function getCreditCosts(): Promise<{
  practice_session: number;
  ai_analysis: number;
  premium_module: number;
}> {
  const { data } = await apiClient.get<ApiResponse<{
    practice_session: number;
    ai_analysis: number;
    premium_module: number;
  }>>(
    '/credits/costs'
  );
  return data.data!;
}

/**
 * Check if user has sufficient credits
 */
export async function checkSufficientCredits(params: {
  action: string;
  credits_required: number;
}): Promise<{ sufficient: boolean; current_balance: number; shortfall?: number }> {
  const { data } = await apiClient.post<ApiResponse<{
    sufficient: boolean;
    current_balance: number;
    shortfall?: number;
  }>>(
    '/credits/check',
    {
      action: params.action,
      credits_required: params.credits_required,
    }
  );
  return data.data!;
}

// ============================================================================
// Export All
// ============================================================================

export default {
  // Balance
  getCreditBalance,

  // History
  getCreditHistory,

  // Purchases
  getCreditPackages,
  purchaseCredits,

  // Deductions (Internal)
  deductCredits,

  // Costs
  getCreditCosts,
  checkSufficientCredits,
};
