/**
 * Stripe Test Helpers
 *
 * Comprehensive utilities for testing Stripe payment integration:
 * - Webhook signature generation
 * - Mock checkout sessions
 * - Mock webhook events
 * - Test card numbers
 * - Payment flow simulation
 *
 * @module stripe-helpers
 */

import crypto from 'crypto';
import Stripe from 'stripe';
import { vi } from 'vitest';

/**
 * Test card numbers for various scenarios
 * These are official Stripe test card numbers
 */
export const TEST_CARD_NUMBERS = {
  /** Successful payment */
  SUCCESS: '4242424242424242',
  /** Card declined */
  DECLINED: '4000000000000002',
  /** Insufficient funds */
  INSUFFICIENT_FUNDS: '4000000000009995',
  /** Expired card */
  EXPIRED: '4000000000000069',
  /** Processing error */
  PROCESSING_ERROR: '4000000000000119',
  /** Requires authentication (3D Secure) */
  REQUIRES_AUTH: '4000002500003155',
  /** Attach succeeds, charge fails */
  ATTACH_SUCCEEDS_CHARGE_FAILS: '4000000000000341',
} as const;

/**
 * Stripe credit packages matching server configuration
 */
export const CREDIT_PACKAGES = {
  SMALL: { credits: 100, price: 1000 }, // $10.00 in cents
  POPULAR: { credits: 500, price: 4500 }, // $45.00 in cents
  BULK: { credits: 2000, price: 16000 }, // $160.00 in cents
} as const;

/**
 * Generate a valid Stripe webhook signature for testing
 *
 * @param payload - Webhook payload (stringified JSON)
 * @param secret - Webhook secret (default: test secret)
 * @param timestamp - Unix timestamp (default: current time)
 * @returns Stripe signature string
 *
 * @example
 * const signature = generateWebhookSignature(
 *   JSON.stringify(webhookPayload),
 *   'whsec_test_secret'
 * );
 */
export function generateWebhookSignature(
  payload: string,
  secret: string = process.env.STRIPE_TEST_WEBHOOK_SECRET || 'whsec_test_secret_key',
  timestamp?: number
): string {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  const signedPayload = `${ts}.${payload}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return `t=${ts},v1=${signature}`;
}

/**
 * Create a mock Stripe checkout session
 *
 * @param userId - User ID for metadata
 * @param credits - Number of credits purchased
 * @param packageType - Package type (SMALL | POPULAR | BULK)
 * @param paymentStatus - Payment status (default: 'paid')
 * @returns Mock Stripe checkout session object
 *
 * @example
 * const session = createMockCheckoutSession('user-123', 500, 'POPULAR');
 */
export function createMockCheckoutSession(
  userId: string,
  credits: number,
  packageType: 'SMALL' | 'POPULAR' | 'BULK' = 'POPULAR',
  paymentStatus: 'paid' | 'unpaid' | 'no_payment_required' = 'paid'
): Stripe.Checkout.Session {
  const packagePrice = CREDIT_PACKAGES[packageType].price;

  return {
    id: `cs_test_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    object: 'checkout.session',
    payment_status: paymentStatus,
    status: paymentStatus === 'paid' ? 'complete' : 'open',
    mode: 'payment',
    customer: `cus_test_${Math.random().toString(36).substring(7)}`,
    customer_email: 'test@example.com',
    metadata: {
      userId,
      topUpCredits: credits.toString(),
      packageType,
    },
    amount_total: packagePrice,
    amount_subtotal: packagePrice,
    currency: 'usd',
    payment_intent: `pi_test_${Math.random().toString(36).substring(7)}`,
    created: Math.floor(Date.now() / 1000),
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    url: 'https://checkout.stripe.com/test',
    success_url: 'https://example.com/success',
    cancel_url: 'https://example.com/cancel',
  } as Stripe.Checkout.Session;
}

/**
 * Create a mock Stripe webhook event
 *
 * @param type - Event type (e.g., 'checkout.session.completed')
 * @param data - Event data object
 * @param eventId - Optional custom event ID
 * @returns Mock Stripe event object
 *
 * @example
 * const event = createMockWebhookEvent(
 *   'checkout.session.completed',
 *   session
 * );
 */
