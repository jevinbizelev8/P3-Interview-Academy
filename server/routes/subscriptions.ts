import { Router, Request, Response } from 'express';
import { subscriptionService } from '../services/subscription-service.js';
import { topUpService } from '../services/topup-service.js';

const router = Router();

/**
 * Create Stripe Checkout session for subscription upgrade
 * POST /api/subscription/create-checkout
 */
router.post('/create-checkout', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { tier } = req.body;

    // Validate tier
    if (!tier || (tier !== 'PRO' && tier !== 'ADVANCED')) {
      return res.status(400).json({
        message: 'Invalid tier. Must be PRO or ADVANCED',
      });
    }

    // Create checkout session
    const { sessionId, url } = await subscriptionService.createCheckoutSession(
      req.user.id,
      tier
    );

    res.json({
      success: true,
      data: {
        sessionId,
        url,
      },
      message: 'Checkout session created',
    });
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    res.status(500).json({
      message: 'Failed to create checkout session',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Create Stripe Checkout session for credit top-up
 * POST /api/subscription/create-topup-checkout
 */
router.post('/create-topup-checkout', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { packageType } = req.body;

    // Validate package type
    if (!topUpService.validatePackageType(packageType)) {
      return res.status(400).json({
        message: 'Invalid package type. Must be SMALL, POPULAR, or BULK',
      });
    }

    // Create top-up checkout session
    const { sessionId, url } = await topUpService.createTopUpCheckout(
      req.user.id,
      packageType
    );

    res.json({
      success: true,
      data: {
        sessionId,
        url,
      },
      message: 'Top-up checkout session created',
    });
  } catch (error) {
    console.error('❌ Error creating top-up checkout session:', error);
    res.status(500).json({
      message: 'Failed to create top-up checkout session',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Create Stripe Customer Portal session for self-service management
 * POST /api/subscription/customer-portal
 */
router.post('/customer-portal', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Create customer portal session
    const { url } = await subscriptionService.createCustomerPortalSession(
      req.user.id
    );

    res.json({
      success: true,
      data: { url },
      message: 'Customer portal session created',
    });
  } catch (error) {
    console.error('❌ Error creating customer portal session:', error);
    res.status(500).json({
      message: 'Failed to create customer portal session',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get current subscription status
 * GET /api/subscription/status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const status = await subscriptionService.getSubscriptionStatus(req.user.id);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('❌ Error getting subscription status:', error);
    res.status(500).json({
      message: 'Failed to get subscription status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get available top-up packages
 * GET /api/subscription/topup-packages
 */
router.get('/topup-packages', async (req: Request, res: Response) => {
  try {
    const packages = topUpService.getTopUpPackages();

    res.json({
      success: true,
      data: { packages },
    });
  } catch (error) {
    console.error('❌ Error getting top-up packages:', error);
    res.status(500).json({
      message: 'Failed to get top-up packages',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get top-up purchase history
 * GET /api/subscription/topup-history
 */
router.get('/topup-history', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const history = await topUpService.getTopUpHistory(req.user.id, limit);

    res.json({
      success: true,
      data: { history },
    });
  } catch (error) {
    console.error('❌ Error getting top-up history:', error);
    res.status(500).json({
      message: 'Failed to get top-up history',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
