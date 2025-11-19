import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { ReferralService } from "../services/referral-service";

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const applyReferralSchema = z.object({
  referralCode: z.string().min(1, "Referral code is required").max(50),
  referredEmail: z.string().email("Invalid email format"),
  referredUserId: z.string().uuid().optional(),
});

// ============================================================================
// Referral Endpoints
// ============================================================================

/**
 * POST /api/referrals/create
 * Generate a referral code for the user
 */
router.post(
  "/create",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const code = await ReferralService.generateReferralCode(userId);

      const baseUrl = process.env.APP_URL_PROD || process.env.APP_URL_DEV || "http://localhost:5000";
      const referralUrl = `${baseUrl}/signup?ref=${code}`;

      res.status(201).json({
        success: true,
        data: {
          code,
          referralUrl,
          message: "Referral code created successfully",
        },
      });
    } catch (error) {
      console.error("Error creating referral code:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create referral code",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/referrals/code
 * Get user's existing referral code (or generate if doesn't exist)
 */
router.get(
  "/code",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { code, referralUrl } = await ReferralService.getUserReferralCode(userId);

      res.status(200).json({
        success: true,
        data: {
          code,
          referralUrl,
        },
      });
    } catch (error) {
      console.error("Error getting referral code:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get referral code",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * POST /api/referrals/apply
 * Apply a referral code (when a new user signs up with a referral)
 */
router.post(
  "/apply",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = applyReferralSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: "Invalid request data",
          details: validation.error.errors,
        });
        return;
      }

      const { referralCode, referredEmail, referredUserId } = validation.data;

      // Validate that user isn't applying their own code
      if (referredUserId && req.user?.id === referredUserId) {
        res.status(400).json({
          success: false,
          error: "Cannot use your own referral code",
        });
        return;
      }

      const referral = await ReferralService.applyReferralCode(
        referralCode,
        referredEmail,
        referredUserId
      );

      res.status(201).json({
        success: true,
        data: {
          referral,
          message: "Referral code applied successfully",
        },
      });
    } catch (error) {
      console.error("Error applying referral code:", error);

      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes("Invalid referral code")) {
          res.status(404).json({
            success: false,
            error: "Invalid referral code",
            details: "The referral code you entered does not exist",
          });
          return;
        }
        if (error.message.includes("Cannot use your own")) {
          res.status(400).json({
            success: false,
            error: "Self-referral not allowed",
            details: "You cannot use your own referral code",
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: "Failed to apply referral code",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/referrals/stats
 * Get user's referral statistics
 */
router.get(
  "/stats",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const stats = await ReferralService.getReferralStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting referral stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get referral statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/referrals/referrals
 * Get list of user's referrals
 */
router.get(
  "/referrals",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

      const referrals = await ReferralService.getUserReferrals(userId, limit);

      // Format response (don't expose sensitive email addresses fully)
      const formattedReferrals = referrals.map((r) => ({
        id: r.id,
        referralCode: r.referralCode,
        referredEmail: maskEmail(r.referredEmail),
        status: r.status,
        rewardValue: r.rewardValue,
        rewardGiven: r.rewardGiven,
        referredAt: r.referredAt,
        signedUpAt: r.signedUpAt,
        rewardGivenAt: r.rewardGivenAt,
      }));

      res.status(200).json({
        success: true,
        data: {
          referrals: formattedReferrals,
          total: referrals.length,
          limit,
        },
      });
    } catch (error) {
      console.error("Error getting referrals:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get referrals",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Mask email for privacy (show first 2 chars and domain)
 * e.g., "john.doe@example.com" -> "jo****@example.com"
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return email;

  const visibleChars = Math.min(2, localPart.length);
  const masked = localPart.substring(0, visibleChars) + "****";

  return `${masked}@${domain}`;
}

export default router;
