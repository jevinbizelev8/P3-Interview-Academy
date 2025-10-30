import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express, { type Express } from "express";
import referralsRouter from "../routes/referrals";

// Mock referral service
const referralServiceMocks = vi.hoisted(() => ({
  generateReferralCode: vi.fn(),
  getUserReferralCode: vi.fn(),
  applyReferralCode: vi.fn(),
  getReferralStats: vi.fn(),
  getUserReferrals: vi.fn(),
}));

vi.mock("../services/referral-service", () => ({
  ReferralService: referralServiceMocks,
}));

// Test app setup
function createTestApp(): Express {
  const app = express();
  app.use(express.json());

  // Mock authentication middleware
  app.use((req, _res, next) => {
    req.user = { id: "test-user-123" };
    next();
  });

  app.use("/api/referrals", referralsRouter);
  return app;
}

describe("Referrals Module Routes", () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  // ============================================================================
  // Create Referral Code Tests
  // ============================================================================

  describe("POST /api/referrals/create", () => {
    it("should create a referral code", async () => {
      const mockCode = "ABC12345";
      referralServiceMocks.generateReferralCode.mockResolvedValue(mockCode);

      const response = await request(app).post("/api/referrals/create");

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe(mockCode);
      expect(response.body.data.referralUrl).toContain(mockCode);
      expect(referralServiceMocks.generateReferralCode).toHaveBeenCalledWith(
        "test-user-123"
      );
    });

    it("should handle service errors", async () => {
      referralServiceMocks.generateReferralCode.mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app).post("/api/referrals/create");

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Failed to create referral code");
    });
  });

  // ============================================================================
  // Get Referral Code Tests
  // ============================================================================

  describe("GET /api/referrals/code", () => {
    it("should get user's referral code", async () => {
      const mockData = {
        code: "XYZ98765",
        referralUrl: "http://localhost:5000/signup?ref=XYZ98765",
      };

      referralServiceMocks.getUserReferralCode.mockResolvedValue(mockData);

      const response = await request(app).get("/api/referrals/code");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockData);
      expect(referralServiceMocks.getUserReferralCode).toHaveBeenCalledWith(
        "test-user-123"
      );
    });

    it("should generate code if user doesn't have one", async () => {
      const mockData = {
        code: "NEWCODE1",
        referralUrl: "http://localhost:5000/signup?ref=NEWCODE1",
      };

      referralServiceMocks.getUserReferralCode.mockResolvedValue(mockData);

      const response = await request(app).get("/api/referrals/code");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe("NEWCODE1");
    });

    it("should handle service errors", async () => {
      referralServiceMocks.getUserReferralCode.mockRejectedValue(
        new Error("Failed to get code")
      );

      const response = await request(app).get("/api/referrals/code");

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Apply Referral Code Tests
  // ============================================================================

  describe("POST /api/referrals/apply", () => {
    it("should apply a valid referral code", async () => {
      const mockReferral = {
        id: "referral-1",
        referrerId: "referrer-user-id",
        referralCode: "VALID123",
        referredEmail: "newuser@example.com",
        referredUserId: "new-user-id",
        status: "completed",
        rewardValue: 10,
        rewardGiven: false,
      };

      referralServiceMocks.applyReferralCode.mockResolvedValue(mockReferral);

      const response = await request(app)
        .post("/api/referrals/apply")
        .send({
          referralCode: "VALID123",
          referredEmail: "newuser@example.com",
          referredUserId: "new-user-id",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.referral).toEqual(mockReferral);
      expect(response.body.data.message).toContain("successfully");
    });

    it("should return 400 for missing referral code", async () => {
      const response = await request(app)
        .post("/api/referrals/apply")
        .send({
          referredEmail: "newuser@example.com",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid request data");
    });

    it("should return 400 for invalid email", async () => {
      const response = await request(app)
        .post("/api/referrals/apply")
        .send({
          referralCode: "VALID123",
          referredEmail: "invalid-email",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for invalid referral code", async () => {
      referralServiceMocks.applyReferralCode.mockRejectedValue(
        new Error("Invalid referral code")
      );

      const response = await request(app)
        .post("/api/referrals/apply")
        .send({
          referralCode: "INVALID",
          referredEmail: "newuser@example.com",
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid referral code");
    });

    it("should return 400 for self-referral attempt", async () => {
      referralServiceMocks.applyReferralCode.mockRejectedValue(
        new Error("Cannot use your own referral code")
      );

      const response = await request(app)
        .post("/api/referrals/apply")
        .send({
          referralCode: "MYCODE",
          referredEmail: "me@example.com",
          referredUserId: "test-user-123",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Self-referral not allowed");
    });

    it("should prevent using own code in request validation", async () => {
      const selfReferralApp = express();
      selfReferralApp.use(express.json());
      selfReferralApp.use((req, _res, next) => {
        req.user = { id: "same-user-id" };
        next();
      });
      selfReferralApp.use("/api/referrals", referralsRouter);

      const response = await request(selfReferralApp)
        .post("/api/referrals/apply")
        .send({
          referralCode: "MYCODE",
          referredEmail: "me@example.com",
          referredUserId: "same-user-id",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Cannot use your own referral code");
    });

    it("should handle duplicate referral application", async () => {
      const existingReferral = {
        id: "existing-referral",
        status: "pending",
      };

      referralServiceMocks.applyReferralCode.mockResolvedValue(existingReferral);

      const response = await request(app)
        .post("/api/referrals/apply")
        .send({
          referralCode: "CODE123",
          referredEmail: "existing@example.com",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  // ============================================================================
  // Referral Stats Tests
  // ============================================================================

  describe("GET /api/referrals/stats", () => {
    it("should get referral statistics", async () => {
      const mockStats = {
        totalReferrals: 10,
        completedReferrals: 7,
        pendingReferrals: 3,
        totalCreditsEarned: 70,
        referralCode: "MYCODE",
        referralUrl: "http://localhost:5000/signup?ref=MYCODE",
      };

      referralServiceMocks.getReferralStats.mockResolvedValue(mockStats);

      const response = await request(app).get("/api/referrals/stats");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStats);
      expect(response.body.data.totalReferrals).toBe(10);
      expect(response.body.data.completedReferrals).toBe(7);
      expect(response.body.data.totalCreditsEarned).toBe(70);
    });

    it("should handle user with no referrals", async () => {
      const mockStats = {
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        totalCreditsEarned: 0,
        referralCode: "NEWCODE",
        referralUrl: "http://localhost:5000/signup?ref=NEWCODE",
      };

      referralServiceMocks.getReferralStats.mockResolvedValue(mockStats);

      const response = await request(app).get("/api/referrals/stats");

      expect(response.status).toBe(200);
      expect(response.body.data.totalReferrals).toBe(0);
    });

    it("should handle service errors", async () => {
      referralServiceMocks.getReferralStats.mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app).get("/api/referrals/stats");

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // List Referrals Tests
  // ============================================================================

  describe("GET /api/referrals/referrals", () => {
    it("should get list of user's referrals", async () => {
      const mockReferrals = [
        {
          id: "ref-1",
          referralCode: "CODE123",
          referredEmail: "user1@example.com",
          status: "completed",
          rewardValue: 10,
          rewardGiven: true,
          referredAt: new Date("2025-10-01"),
          signedUpAt: new Date("2025-10-02"),
          rewardGivenAt: new Date("2025-10-02"),
        },
        {
          id: "ref-2",
          referralCode: "CODE123",
          referredEmail: "user2@example.com",
          status: "pending",
          rewardValue: 10,
          rewardGiven: false,
          referredAt: new Date("2025-10-25"),
          signedUpAt: null,
          rewardGivenAt: null,
        },
      ];

      referralServiceMocks.getUserReferrals.mockResolvedValue(mockReferrals);

      const response = await request(app).get("/api/referrals/referrals");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.referrals).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.limit).toBe(50);

      // Check email masking
      expect(response.body.data.referrals[0].referredEmail).toContain("****");
      expect(response.body.data.referrals[0].referredEmail).toContain("@");
    });

    it("should respect custom limit parameter", async () => {
      referralServiceMocks.getUserReferrals.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/referrals/referrals")
        .query({ limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data.limit).toBe(10);
      expect(referralServiceMocks.getUserReferrals).toHaveBeenCalledWith(
        "test-user-123",
        10
      );
    });

    it("should cap limit at 100", async () => {
      referralServiceMocks.getUserReferrals.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/referrals/referrals")
        .query({ limit: 200 });

      expect(response.status).toBe(200);
      expect(response.body.data.limit).toBe(100);
      expect(referralServiceMocks.getUserReferrals).toHaveBeenCalledWith(
        "test-user-123",
        100
      );
    });

    it("should handle user with no referrals", async () => {
      referralServiceMocks.getUserReferrals.mockResolvedValue([]);

      const response = await request(app).get("/api/referrals/referrals");

      expect(response.status).toBe(200);
      expect(response.body.data.referrals).toHaveLength(0);
      expect(response.body.data.total).toBe(0);
    });

    it("should handle service errors", async () => {
      referralServiceMocks.getUserReferrals.mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app).get("/api/referrals/referrals");

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Authentication Tests
  // ============================================================================

  describe("Authentication", () => {
    it("should return 401 for unauthenticated create code request", async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use((req, _res, next) => {
        req.user = undefined;
        next();
      });
      unauthApp.use("/api/referrals", referralsRouter);

      const response = await request(unauthApp).post("/api/referrals/create");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 401 for unauthenticated get code request", async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use((req, _res, next) => {
        req.user = undefined;
        next();
      });
      unauthApp.use("/api/referrals", referralsRouter);

      const response = await request(unauthApp).get("/api/referrals/code");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 401 for unauthenticated stats request", async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use((req, _res, next) => {
        req.user = undefined;
        next();
      });
      unauthApp.use("/api/referrals", referralsRouter);

      const response = await request(unauthApp).get("/api/referrals/stats");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
