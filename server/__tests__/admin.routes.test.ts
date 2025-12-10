import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Admin Routes Test Suite
 *
 * Comprehensive testing of admin credit management, bulk operations, and security.
 * Tests cover authorization, validation, credit operations, and error handling.
 *
 * Coverage Requirements: 25+ tests
 * - Credit Management: 8 tests
 * - Bulk Operations: 6 tests
 * - User Management: 5 tests
 * - Authorization & Security: 4 tests
 * - Additional Operations: 6 tests
 */

// Test user IDs
const ADMIN_USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const REGULAR_USER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const TARGET_USER_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

// Shared query chain for database mocking
let queryChain: any;
let modifyChain: any;

// Mock CreditService
const creditServiceMock = vi.hoisted(() => ({
  addCredits: vi.fn(),
  resetMonthlyCredits: vi.fn(),
  getCreditCost: vi.fn(),
}));

// Mock AuditService
const auditServiceMock = vi.hoisted(() => ({
  log: vi.fn(),
  getLogs: vi.fn(),
  getActions: vi.fn(),
  getAdmins: vi.fn(),
}));

// Mock auth middleware
const authMiddlewareMock = vi.hoisted(() => ({
  requireAdmin: vi.fn((req: any, res: any, next: any) => next()),
}));

// Mock rate limiter
vi.mock("express-rate-limit", () => ({
  default: vi.fn(() => (req: any, res: any, next: any) => next()),
}));

// Mock database
vi.mock("../db", () => ({
  db: {
    select: vi.fn(() => queryChain),
    insert: vi.fn(() => modifyChain),
    update: vi.fn(() => modifyChain),
    delete: vi.fn(() => modifyChain),
    transaction: vi.fn(),
  },
}));

// Mock services
vi.mock("../services/credit-service", () => ({
  CreditService: creditServiceMock,
}));

vi.mock("../services/audit-service", () => ({
  AuditService: auditServiceMock,
}));

vi.mock("../middleware/auth-middleware", () => ({
  requireAdmin: authMiddlewareMock.requireAdmin,
}));

vi.mock("../middleware/audit-middleware", () => ({
  auditLog: () => (req: any, res: any, next: any) => {
    auditServiceMock.log({
      adminId: req.user?.id,
      action: "TEST_ACTION",
      targetUserId: req.params?.id,
    });
    next();
  },
}));

