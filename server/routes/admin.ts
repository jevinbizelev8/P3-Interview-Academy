import { Router, Request, Response } from "express";
import { db } from "../db";
import {
  users,
  subscriptions,
  creditTransactions,
  creditCosts,
  practiceSessions,
  aiPrepareSessions,
} from "@shared/schema";
import { eq, desc, sql, like, and, or, gte, lt, count } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth-middleware";
import { CreditService } from "../services/credit-service.js";

const router = Router();

// All admin routes require admin authentication
router.use(requireAdmin);

/**
 * GET /api/admin/users
 * List all users with pagination, search, and filters
 */
router.get("/users", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string || "";
    const tierFilter = req.query.tier as string || "";
    const statusFilter = req.query.status as string || "";
    const offset = (page - 1) * limit;

    // Build filter conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`)
        )
      );
    }

    if (tierFilter) {
      conditions.push(eq(users.planType, tierFilter));
    }

    if (statusFilter) {
      conditions.push(eq(users.subscriptionStatus, statusFilter));
    }

    // Get users with filters
    const usersList = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        planType: users.planType,
        subscriptionStatus: users.subscriptionStatus,
        monthlyCreditAllocation: users.monthlyCreditAllocation,
        topUpCredits: users.topUpCredits,
        creditBalance: users.creditBalance,
        createdAt: users.createdAt,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    res.json({
      success: true,
      data: {
        users: usersList,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
    });
  }
});

/**
 * GET /api/admin/users/:id
 * Get detailed user information
 */
router.get("/users/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    // Get user details
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Get credit transactions (last 50)
    const transactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(50);

    // Get subscription info if exists
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          planType: user.planType,
          subscriptionStatus: user.subscriptionStatus,
          monthlyCreditAllocation: user.monthlyCreditAllocation,
          topUpCredits: user.topUpCredits,
          creditBalance: user.creditBalance,
          currentPeriodEnd: user.currentPeriodEnd,
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId,
          createdAt: user.createdAt,
          emailVerified: user.emailVerified,
          role: user.role,
        },
        transactions,
        subscription,
      },
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user details",
    });
  }
});

/**
 * POST /api/admin/users/:id/credits/add
 * Add top-up credits to a user (admin adjustment)
 */
router.post("/users/:id/credits/add", async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { amount, reason } = req.body;
    const adminId = req.user?.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid credit amount",
      });
    }

    const creditService = new CreditService();
    const result = await creditService.addCredits(
      userId,
      amount,
      "admin-adjustment",
      reason || `Admin credit adjustment by ${adminId}`
    );

    res.json({
      success: true,
      data: result,
      message: `Added ${amount} credits to user`,
    });
  } catch (error) {
    console.error("Error adding credits:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add credits",
    });
  }
});

/**
 * POST /api/admin/users/:id/credits/reset
 * Reset monthly credits to tier default
 */
router.post("/users/:id/credits/reset", async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    const creditService = new CreditService();
    const result = await creditService.resetMonthlyCredits(userId);

    res.json({
      success: true,
      data: result,
      message: "Monthly credits reset successfully",
    });
  } catch (error) {
    console.error("Error resetting credits:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset credits",
    });
  }
});

/**
 * PUT /api/admin/users/:id/tier
 * Change user's tier manually
 */
router.put("/users/:id/tier", async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { planType, monthlyCredits } = req.body;

    if (!["FREE", "PRO", "ADVANCED"].includes(planType)) {
      return res.status(400).json({
        success: false,
        error: "Invalid plan type",
      });
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        planType,
        monthlyCreditAllocation: monthlyCredits || 50,
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      data: updatedUser,
      message: `User tier updated to ${planType}`,
    });
  } catch (error) {
    console.error("Error updating tier:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update tier",
    });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user (cascade delete)
 */
router.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const adminId = req.user?.id;

    // Prevent admin from deleting themselves
    if (userId === adminId) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete your own admin account",
      });
    }

    await db.delete(users).where(eq(users.id, userId));

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete user",
    });
  }
});

/**
 * GET /api/admin/credit-costs
 * Get all credit cost configurations
 */
router.get("/credit-costs", async (req: Request, res: Response) => {
  try {
    const costs = await db
      .select()
      .from(creditCosts)
      .orderBy(creditCosts.featureName);

    res.json({
      success: true,
      data: { costs },
    });
  } catch (error) {
    console.error("Error fetching credit costs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch credit costs",
    });
  }
});

/**
 * PUT /api/admin/credit-costs/:id
 * Update credit cost for a feature
 */
router.put("/credit-costs/:id", async (req: Request, res: Response) => {
  try {
    const costId = req.params.id;
    const { creditCost, description, isActive } = req.body;
    const adminId = req.user?.id;

    if (creditCost !== undefined && creditCost < 0) {
      return res.status(400).json({
        success: false,
        error: "Credit cost cannot be negative",
      });
    }

    const [updatedCost] = await db
      .update(creditCosts)
      .set({
        creditCost: creditCost !== undefined ? creditCost : undefined,
        description: description !== undefined ? description : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        updatedBy: adminId,
        updatedAt: new Date(),
      })
      .where(eq(creditCosts.id, costId))
      .returning();

    if (!updatedCost) {
      return res.status(404).json({
        success: false,
        error: "Credit cost configuration not found",
      });
    }

    res.json({
      success: true,
      data: updatedCost,
      message: "Credit cost updated successfully",
    });
  } catch (error) {
    console.error("Error updating credit cost:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update credit cost",
    });
  }
});

