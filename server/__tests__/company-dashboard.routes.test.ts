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

vi.mock("bcryptjs", () => ({
  default: bcryptMock,
  hash: bcryptMock.hash,
}));

describe("company dashboard routes", () => {
  beforeEach(async () => {
    Object.values(storageMocks).forEach(mockFn => mockFn.mockReset?.());
    Object.values(creditServiceMocks).forEach(mockFn => mockFn.mockReset?.());
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
});
