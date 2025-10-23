import Stripe from 'stripe';

// Environment-based Stripe configuration
const STRIPE_MODE = process.env.STRIPE_MODE || 'test';
const isTestMode = STRIPE_MODE === 'test';

// Get the appropriate Stripe secret key based on mode
const STRIPE_SECRET_KEY = isTestMode
  ? process.env.STRIPE_TEST_SECRET_KEY
  : process.env.STRIPE_LIVE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  throw new Error(
    `Missing Stripe secret key for ${STRIPE_MODE} mode. ` +
    `Please set ${isTestMode ? 'STRIPE_TEST_SECRET_KEY' : 'STRIPE_LIVE_SECRET_KEY'} in environment variables.`
  );
}

// Initialize Stripe SDK
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
  appInfo: {
    name: 'P3 Interview Academy',
    version: '1.0.0',
  },
});

// Stripe Price IDs (auto-populated by setup-stripe-products.ts script)
// These are loaded from environment variables after running the product creation script
export const STRIPE_PRICE_IDS = {
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
  ADVANCED_MONTHLY: process.env.STRIPE_PRICE_ADVANCED_MONTHLY || '',
  TOPUP_100: process.env.STRIPE_PRICE_TOPUP_100 || '',
  TOPUP_500: process.env.STRIPE_PRICE_TOPUP_500 || '',
  TOPUP_2000: process.env.STRIPE_PRICE_TOPUP_2000 || '',
} as const;

// Subscription tier configurations
export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    pricePerMonth: 0,
    credits: 50,
    stripePriceId: null,
  },
  PRO: {
    name: 'Pro',
    pricePerMonth: 10,
    credits: 100,
    stripePriceId: STRIPE_PRICE_IDS.PRO_MONTHLY,
  },
  ADVANCED: {
    name: 'Advanced',
    pricePerMonth: 28,
    credits: 280,
    stripePriceId: STRIPE_PRICE_IDS.ADVANCED_MONTHLY,
  },
} as const;

// Top-up package configurations
export const TOPUP_PACKAGES = {
  SMALL: {
    credits: 100,
    price: 10,
    stripePriceId: STRIPE_PRICE_IDS.TOPUP_100,
  },
  POPULAR: {
    credits: 500,
    price: 45,
    stripePriceId: STRIPE_PRICE_IDS.TOPUP_500,
    savings: 10, // 10% savings
  },
  BULK: {
    credits: 2000,
    price: 160,
    stripePriceId: STRIPE_PRICE_IDS.TOPUP_2000,
    savings: 20, // 20% savings
  },
} as const;

// Stripe Checkout URLs
const BASE_URL = process.env.NODE_ENV === 'production'
  ? (process.env.APP_URL_PROD || 'https://p3app.bizelev8.ai')
  : (process.env.APP_URL_DEV || 'http://localhost:5000');

export const STRIPE_URLS = {
  SUCCESS: process.env.STRIPE_SUCCESS_URL || `${BASE_URL}/billing?success=true`,
  CANCEL: process.env.STRIPE_CANCEL_URL || `${BASE_URL}/billing?canceled=true`,
} as const;

// Stripe webhook secrets
export const STRIPE_WEBHOOK_SECRET = isTestMode
  ? process.env.STRIPE_TEST_WEBHOOK_SECRET
  : process.env.STRIPE_LIVE_WEBHOOK_SECRET;

if (!STRIPE_WEBHOOK_SECRET) {
  console.warn(
    `⚠️  Warning: Stripe webhook secret not configured for ${STRIPE_MODE} mode. ` +
    `Webhook signature verification will fail. ` +
    `Set ${isTestMode ? 'STRIPE_TEST_WEBHOOK_SECRET' : 'STRIPE_LIVE_WEBHOOK_SECRET'} environment variable.`
  );
}

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  try {
    // Search for existing customer by email
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0];
      console.log(`✅ Found existing Stripe customer: ${customer.id} for ${email}`);
      return customer.id;
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name: name || undefined,
      metadata: {
        userId,
      },
    });

    console.log(`✅ Created new Stripe customer: ${customer.id} for ${email}`);
    return customer.id;
  } catch (error) {
    console.error('❌ Error getting/creating Stripe customer:', error);
    throw new Error('Failed to create Stripe customer');
  }
}

/**
 * Get subscription tier from Stripe price ID
 */
export function getTierFromPriceId(priceId: string): 'PRO' | 'ADVANCED' | null {
  if (priceId === STRIPE_PRICE_IDS.PRO_MONTHLY) return 'PRO';
  if (priceId === STRIPE_PRICE_IDS.ADVANCED_MONTHLY) return 'ADVANCED';
  return null;
}

/**
 * Get top-up package from Stripe price ID
 */
export function getTopUpFromPriceId(priceId: string): { credits: number; price: number } | null {
  if (priceId === STRIPE_PRICE_IDS.TOPUP_100) return { credits: 100, price: 10 };
  if (priceId === STRIPE_PRICE_IDS.TOPUP_500) return { credits: 500, price: 45 };
  if (priceId === STRIPE_PRICE_IDS.TOPUP_2000) return { credits: 2000, price: 160 };
  return null;
}

/**
 * Verify that all required Stripe Price IDs are configured
 */
export function verifyPriceIdsConfigured(): boolean {
  const missingPriceIds = Object.entries(STRIPE_PRICE_IDS)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingPriceIds.length > 0) {
    console.warn(
      `⚠️  Warning: Missing Stripe Price IDs: ${missingPriceIds.join(', ')}. ` +
      `Run 'npx tsx server/scripts/setup-stripe-products.ts' to create products and populate Price IDs.`
    );
    return false;
  }

  return true;
}

// Log configuration on startup
console.log(`🔧 Stripe Configuration:`);
console.log(`   Mode: ${STRIPE_MODE}`);
console.log(`   API Key: ${STRIPE_SECRET_KEY.substring(0, 20)}...`);
console.log(`   Webhook Secret: ${STRIPE_WEBHOOK_SECRET ? STRIPE_WEBHOOK_SECRET.substring(0, 20) + '...' : 'Not configured'}`);
console.log(`   Price IDs configured: ${verifyPriceIdsConfigured() ? 'Yes ✅' : 'No ⚠️'}`);