/**
 * POST /api/admin/credit-costs
 * Create new credit cost configuration
 */
router.post("/credit-costs", async (req: Request, res: Response) => {
  try {
    const { featureName, creditCost, description } = req.body;
    const adminId = req.user?.id;

    if (!featureName || creditCost === undefined) {
      return res.status(400).json({
        success: false,
        error: "Feature name and credit cost are required",
      });
    }

    const [newCost] = await db
      .insert(creditCosts)
      .values({
        featureName,
        creditCost,
        description: description || `Credits required for ${featureName}`,
        isActive: true,
        updatedBy: adminId,
      })
      .returning();

    res.json({
      success: true,
      data: newCost,
      message: "Credit cost configuration created",
    });
  } catch (error) {
    console.error("Error creating credit cost:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create credit cost configuration",
    });
  }
});

/**
 * GET /api/admin/analytics/users
 * Get user analytics metrics
 */
router.get("/analytics/users", async (req: Request, res: Response) => {
  try {
    // Total users
    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const totalUsers = Number(totalUsersResult[0]?.count || 0);

    // Users by tier
    const tierDistribution = await db
      .select({
        tier: users.planType,
        count: sql<number>`count(*)`,
      })
      .from(users)
      .groupBy(users.planType);

    // Active users (last 30 days) - using createdAt as proxy for activity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo));
    const activeUsers = Number(activeUsersResult[0]?.count || 0);

    // New signups this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const newSignupsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.createdAt, firstDayOfMonth));
    const newSignups = Number(newSignupsResult[0]?.count || 0);

    // User growth trend (last 6 months)
    const growthTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      monthDate.setDate(1);
      monthDate.setHours(0, 0, 0, 0);

      const nextMonth = new Date(monthDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const monthCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          gte(users.createdAt, monthDate),
          lt(users.createdAt, nextMonth)
        ));

      growthTrend.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        signups: Number(monthCountResult[0]?.count || 0),
      });
    }

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        newSignups,
        tierDistribution: tierDistribution.map((t) => ({
          tier: t.tier,
          count: Number(t.count),
        })),
        growthTrend,
      },
    });
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user analytics",
    });
  }
});

/**
 * GET /api/admin/analytics/usage
 * Get credit usage analytics
 */
router.get("/analytics/usage", async (req: Request, res: Response) => {
  try {
    // Total credits consumed (all time)
    const totalCreditsResult = await db
      .select({ total: sql<number>`sum(abs(amount))` })
      .from(creditTransactions)
      .where(sql`amount < 0`);
    const totalCreditsConsumed = Number(totalCreditsResult[0]?.total || 0);

    // Credits consumed this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const monthCreditsResult = await db
      .select({ total: sql<number>`sum(abs(amount))` })
      .from(creditTransactions)
      .where(and(
        sql`amount < 0`,
        gte(creditTransactions.createdAt, firstDayOfMonth)
      ));
    const creditsThisMonth = Number(monthCreditsResult[0]?.total || 0);

    // Credits by feature
    const featureUsage = await db
      .select({
        feature: creditTransactions.feature,
        total: sql<number>`sum(abs(amount))`,
      })
      .from(creditTransactions)
      .where(sql`amount < 0 AND feature IS NOT NULL`)
      .groupBy(creditTransactions.feature);

    // Practice sessions count
    const practiceCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(practiceSessions);
    const practiceSessionsCount = Number(practiceCountResult[0]?.count || 0);

    // Prepare sessions count
    const prepareCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiPrepareSessions);
    const prepareSessionsCount = Number(prepareCountResult[0]?.count || 0);

    // Top 10 users by credit consumption
    const topUsers = await db
      .select({
        userId: creditTransactions.userId,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        totalCredits: sql<number>`sum(abs(${creditTransactions.amount}))`,
      })
      .from(creditTransactions)
      .leftJoin(users, eq(creditTransactions.userId, users.id))
      .where(sql`${creditTransactions.amount} < 0`)
      .groupBy(creditTransactions.userId, users.email, users.firstName, users.lastName)
      .orderBy(desc(sql`sum(abs(${creditTransactions.amount}))`))
      .limit(10);

    // Average credits per user
    const avgCreditsResult = await db
      .select({
        avg: sql<number>`avg(abs(amount))`,
      })
      .from(creditTransactions)
      .where(sql`amount < 0`);
    const averageCreditsPerTransaction = Number(avgCreditsResult[0]?.avg || 0);

    res.json({
      success: true,
      data: {
        totalCreditsConsumed,
        creditsThisMonth,
        practiceSessionsCount,
        prepareSessionsCount,
        featureUsage: featureUsage.map((f) => ({
          feature: f.feature,
          total: Number(f.total),
        })),
        topUsers: topUsers.map((u) => ({
          userId: u.userId,
          email: u.email,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown',
          totalCredits: Number(u.totalCredits),
        })),
        averageCreditsPerTransaction,
      },
    });
  } catch (error) {
    console.error("Error fetching usage analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch usage analytics",
    });
  }
});

