import type { RequestHandler } from "express";
import { CreditService } from "../services/credit-service";

/**
 * Credit Check Middleware Factory
 *
 * Creates middleware that checks if user has sufficient credits for a feature
 * Returns 402 Payment Required if credits are insufficient
 */
export function requireCredits(featureName: string): RequestHandler {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Authentication required",
          code: "UNAUTHORIZED",
        });
      }

      // Check if user has enough credits
      const creditCheck = await CreditService.checkCredits(userId, featureName);

      if (!creditCheck.hasEnoughCredits) {
        // Set custom header for client-side credit tracking
        res.setHeader('X-Credits-Remaining', creditCheck.currentBalance.toString());

        return res.status(402).json({
          message: `Insufficient credits to use ${featureName}`,
          code: "INSUFFICIENT_CREDITS",
          error: "You don't have enough credits to perform this action",
          creditsNeeded: creditCheck.creditsNeeded,
          currentBalance: creditCheck.currentBalance,
          monthlyCredits: creditCheck.monthlyCredits,
          topUpCredits: creditCheck.topUpCredits,
          upgradeUrl: "/billing",
          suggestion: creditCheck.currentBalance === 0
            ? "Your credits have been depleted. Please upgrade your plan or purchase top-up credits."
            : `You need ${creditCheck.creditsNeeded} credit(s), but only have ${creditCheck.currentBalance}.`,
        });
      }

      // User has enough credits - attach credit info to request for downstream use
      (req as any).creditCheck = creditCheck;

      // Set header for client-side tracking
      res.setHeader('X-Credits-Remaining', creditCheck.currentBalance.toString());

      // Log successful credit check
      console.log(
        `✅ Credit check passed for user ${userId}: ` +
        `${featureName} (${creditCheck.creditsNeeded} credits, ` +
        `balance: ${creditCheck.currentBalance})`
      );

      next();
    } catch (error) {
      console.error('Error in credit check middleware:', error);
      res.status(500).json({
        message: "Failed to check credits",
        code: "CREDIT_CHECK_ERROR",
      });
    }
  };
}

/**
 * Middleware to deduct credits after successful session creation
 * Should be called AFTER the resource is created to avoid charging for failed operations
 *
 * Usage:
 *   router.post('/sessions', requireCredits('practice-session'), createSession, deductCreditsAfter('practice-session'));
 */
export function deductCreditsAfter(featureName: string): RequestHandler {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Authentication required",
          code: "UNAUTHORIZED",
        });
      }

      // Get session ID from the response (should be set by previous middleware)
      const sessionId = (req as any).sessionId || (res as any).sessionId || null;

      // Deduct credits
      const result = await CreditService.deductCredits(
        userId,
        featureName,
        sessionId,
        `Credit deducted for ${featureName}`
      );

      // Attach deduction result to response for downstream use
      (res as any).creditDeduction = result;

      // Update header with new balance
      res.setHeader('X-Credits-Remaining', result.balanceAfter.toString());

      console.log(
        `💳 Credits deducted for user ${userId}: ` +
        `${featureName} (${result.monthlyCreditsUsed} monthly + ${result.topUpCreditsUsed} top-up). ` +
        `New balance: ${result.balanceAfter}`
      );

      next();
    } catch (error) {
      console.error('Error deducting credits:', error);

      // Don't block the request if deduction fails, but log the error
      // This prevents users from losing their session if credit deduction has issues
      console.error(
        '⚠️  Credit deduction failed, but allowing request to proceed. ' +
        'Manual adjustment may be needed.'
      );

      next();
    }
  };
}

/**
 * Extended Express Request type with credit information
 */
declare global {
  namespace Express {
    interface Request {
      creditCheck?: {
        hasEnoughCredits: boolean;
        currentBalance: number;
        creditsNeeded: number;
        monthlyCredits: number;
        topUpCredits: number;
      };
    }
  }
}
