import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const storageMocks = vi.hoisted(() => ({
  createOrganization: vi.fn(),
  addOrganizationMembership: vi.fn(),
  getOrganizationMembership: vi.fn(),
  getOrganizationMembers: vi.fn(),
  getOrganization: vi.fn(),
  getUserByEmail: vi.fn(),
  upsertUser: vi.fn(),
  updateUser: vi.fn(),
}));

const organizationAnalyticsMocks = vi.hoisted(() => ({
  getAllOrganizationSummaries: vi.fn(),
  getOrganizationAnalytics: vi.fn(),
}));

const creditServiceMocks = vi.hoisted(() => ({
  getUserSummary: vi.fn(),
  initializeUserAccount: vi.fn(),
  consumeCredits: vi.fn(),
  adminAdjustUserCredits: vi.fn(),
}));

const bcryptMock = vi.hoisted(() => ({ hash: vi.fn().mockResolvedValue("hashed-password") }));

vi.mock("../storage.js", () => ({
  storage: storageMocks,
}));

vi.mock("../services/credit-service.js", () => ({
  creditService: creditServiceMocks,
}));

vi.mock("../services/organization-analytics-service.js", () => ({
  organizationAnalyticsService: organizationAnalyticsMocks,
}));

vi.mock("bcryptjs", () => ({
  default: bcryptMock,
  hash: bcryptMock.hash,
}));