/**
 * GET /api/admin/analytics/platform
 * Get platform health metrics
 */
router.get("/analytics/platform", async (req: Request, res: Response) => {
  try {
    // Users with low credits (< 10)
    const lowCreditUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        creditBalance: users.creditBalance,
      })
      .from(users)
      .where(sql`${users.creditBalance} < 10`)
      .orderBy(users.creditBalance)
      .limit(20);

    // Credit distribution histogram (buckets: 0-10, 11-50, 51-100, 101-200, 200+)
    const creditDistribution = await db
      .select({
        bucket: sql<string>`
          CASE
            WHEN credit_balance < 10 THEN '0-10'
            WHEN credit_balance < 50 THEN '10-50'
            WHEN credit_balance < 100 THEN '50-100'
            WHEN credit_balance < 200 THEN '100-200'
            ELSE '200+'
          END
        `,
        count: sql<number>`count(*)`,
      })
      .from(users)
      .groupBy(sql`
        CASE
          WHEN credit_balance < 10 THEN '0-10'
          WHEN credit_balance < 50 THEN '10-50'
          WHEN credit_balance < 100 THEN '50-100'
          WHEN credit_balance < 200 THEN '100-200'
          ELSE '200+'
        END
      `);

    // Upcoming renewals (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingRenewals = await db
      .select({
        userId: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        planType: users.planType,
        currentPeriodEnd: users.currentPeriodEnd,
      })
      .from(users)
      .where(and(
        sql`${users.currentPeriodEnd} IS NOT NULL`,
        sql`${users.currentPeriodEnd} <= ${thirtyDaysFromNow}`,
        sql`${users.currentPeriodEnd} >= NOW()`,
        sql`${users.subscriptionStatus} = 'active'`
      ))
      .orderBy(users.currentPeriodEnd)
      .limit(20);

    res.json({
      success: true,
      data: {
        lowCreditUsers,
        creditDistribution: creditDistribution.map((d) => ({
          bucket: d.bucket,
          count: Number(d.count),
        })),
        upcomingRenewals,
      },
    });
  } catch (error) {
    console.error("Error fetching platform analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch platform analytics",
    });
  }
});

/**
 * GET /api/admin/analytics/revenue
 * Get revenue analytics (mock data until Stripe)
 */
router.get("/analytics/revenue", async (req: Request, res: Response) => {
  try {
    // Count Pro and Advanced users for MRR calculation
    const tierCounts = await db
      .select({
        tier: users.planType,
        count: sql<number>`count(*)`,
      })
      .from(users)
      .where(sql`${users.planType} IN ('PRO', 'ADVANCED')`)
      .groupBy(users.planType);

    let proCount = 0;
    let advancedCount = 0;

    tierCounts.forEach((t) => {
      if (t.tier === 'PRO') proCount = Number(t.count);
      if (t.tier === 'ADVANCED') advancedCount = Number(t.count);
    });

    // Calculate MRR
    const mrr = (proCount * 10) + (advancedCount * 28);
    const activeSubscriptions = proCount + advancedCount;

    // Mock revenue trend (last 6 months)
    const revenueTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);

      // Mock: Simulate gradual MRR growth
      const mockMrr = Math.floor(mrr * (0.7 + (i * 0.05)));

      revenueTrend.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        mrr: mockMrr,
        topups: 0, // No top-ups until Stripe
        total: mockMrr,
      });
    }

    res.json({
      success: true,
      data: {
        mrr,
        topupRevenue: 0,
        totalRevenue: mrr,
        activeSubscriptions,
        proSubscriptions: proCount,
        advancedSubscriptions: advancedCount,
        revenueTrend,
        isMockData: true,
      },
    });
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch revenue analytics",
    });
  }
});

/**
 * GET /api/admin/payments
 * Get payment transactions (mock data until Stripe)
 */
router.get("/payments", async (req: Request, res: Response) => {
  try {
    // Get actual Pro and Advanced users for realistic mock data
    const paidUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        planType: users.planType,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(sql`${users.planType} IN ('PRO', 'ADVANCED')`)
      .limit(50);

    // Generate mock transactions
    const mockTransactions = paidUsers.map((user, index) => {
      const isSubscription = Math.random() > 0.3;
      const amount = user.planType === 'PRO' ? 10 : 28;

      return {
        id: `mock_${user.id}_${index}`,
        userId: user.id,
        userEmail: user.email,
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
        type: isSubscription ? 'subscription' : 'top-up',
        amount: isSubscription ? amount : [10, 45, 160][Math.floor(Math.random() * 3)],
        status: 'paid',
        date: user.createdAt,
        description: isSubscription
          ? `${user.planType} Monthly Subscription`
          : 'Credit Top-Up',
      };
    });

    res.json({
      success: true,
      data: {
        transactions: mockTransactions,
        isMockData: true,
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payments",
    });
  }
});

export default router;