export function createMockWebhookEvent(
  type: string,
  data: any,
  eventId?: string
): Stripe.Event {
  return {
    id: eventId || `evt_test_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    object: 'event',
    type: type as any,
    data: {
      object: data,
    },
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 0,
    request: {
      id: `req_${Math.random().toString(36).substring(7)}`,
      idempotency_key: `idem_${Math.random().toString(36).substring(7)}`,
    },
    api_version: '2023-10-16',
  } as Stripe.Event;
}

/**
 * Create a complete webhook payload with signature
 *
 * @param type - Event type
 * @param data - Event data
 * @param secret - Webhook secret
 * @returns Object with payload string and signature
 *
 * @example
 * const { payload, signature } = createWebhookPayload(
 *   'checkout.session.completed',
 *   session,
 *   'whsec_test_secret'
 * );
 *
 * // Use in test:
 * await request(app)
 *   .post('/api/webhooks/stripe')
 *   .set('stripe-signature', signature)
 *   .send(payload);
 */
export function createWebhookPayload(
  type: string,
  data: any,
  secret?: string
): {
  payload: string;
  signature: string;
  event: Stripe.Event;
} {
  const event = createMockWebhookEvent(type, data);
  const payload = JSON.stringify(event);
  const signature = generateWebhookSignature(payload, secret);

  return {
    payload,
    signature,
    event,
  };
}

/**
 * Create a mock successful payment event
 *
 * @param userId - User ID
 * @param credits - Number of credits
 * @param packageType - Package type
 * @returns Complete webhook payload ready for testing
 *
 * @example
 * const webhook = createSuccessfulPaymentEvent('user-123', 500, 'POPULAR');
 * await request(app)
 *   .post('/api/webhooks/stripe')
 *   .set('stripe-signature', webhook.signature)
 *   .send(webhook.payload);
 */
export function createSuccessfulPaymentEvent(
  userId: string,
  credits: number,
  packageType: 'SMALL' | 'POPULAR' | 'BULK' = 'POPULAR'
): {
  payload: string;
  signature: string;
  event: Stripe.Event;
  session: Stripe.Checkout.Session;
} {
  const session = createMockCheckoutSession(userId, credits, packageType, 'paid');
  const { payload, signature, event } = createWebhookPayload(
    'checkout.session.completed',
    session
  );

  return {
    payload,
    signature,
    event,
    session,
  };
}

/**
 * Create a mock failed payment event
 *
 * @param userId - User ID
 * @param credits - Number of credits
 * @param reason - Failure reason
 * @returns Complete webhook payload for failed payment
 *
 * @example
 * const webhook = createFailedPaymentEvent('user-123', 500, 'card_declined');
 */
export function createFailedPaymentEvent(
  userId: string,
  credits: number,
  reason: string = 'card_declined'
): {
  payload: string;
  signature: string;
  event: Stripe.Event;
} {
  const data = {
    id: `cs_test_${Date.now()}`,
    object: 'checkout.session',
    payment_status: 'unpaid',
    status: 'expired',
    metadata: {
      userId,
      topUpCredits: credits.toString(),
    },
    last_payment_error: {
      message: reason,
    },
  };

  return createWebhookPayload('checkout.session.expired', data);
}

/**
 * Create a mock customer object
 *
 * @param email - Customer email
 * @param customerId - Optional custom customer ID
 * @returns Mock Stripe customer object
 *
 * @example
 * const customer = createMockCustomer('test@example.com');
 */
export function createMockCustomer(
  email: string,
  customerId?: string
): Stripe.Customer {
  return {
    id: customerId || `cus_test_${Math.random().toString(36).substring(7)}`,
    object: 'customer',
    email,
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    metadata: {},
  } as Stripe.Customer;
}

/**
 * Create a mock payment intent
 *
 * @param amount - Amount in cents
 * @param currency - Currency code (default: 'usd')
 * @param status - Payment intent status (default: 'succeeded')
 * @returns Mock Stripe payment intent object
 *
 * @example
 * const intent = createMockPaymentIntent(4500, 'usd', 'succeeded');
 */
export function createMockPaymentIntent(
  amount: number,
  currency: string = 'usd',
  status: Stripe.PaymentIntent.Status = 'succeeded'
): Stripe.PaymentIntent {
  return {
    id: `pi_test_${Math.random().toString(36).substring(7)}`,
    object: 'payment_intent',
    amount,
    currency,
    status,
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    metadata: {},
  } as Stripe.PaymentIntent;
}

/**
 * Verify webhook signature (for testing signature verification logic)
 *
 * @param payload - Webhook payload string
 * @param signature - Stripe signature header
 * @param secret - Webhook secret
 * @returns True if signature is valid
 *
 * @example
 * const isValid = verifyWebhookSignature(payload, signature, secret);
 * expect(isValid).toBe(true);
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const parts = signature.split(',');
    const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
    const receivedSignature = parts.find(p => p.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !receivedSignature) {
      return false;
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    return expectedSignature === receivedSignature;
  } catch (error) {
    return false;
  }
}

/**
 * Create multiple webhook events for testing duplicate prevention
 *
 * @param userId - User ID
 * @param credits - Number of credits
 * @param count - Number of duplicate events (default: 3)
 * @returns Array of identical webhook payloads
 *
 * @example
 * const duplicates = createDuplicateWebhooks('user-123', 500, 3);
 * // Send all duplicates to test idempotency
 */
export function createDuplicateWebhooks(
  userId: string,
  credits: number,
  count: number = 3
): Array<{
  payload: string;
  signature: string;
  event: Stripe.Event;
}> {
  const session = createMockCheckoutSession(userId, credits, 'POPULAR', 'paid');
  const baseEvent = createMockWebhookEvent('checkout.session.completed', session);

  return Array(count).fill(null).map(() => {
    const payload = JSON.stringify(baseEvent);
    const signature = generateWebhookSignature(payload);
    return {
      payload,
      signature,
      event: baseEvent,
    };
  });
}

/**
 * Mock Stripe SDK methods for testing
 *
 * @returns Object with mock Stripe SDK methods
 *
 * @example
 * const mockStripe = createMockStripeSDK();
 * mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
 */
export function createMockStripeSDK() {
  return {
    checkout: {
      sessions: {
        create: vi.fn(),
        retrieve: vi.fn(),
        list: vi.fn(),
      },
    },
    customers: {
      create: vi.fn(),
      retrieve: vi.fn(),
      list: vi.fn(),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
    paymentIntents: {
      create: vi.fn(),
      retrieve: vi.fn(),
      confirm: vi.fn(),
    },
  };
}

/**
 * Create a test price object
 *
 * @param amount - Amount in cents
 * @param productId - Product ID
 * @returns Mock Stripe price object
 *
 * @example
 * const price = createMockPrice(4500, 'prod_popular');
 */
export function createMockPrice(
  amount: number,
  productId: string
): Stripe.Price {
  return {
    id: `price_test_${Math.random().toString(36).substring(7)}`,
    object: 'price',
    active: true,
    currency: 'usd',
    unit_amount: amount,
    product: productId,
    type: 'one_time',
    created: Math.floor(Date.now() / 1000),
    livemode: false,
  } as Stripe.Price;
}

/**
 * Simulate webhook retry with exponential backoff
 *
 * @param basePayload - Original webhook payload
 * @param retryCount - Retry attempt number (1-3)
 * @returns Modified webhook with retry headers
 *
 * @example
 * const retryWebhook = simulateWebhookRetry(originalWebhook, 2);
 */
export function simulateWebhookRetry(
  basePayload: { payload: string; signature: string; event: Stripe.Event },
  retryCount: number
): {
  payload: string;
  signature: string;
  event: Stripe.Event;
  retryCount: number;
} {
  return {
    ...basePayload,
    retryCount,
  };
}