describe("Admin Routes", () => {
  beforeEach(async () => {
    // Reset all service mocks
    Object.values(creditServiceMock).forEach(mockFn => mockFn.mockReset?.());
    Object.values(auditServiceMock).forEach(mockFn => mockFn.mockReset?.());
    authMiddlewareMock.requireAdmin.mockReset();

    // Create fresh chainable query mocks
    queryChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue([]),
    };

    modifyChain = {
      values: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
      then: vi.fn().mockResolvedValue(undefined), // Default: resolve with undefined
    };

    // Default: allow admin access
    authMiddlewareMock.requireAdmin.mockImplementation((req: any, res: any, next: any) => next());

    // Mock audit logging
    auditServiceMock.log.mockResolvedValue(undefined);

    await vi.resetModules();
  });

  // Helper to create app with admin user
  async function createAdminApp() {
    const { default: adminRouter } = await import("../routes/admin");
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = { id: ADMIN_USER_ID, role: "admin", email: "admin@test.com" };
      // Set referer to bypass CSRF protection in tests
      req.headers.referer = "http://localhost:5000";
      req.headers.host = "localhost:5000";
      next();
    });
    app.use("/api/admin", adminRouter);
    return app;
  }

  // Helper to create app with regular user
  async function createUserApp() {
    const { default: adminRouter } = await import("../routes/admin");
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = { id: REGULAR_USER_ID, role: "user", email: "user@test.com" };
      next();
    });
    app.use("/api/admin", adminRouter);
    return app;
  }

  // Helper to create app with no authentication
  async function createUnauthApp() {
    const { default: adminRouter } = await import("../routes/admin");
    const app = express();
    app.use(express.json());
    app.use("/api/admin", adminRouter);
    return app;
  }

  describe("Authorization Tests", () => {
    it("blocks non-admin users from accessing admin routes (403)", async () => {
      authMiddlewareMock.requireAdmin.mockImplementation((req: any, res: any) => {
        return res.status(403).json({
          message: "Admin access required",
          code: "ADMIN_REQUIRED",
        });
      });

      const app = await createUserApp();
      const res = await request(app).get("/api/admin/users");

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/admin access required/i);
    });

    it("blocks unauthenticated requests (401)", async () => {
      authMiddlewareMock.requireAdmin.mockImplementation((req: any, res: any) => {
        return res.status(401).json({
          message: "Authentication required",
          code: "UNAUTHORIZED",
        });
      });

      const app = await createUnauthApp();
      const res = await request(app).get("/api/admin/users");

      expect(res.status).toBe(401);
      expect(res.body.message).toBeDefined();
    });

    it("allows admin users to access admin routes", async () => {
      const app = await createAdminApp();

      queryChain.then.mockResolvedValueOnce([{ id: TARGET_USER_ID, email: "test@example.com" }]);
      queryChain.then.mockResolvedValueOnce([{ count: 1 }]);

      const res = await request(app).get("/api/admin/users");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("verifies admin middleware is applied", async () => {
      const app = await createAdminApp();

      queryChain.then.mockResolvedValueOnce([]);
      queryChain.then.mockResolvedValueOnce([{ count: 0 }]);

      await request(app).get("/api/admin/users");

      expect(authMiddlewareMock.requireAdmin).toHaveBeenCalled();
    });
  });

  describe("Credit Management Tests", () => {
    it("admin adds credits to user account", async () => {
      const app = await createAdminApp();

      creditServiceMock.addCredits.mockResolvedValueOnce({
        success: true,
        balanceAfter: 150,
        transactionId: "trans-123",
      });

      const res = await request(app)
        .post(`/api/admin/users/${TARGET_USER_ID}/credits/add`)
        .send({ amount: 100, reason: "Performance bonus" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.balanceAfter).toBe(150);
      expect(creditServiceMock.addCredits).toHaveBeenCalledWith(
        TARGET_USER_ID,
        100,
        "admin-adjustment",
        expect.stringContaining("Performance bonus")
      );
    });

    it("validates credit amount (rejects negative)", async () => {
      const app = await createAdminApp();

      const res = await request(app)
        .post(`/api/admin/users/${TARGET_USER_ID}/credits/add`)
        .send({ amount: -10, reason: "Test" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/invalid credit amount/i);
      expect(creditServiceMock.addCredits).not.toHaveBeenCalled();
    });

    it("validates credit amount (rejects zero)", async () => {
      const app = await createAdminApp();

      const res = await request(app)
        .post(`/api/admin/users/${TARGET_USER_ID}/credits/add`)
        .send({ amount: 0, reason: "Test" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/invalid credit amount/i);
    });

    it("creates transaction record when adding credits", async () => {
      const app = await createAdminApp();

      const transactionId = "trans-456";
      creditServiceMock.addCredits.mockResolvedValueOnce({
        success: true,
        balanceAfter: 200,
        transactionId,
      });

      const res = await request(app)
        .post(`/api/admin/users/${TARGET_USER_ID}/credits/add`)
        .send({ amount: 50, reason: "Admin adjustment" });

      expect(res.status).toBe(200);
      expect(res.body.data.transactionId).toBe(transactionId);
    });

    it("updates user balance after credit addition", async () => {
      const app = await createAdminApp();

      creditServiceMock.addCredits.mockResolvedValueOnce({
        success: true,
        balanceAfter: 1050,
        transactionId: "trans-789",
      });

      const res = await request(app)
        .post(`/api/admin/users/${TARGET_USER_ID}/credits/add`)
        .send({ amount: 1000, reason: "Bulk credit grant" });

      expect(res.status).toBe(200);
      expect(res.body.data.balanceAfter).toBe(1050);
      expect(res.body.message).toContain("1000 credits");
    });

    it("logs admin action in audit trail", async () => {
      const app = await createAdminApp();

      creditServiceMock.addCredits.mockResolvedValueOnce({
        success: true,
        balanceAfter: 100,
        transactionId: "trans-audit",
      });

      await request(app)
        .post(`/api/admin/users/${TARGET_USER_ID}/credits/add`)
        .send({ amount: 50, reason: "Test audit" });

      expect(auditServiceMock.log).toHaveBeenCalled();
    });

    it("validates user ID exists", async () => {
      const app = await createAdminApp();

      creditServiceMock.addCredits.mockRejectedValueOnce(new Error("User not found"));

      const res = await request(app)
        .post("/api/admin/users/invalid-uuid/credits/add")
        .send({ amount: 100, reason: "Test" });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it("handles service errors gracefully", async () => {
      const app = await createAdminApp();

      creditServiceMock.addCredits.mockRejectedValueOnce(
        new Error("Database connection failed")
      );

      const res = await request(app)
        .post(`/api/admin/users/${TARGET_USER_ID}/credits/add`)
        .send({ amount: 100, reason: "Test" });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/failed to add credits/i);
    });
  });

  describe("Bulk Operations Tests", () => {
    it("bulk adds credits to multiple users", async () => {
      const app = await createAdminApp();

      const userIds = ["user-111", "user-222", "user-333"];

      creditServiceMock.addCredits.mockResolvedValue({
        success: true,
        balanceAfter: 100,
        transactionId: "trans-bulk",
      });

      const res = await request(app)
        .post("/api/admin/users/bulk/credits")
        .send({ userIds, amount: 50, reason: "Bulk promotion" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.updated).toBe(3);
      expect(res.body.data.failed).toBe(0);
      expect(creditServiceMock.addCredits).toHaveBeenCalledTimes(3);
    });

    it("limits batch size to 100 users", async () => {
      const app = await createAdminApp();

      const userIds = Array.from({ length: 101 }, (_, i) => `user-${i}`);

      const res = await request(app)
        .post("/api/admin/users/bulk/credits")
        .send({ userIds, amount: 10, reason: "Test" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/cannot process more than 100 users/i);
      expect(creditServiceMock.addCredits).not.toHaveBeenCalled();
    });

    it("returns success/failure for each user", async () => {
      const app = await createAdminApp();

      const userIds = ["user-success", "user-fail", "user-success-2"];

      creditServiceMock.addCredits
        .mockResolvedValueOnce({ success: true, balanceAfter: 100, transactionId: "trans-1" })
        .mockRejectedValueOnce(new Error("User not found"))
        .mockResolvedValueOnce({ success: true, balanceAfter: 100, transactionId: "trans-3" });

      const res = await request(app)
        .post("/api/admin/users/bulk/credits")
        .send({ userIds, amount: 10, reason: "Test" });

      expect(res.status).toBe(200);
      expect(res.body.data.updated).toBe(2);
      expect(res.body.data.failed).toBe(1);
      expect(res.body.data.errors).toHaveLength(1);
      expect(res.body.data.errors[0].userId).toBe("user-fail");
    });

    it("validates all user IDs in bulk operation", async () => {
      const app = await createAdminApp();

      const res = await request(app)
        .post("/api/admin/users/bulk/credits")
        .send({ userIds: [], amount: 10, reason: "Test" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/userIds array is required/i);
    });

    it("creates transactions for all successful users", async () => {
      const app = await createAdminApp();

      const userIds = ["user-1", "user-2"];

      creditServiceMock.addCredits.mockResolvedValue({
        success: true,
        balanceAfter: 100,
        transactionId: "trans-bulk",
      });

      const res = await request(app)
        .post("/api/admin/users/bulk/credits")
        .send({ userIds, amount: 25, reason: "Bulk grant" });

      expect(res.status).toBe(200);
      expect(res.body.data.results).toHaveLength(2);
      expect(res.body.data.results[0].success).toBe(true);
      expect(res.body.data.results[1].success).toBe(true);
    });

    it("handles partial failures in bulk operations", async () => {
      const app = await createAdminApp();

      const userIds = ["user-1", "user-2", "user-3"];

      creditServiceMock.addCredits
        .mockResolvedValueOnce({ success: true, balanceAfter: 100, transactionId: "trans-1" })
        .mockRejectedValueOnce(new Error("Insufficient funds"))
        .mockResolvedValueOnce({ success: true, balanceAfter: 100, transactionId: "trans-3" });

      const res = await request(app)
        .post("/api/admin/users/bulk/credits")
        .send({ userIds, amount: 10, reason: "Test" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.updated).toBe(2);
      expect(res.body.data.failed).toBe(1);
      expect(res.body.message).toContain("1 failed");
    });
  });

  describe("User Management Tests", () => {
    it("lists all users with pagination", async () => {
      const app = await createAdminApp();

      const mockUsers = [
        {
          id: "user-1",
          email: "user1@example.com",
          firstName: "User",
          lastName: "One",
          planType: "PRO",
          creditBalance: 100,
          createdAt: new Date(),
        },
        {
          id: "user-2",
          email: "user2@example.com",
          firstName: "User",
          lastName: "Two",
          planType: "FREE",
          creditBalance: 50,
          createdAt: new Date(),
        },
      ];

      queryChain.then.mockResolvedValueOnce(mockUsers);
      queryChain.then.mockResolvedValueOnce([{ count: 2 }]);

      const res = await request(app).get("/api/admin/users?page=1&limit=10");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toHaveLength(2);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(10);
      expect(res.body.data.pagination.total).toBe(2);
    });

    it("supports search by email and name", async () => {
      const app = await createAdminApp();

      const mockUsers = [
        {
          id: "user-search",
          email: "john.doe@example.com",
          firstName: "John",
          lastName: "Doe",
          planType: "PRO",
          creditBalance: 100,
          createdAt: new Date(),
        },
      ];

      queryChain.then.mockResolvedValueOnce(mockUsers);
      queryChain.then.mockResolvedValueOnce([{ count: 1 }]);

      const res = await request(app).get("/api/admin/users?search=john");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toHaveLength(1);
      expect(res.body.data.users[0].email).toContain("john");
    });

    it("filters users by role/tier", async () => {
      const app = await createAdminApp();

      const mockUsers = [
        {
          id: "pro-user",
          email: "pro@example.com",
          planType: "PRO",
          creditBalance: 500,
          createdAt: new Date(),
        },
      ];

      queryChain.then.mockResolvedValueOnce(mockUsers);
      queryChain.then.mockResolvedValueOnce([{ count: 1 }]);

      const res = await request(app).get("/api/admin/users?tier=PRO");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users[0].planType).toBe("PRO");
    });

    it("returns user statistics", async () => {
      const app = await createAdminApp();

      queryChain.then.mockResolvedValueOnce([]);
      queryChain.then.mockResolvedValueOnce([{ count: 0 }]);

      const res = await request(app).get("/api/admin/users");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.total).toBe(0);
    });

    it("requires admin role to list users", async () => {
      authMiddlewareMock.requireAdmin.mockImplementation((req: any, res: any) => {
        return res.status(403).json({
          message: "Admin access required",
          code: "ADMIN_REQUIRED",
        });
      });

      const app = await createUserApp();
      const res = await request(app).get("/api/admin/users");

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/admin access required/i);
    });
  });

  describe("User Details Tests", () => {
    it("gets detailed user information", async () => {
      const app = await createAdminApp();

      const mockUser = {
        id: TARGET_USER_ID,
        email: "target@example.com",
        firstName: "Target",
        lastName: "User",
        planType: "PRO",
        creditBalance: 200,
        monthlyCreditAllocation: 200,
        topUpCredits: 0,
        createdAt: new Date(),
      };

      const mockTransactions = [
        {
          id: "trans-1",
          userId: TARGET_USER_ID,
          transactionType: "consumption",
          creditsAmount: -10,
          balanceAfter: 190,
          createdAt: new Date(),
        },
      ];

      queryChain.then.mockResolvedValueOnce([mockUser]);
      queryChain.then.mockResolvedValueOnce(mockTransactions);
      queryChain.then.mockResolvedValueOnce([]);

      const res = await request(app).get(`/api/admin/users/${TARGET_USER_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("target@example.com");
      expect(res.body.data.transactions).toHaveLength(1);
    });

    it("returns 404 for non-existent user", async () => {
      const app = await createAdminApp();

      queryChain.then.mockResolvedValueOnce([]);

      const res = await request(app).get("/api/admin/users/non-existent-id");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/user not found/i);
    });
  });

  describe("Credit Reset Tests", () => {
    it("resets monthly credits to tier default", async () => {
      const app = await createAdminApp();

      creditServiceMock.resetMonthlyCredits.mockResolvedValueOnce({
        success: true,
        balanceAfter: 50,
      });

      const res = await request(app).post(`/api/admin/users/${TARGET_USER_ID}/credits/reset`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/credits reset successfully/i);
      expect(creditServiceMock.resetMonthlyCredits).toHaveBeenCalledWith(TARGET_USER_ID);
    });

    it("logs credit reset action", async () => {
      const app = await createAdminApp();

      creditServiceMock.resetMonthlyCredits.mockResolvedValueOnce({
        success: true,
        balanceAfter: 50,
      });

      await request(app).post(`/api/admin/users/${TARGET_USER_ID}/credits/reset`);

      expect(auditServiceMock.log).toHaveBeenCalled();
    });
  });

  describe("Tier Management Tests", () => {
    it("changes user tier successfully", async () => {
      const app = await createAdminApp();

      const updatedUser = {
        id: TARGET_USER_ID,
        planType: "PRO",
        monthlyCreditAllocation: 500,
      };

      modifyChain.returning.mockResolvedValueOnce([updatedUser]);

      const res = await request(app)
        .put(`/api/admin/users/${TARGET_USER_ID}/tier`)
        .send({ planType: "PRO", monthlyCredits: 500 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.planType).toBe("PRO");
      expect(res.body.message).toContain("PRO");
    });

    it("validates plan type", async () => {
      const app = await createAdminApp();

      const res = await request(app)
        .put(`/api/admin/users/${TARGET_USER_ID}/tier`)
        .send({ planType: "INVALID", monthlyCredits: 100 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/invalid plan type/i);
    });

    it("logs tier change action", async () => {
      const app = await createAdminApp();

      modifyChain.returning.mockResolvedValueOnce([{ id: TARGET_USER_ID, planType: "ADVANCED" }]);

      await request(app)
        .put(`/api/admin/users/${TARGET_USER_ID}/tier`)
        .send({ planType: "ADVANCED", monthlyCredits: 1000 });

      expect(auditServiceMock.log).toHaveBeenCalled();
    });
  });

  describe("User Deletion Tests", () => {
    it("deletes user successfully", async () => {
      const app = await createAdminApp();

      modifyChain.then.mockResolvedValueOnce(undefined);

      const res = await request(app).delete(`/api/admin/users/${TARGET_USER_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/user deleted successfully/i);
    });

    it("prevents admin from deleting themselves", async () => {
      const app = await createAdminApp();

      const res = await request(app).delete(`/api/admin/users/${ADMIN_USER_ID}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/cannot delete your own admin account/i);
    });

    it("logs user deletion action", async () => {
      const app = await createAdminApp();

      modifyChain.then.mockResolvedValueOnce(undefined);

      await request(app).delete(`/api/admin/users/${TARGET_USER_ID}`);

      expect(auditServiceMock.log).toHaveBeenCalled();
    });
  });

  describe("Bulk User Actions Tests", () => {
    it("performs bulk delete action", async () => {
      const app = await createAdminApp();

      const userIds = ["user-1", "user-2", "user-3"];

      modifyChain.then.mockResolvedValue(undefined);

      const res = await request(app)
        .post("/api/admin/users/bulk/action")
        .send({ userIds, action: "delete" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.updated).toBe(3);
    });

    it("prevents bulk deletion of admin's own account", async () => {
      const app = await createAdminApp();

      const userIds = [ADMIN_USER_ID, "user-1"];

      const res = await request(app)
        .post("/api/admin/users/bulk/action")
        .send({ userIds, action: "delete" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/cannot delete your own admin account/i);
    });

    it("validates bulk action type", async () => {
      const app = await createAdminApp();

      const res = await request(app)
        .post("/api/admin/users/bulk/action")
        .send({ userIds: ["user-1"], action: "invalid-action" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/invalid action/i);
    });
  });

  describe("Audit Log Tests", () => {
    it("retrieves audit logs with pagination", async () => {
      const app = await createAdminApp();

      const mockLogs = [
        {
          id: "log-1",
          adminId: ADMIN_USER_ID,
          action: "ADD_CREDITS",
          targetUserId: TARGET_USER_ID,
          createdAt: new Date(),
        },
      ];

      auditServiceMock.getLogs.mockResolvedValueOnce({
        logs: mockLogs,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      });

      const res = await request(app).get("/api/admin/audit-logs?page=1&limit=50");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.logs).toHaveLength(1);
      expect(auditServiceMock.getLogs).toHaveBeenCalled();
    });

    it("filters audit logs by action", async () => {
      const app = await createAdminApp();

      auditServiceMock.getLogs.mockResolvedValueOnce({
        logs: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      });

      await request(app).get("/api/admin/audit-logs?action=ADD_CREDITS");

      expect(auditServiceMock.getLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "ADD_CREDITS",
        })
      );
    });

    it("gets list of unique actions", async () => {
      const app = await createAdminApp();

      auditServiceMock.getActions.mockResolvedValueOnce([
        "ADD_CREDITS",
        "DELETE_USER",
        "UPDATE_USER_TIER",
      ]);

      const res = await request(app).get("/api/admin/audit-logs/actions");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.actions).toHaveLength(3);
    });
  });
});