describe("company dashboard routes", () => {
  beforeEach(async () => {
    Object.values(storageMocks).forEach(mockFn => mockFn.mockReset?.());
    Object.values(creditServiceMocks).forEach(mockFn => mockFn.mockReset?.());
    Object.values(organizationAnalyticsMocks).forEach(mockFn => mockFn.mockReset?.());
    bcryptMock.hash.mockClear();
    await vi.resetModules();
  });

  async function createApp(userOverride?: Partial<express.Request['user']>) {
    const { default: companyDashboardRouter } = await import("../routes/company-dashboard");
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = {
        id: "admin-1",
        role: "admin",
        ...userOverride,
      } as any;
      next();
    });
    app.use("/api/company", companyDashboardRouter);
    return app;
  }

  it("returns a credit summary for the current user", async () => {
    const app = await createApp({ id: "user-credits", role: "user" });

    creditServiceMocks.getUserSummary.mockResolvedValueOnce({
      userId: "user-credits",
      accountTier: "free",
      monthlyCreditAllocation: 20,
      creditBalance: 15,
      billingCycleStart: new Date("2025-01-01T00:00:00Z"),
      billingCycleEnd: new Date("2025-02-01T00:00:00Z"),
      totalCreditsConsumed: 5,
      breakdown: [{ module: "prepare", sessionCount: 1, creditsConsumed: 5 }],
      recentLedger: [],
      recentUsageEvents: [],
    });

    const res = await request(app).get("/api/company/credits/me");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.creditBalance).toBe(15);
    expect(creditServiceMocks.getUserSummary).toHaveBeenCalledWith("user-credits");
  });

  it("provisions a paid user and initializes credits", async () => {
    const app = await createApp();

    storageMocks.getUserByEmail.mockResolvedValueOnce(null);
    storageMocks.upsertUser.mockResolvedValueOnce({
      id: "user-new",
      email: "new@example.com",
      firstName: "New",
      lastName: "User",
      role: "admin",
    });
    storageMocks.getOrganization.mockResolvedValueOnce({
      id: "org-1",
      name: "Acme",
      type: "customer",
    });
    storageMocks.addOrganizationMembership.mockResolvedValueOnce({
      id: "membership-1",
      organizationId: "org-1",
      userId: "user-new",
      role: "admin",
    });

    creditServiceMocks.initializeUserAccount.mockResolvedValueOnce({} as any);
    creditServiceMocks.getUserSummary.mockResolvedValueOnce({
      userId: "user-new",
      accountTier: "paid",
      monthlyCreditAllocation: 100,
      creditBalance: 100,
      billingCycleStart: new Date("2025-01-01T00:00:00Z"),
      billingCycleEnd: new Date("2025-02-01T00:00:00Z"),
      totalCreditsConsumed: 0,
      breakdown: [],
      recentLedger: [],
      recentUsageEvents: [],
    });

    const res = await request(app)
      .post("/api/company/users")
      .send({
        email: "new@example.com",
        firstName: "New",
        lastName: "User",
        password: "supersecure",
        accountTier: "paid",
        monthlyCredits: 100,
        organizationId: "org-1",
        organizationRole: "admin",
      });

    expect(res.status).toBe(201);
    expect(storageMocks.upsertUser).toHaveBeenCalledWith(expect.objectContaining({
      email: "new@example.com",
      firstName: "New",
      role: "admin",
    }));
    expect(creditServiceMocks.initializeUserAccount).toHaveBeenCalledWith("user-new", "paid", 100);
    expect(storageMocks.addOrganizationMembership).toHaveBeenCalledWith({
      organizationId: "org-1",
      userId: "user-new",
      role: "admin",
    });
    expect(res.body.data.user.id).toBe("user-new");
    expect(res.body.data.credits.accountTier).toBe("paid");
  });

  it("allows admins to adjust user credit settings", async () => {
    const app = await createApp();

    const summary = {
      userId: "user-adjust",
      accountTier: "paid",
      monthlyCreditAllocation: 150,
      creditBalance: 120,
      billingCycleStart: new Date("2025-01-01T00:00:00Z"),
      billingCycleEnd: new Date("2025-02-01T00:00:00Z"),
      totalCreditsConsumed: 30,
      breakdown: [{ module: "practice", sessionCount: 3, creditsConsumed: 30 }],
      recentLedger: [],
      recentUsageEvents: [],
    };

    creditServiceMocks.adminAdjustUserCredits.mockResolvedValueOnce(summary);

    const res = await request(app)
      .patch("/api/company/users/user-adjust/credits")
      .send({ monthlyCredits: 150, creditBalance: 120, reason: "Contract update" });

    expect(res.status).toBe(200);
    expect(res.body.data.monthlyCreditAllocation).toBe(150);
    expect(creditServiceMocks.adminAdjustUserCredits).toHaveBeenCalledWith("user-adjust", {
      monthlyCredits: 150,
      creditBalance: 120,
      reason: "Contract update",
    });
  });

  it("rejects credit updates without any fields", async () => {
    const app = await createApp();

    const res = await request(app)
      .patch("/api/company/users/user-adjust/credits")
      .send({});

    expect(res.status).toBe(400);
    expect(creditServiceMocks.adminAdjustUserCredits).not.toHaveBeenCalled();
  });

  it("prevents non-admins from updating credits", async () => {
    const app = await createApp({ role: "user", id: "non-admin" });

    const res = await request(app)
      .patch("/api/company/users/user-adjust/credits")
      .send({ monthlyCredits: 50 });

    expect(res.status).toBe(403);
    expect(creditServiceMocks.adminAdjustUserCredits).not.toHaveBeenCalled();
  });

  describe("organization analytics", () => {
    it("returns all organization summaries for admin users", async () => {
      const app = await createApp();

      const mockSummaries = [
        {
          id: "org-1",
          name: "Acme Corp",
          type: "customer",
          memberCount: 5,
          totalCreditsConsumed: 500,
          totalTimeSpent: 18000, // 5 hours
          timeByModule: {
            prepare: 7200,
            practice: 10800,
            perform: 0,
          },
          createdAt: new Date("2025-01-01"),
        },
        {
          id: "org-2",
          name: "Beta Inc",
          type: "reseller",
          memberCount: 3,
          totalCreditsConsumed: 300,
          totalTimeSpent: 10800, // 3 hours
          timeByModule: {
            prepare: 3600,
            practice: 7200,
            perform: 0,
          },
          createdAt: new Date("2025-01-15"),
        },
      ];

      organizationAnalyticsMocks.getAllOrganizationSummaries.mockResolvedValueOnce(mockSummaries);

      const res = await request(app).get("/api/company/organizations");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockSummaries);
      expect(organizationAnalyticsMocks.getAllOrganizationSummaries).toHaveBeenCalledOnce();
    });

    it("prevents non-admin users from accessing organization summaries", async () => {
      const app = await createApp({ role: "user", id: "regular-user" });

      const res = await request(app).get("/api/company/organizations");

      expect(res.status).toBe(403);
      expect(organizationAnalyticsMocks.getAllOrganizationSummaries).not.toHaveBeenCalled();
    });

    it("returns detailed analytics for a specific organization", async () => {
      const app = await createApp();

      const mockAnalytics = {
        id: "org-1",
        name: "Acme Corp",
        type: "customer",
        memberCount: 2,
        totalCreditsConsumed: 350,
        totalTimeSpent: 12600,
        timeByModule: {
          prepare: 1800,
          practice: 10800,
          perform: 0,
        },
        createdAt: new Date("2025-01-01"),
        members: [
          {
            userId: "user-1",
            email: "user1@acme.com",
            firstName: "John",
            lastName: "Doe",
            role: "member",
            totalTimeSpent: 5400,
            timeByModule: {
              prepare: 1800,
              practice: 3600,
              perform: 0,
            },
            creditsConsumed: 150,
            sessionCount: 2,
            lastActivity: new Date("2025-01-20"),
          },
          {
            userId: "user-2",
            email: "user2@acme.com",
            firstName: "Jane",
            lastName: "Smith",
            role: "manager",
            totalTimeSpent: 7200,
            timeByModule: {
              prepare: 0,
              practice: 7200,
              perform: 0,
            },
            creditsConsumed: 200,
            sessionCount: 1,
            lastActivity: new Date("2025-01-21"),
          },
        ],
      };

      storageMocks.getOrganizationMembership.mockResolvedValueOnce({
        id: "membership-1",
        organizationId: "org-1",
        userId: "admin-1",
        role: "owner",
      });

      organizationAnalyticsMocks.getOrganizationAnalytics.mockResolvedValueOnce(mockAnalytics);

      const res = await request(app).get("/api/company/organizations/org-1/analytics");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockAnalytics);
      expect(organizationAnalyticsMocks.getOrganizationAnalytics).toHaveBeenCalledWith("org-1");
    });

    it("allows organization managers to access analytics", async () => {
      const app = await createApp({ role: "manager", id: "manager-1" });

      storageMocks.getOrganizationMembership.mockResolvedValueOnce({
        id: "membership-1",
        organizationId: "org-1",
        userId: "manager-1",
        role: "manager",
      });

      organizationAnalyticsMocks.getOrganizationAnalytics.mockResolvedValueOnce({
        id: "org-1",
        name: "Acme Corp",
        type: "customer",
        memberCount: 1,
        totalCreditsConsumed: 100,
        totalTimeSpent: 3600,
        timeByModule: { prepare: 1800, practice: 1800, perform: 0 },
        createdAt: new Date("2025-01-01"),
        members: [],
      });

      const res = await request(app).get("/api/company/organizations/org-1/analytics");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("denies access to non-members", async () => {
      const app = await createApp({ role: "manager", id: "manager-1" });

      storageMocks.getOrganizationMembership.mockResolvedValueOnce(null);

      const res = await request(app).get("/api/company/organizations/org-1/analytics");

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("ACCESS_DENIED");
    });

    it("returns 404 for non-existent organization", async () => {
      const app = await createApp();

      organizationAnalyticsMocks.getOrganizationAnalytics.mockResolvedValueOnce(null);

      const res = await request(app).get("/api/company/organizations/non-existent/analytics");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("ORGANIZATION_NOT_FOUND");
    });
  });
});
