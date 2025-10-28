/**
 * Subscription API Client
 *
 * Frontend service for interacting with Stripe subscription and payment endpoints.
 */

export interface CheckoutSessionResponse {
  success: boolean;
  data: {
    sessionId: string;
    url: string;
  };
  message?: string;
}

export interface SubscriptionStatusResponse {
  success: boolean;
  data: {
    planType: string;
    subscriptionStatus: string | null;
    currentPeriodEnd: string | null;
    monthlyCredits: number;
    creditBalance: number;
    topUpCredits: number;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    subscription: any | null;
  };
}

export interface TopUpPackage {
  id: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  savings: number;
  stripePriceId: string;
}

export interface TopUpPackagesResponse {
  success: boolean;
  data: {
    packages: TopUpPackage[];
  };
}

export interface CustomerPortalResponse {
  success: boolean;
  data: {
    url: string;
  };
  message?: string;
}

/**
 * Create a Stripe Checkout session for subscription tier upgrade
 */
export async function createCheckoutSession(tier: 'PRO' | 'ADVANCED'): Promise<void> {
  try {
    const response = await fetch('/api/subscription/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tier }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create checkout session');
    }

    const data: CheckoutSessionResponse = await response.json();

    if (data.success && data.data.url) {
      // Redirect to Stripe Checkout
      window.location.href = data.data.url;
    } else {
      throw new Error('Invalid checkout session response');
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Create a Stripe Checkout session for credit top-up purchase
 */
export async function createTopUpCheckout(packageType: 'SMALL' | 'POPULAR' | 'BULK'): Promise<void> {
  try {
    const response = await fetch('/api/subscription/create-topup-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ packageType }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create top-up checkout session');
    }

    const data: CheckoutSessionResponse = await response.json();

    if (data.success && data.data.url) {
      // Redirect to Stripe Checkout
      window.location.href = data.data.url;
    } else {
      throw new Error('Invalid checkout session response');
    }
  } catch (error) {
    console.error('Error creating top-up checkout session:', error);
    throw error;
  }
}

/**
 * Create a Stripe Customer Portal session for self-service management
 */
export async function createCustomerPortal(): Promise<void> {
  try {
    const response = await fetch('/api/subscription/customer-portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create customer portal session');
    }

    const data: CustomerPortalResponse = await response.json();

    if (data.success && data.data.url) {
      // Redirect to Stripe Customer Portal
      window.location.href = data.data.url;
    } else {
      throw new Error('Invalid customer portal response');
    }
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
  }
}

/**
 * Get current subscription status
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
  try {
    const response = await fetch('/api/subscription/status', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get subscription status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw error;
  }
}

/**
 * Get available top-up packages
 */
export async function getTopUpPackages(): Promise<TopUpPackagesResponse> {
  try {
    const response = await fetch('/api/subscription/topup-packages', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get top-up packages');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting top-up packages:', error);
    throw error;
  }
}

/**
 * Get top-up purchase history
 */
export async function getTopUpHistory(limit: number = 50) {
  try {
    const response = await fetch(`/api/subscription/topup-history?limit=${limit}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get top-up history');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting top-up history:', error);
    throw error;
  }
}

// Export all functions as a single object for easier importing
export const subscriptionApi = {
  createCheckoutSession,
  createTopUpCheckout,
  createCustomerPortal,
  getSubscriptionStatus,
  getTopUpPackages,
  getTopUpHistory,
};

export default subscriptionApi;
