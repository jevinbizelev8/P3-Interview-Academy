import { Router } from "express";
import { CreditService } from "../services/credit-service";
import { requireAuth } from "../middleware/auth-middleware";

const router = Router();

/**
 * GET /api/credits/balance
 * Get user's current credit balance with breakdown
 */
router.get('/balance', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
        code: "UNAUTHORIZED",
      });
    }

    const credits = await CreditService.getTotalCredits(userId);

    res.json({
      success: true,
      data: {
        totalCredits: credits.totalCredits,
        monthlyCredits: credits.monthlyCredits,
        topUpCredits: credits.topUpCredits,
        breakdown: {
          subscription: {
            credits: credits.monthlyCredits,
            description: "Monthly subscription credits (resets each billing cycle)",
          },
          topUp: {
            credits: credits.topUpCredits,
            description: "One-time purchased credits (never expire)",
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    res.status(500).json({
      message: "Failed to fetch credit balance",
      code: "FETCH_BALANCE_ERROR",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/credits/history
 * Get user's credit transaction history
 * Query params:
 *   - limit: number (default: 50, max: 200)
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
        code: "UNAUTHORIZED",
      });
    }

    // Parse and validate limit parameter
    const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const limit = Math.min(Math.max(limitParam, 1), 200); // Clamp between 1 and 200

    const transactions = await CreditService.getCreditHistory(userId, limit);

    res.json({
      success: true,
      data: {
        transactions: transactions.map(t => ({
          id: t.id,
          type: t.transactionType,
          amount: t.creditsAmount,
          balanceAfter: t.balanceAfter,
          description: t.description,
          feature: t.featureUsed,
          sessionId: t.relatedSessionId,
          timestamp: t.createdAt,
        })),
        count: transactions.length,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching credit history:', error);
    res.status(500).json({
      message: "Failed to fetch credit history",
      code: "FETCH_HISTORY_ERROR",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/credits/costs
 * Get all credit cost configurations for features
 */
router.get('/costs', requireAuth, async (req, res) => {
  try {
    const costs = await CreditService.getAllCreditCosts();

    res.json({
      success: true,
      data: {
        costs: costs
          .filter(c => c.isActive) // Only return active costs to users
          .map(c => ({
            feature: c.featureName,
            creditCost: c.creditCost,
            description: c.description,
          })),
      },
    });
  } catch (error) {
    console.error('Error fetching credit costs:', error);
    res.status(500).json({
      message: "Failed to fetch credit costs",
      code: "FETCH_COSTS_ERROR",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/credits/check
 * Check if user has enough credits for a specific feature
 * Body: { featureName: string }
 */
router.post('/check', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { featureName } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
        code: "UNAUTHORIZED",
      });
    }

    if (!featureName) {
      return res.status(400).json({
        message: "Feature name is required",
        code: "MISSING_FEATURE_NAME",
      });
    }

    const creditCheck = await CreditService.checkCredits(userId, featureName);

    res.json({
      success: true,
      data: {
        hasEnoughCredits: creditCheck.hasEnoughCredits,
        currentBalance: creditCheck.currentBalance,
        creditsNeeded: creditCheck.creditsNeeded,
        monthlyCredits: creditCheck.monthlyCredits,
        topUpCredits: creditCheck.topUpCredits,
        canProceed: creditCheck.hasEnoughCredits,
      },
    });
  } catch (error) {
    console.error('Error checking credits:', error);
    res.status(500).json({
      message: "Failed to check credits",
      code: "CREDIT_CHECK_ERROR",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
