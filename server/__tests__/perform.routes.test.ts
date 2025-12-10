import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express, { type Express } from "express";
import performRouter from "../routes/perform";

// Mock services
const performanceServiceMocks = vi.hoisted(() => ({
  createActualInterview: vi.fn(),
  getUserInterviews: vi.fn(),
  getInterviewById: vi.fn(),
  updateActualInterview: vi.fn(),
  deleteActualInterview: vi.fn(),
  getInterviewStats: vi.fn(),
  getInterviewsByOutcome: vi.fn(),
  getUpcomingFollowUps: vi.fn(),
  getInterviewTimeline: vi.fn(),
}));

const reflectionServiceMocks = vi.hoisted(() => ({
  createReflection: vi.fn(),
  getUserReflections: vi.fn(),
  getReflectionById: vi.fn(),
  getReflectionInsights: vi.fn(),
  updateReflection: vi.fn(),
}));

const analyticsServiceMocks = vi.hoisted(() => ({
  getPerformanceInsights: vi.fn(),
  getPerformanceChart: vi.fn(),
  getPerformanceStats: vi.fn(),
}));

vi.mock("../services/performance-service", () => ({
  PerformanceService: performanceServiceMocks,
}));

vi.mock("../services/reflection-service", () => ({
  ReflectionService: reflectionServiceMocks,
}));

vi.mock("../services/analytics-service", () => ({
  AnalyticsService: analyticsServiceMocks,
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

  app.use("/api/perform", performRouter);
  return app;
}

describe("Perform Module Routes", () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  // ============================================================================
  // Actual Interview Tests
  // ============================================================================

  describe("POST /api/perform/actual-interviews", () => {
    it("should create a new actual interview record", async () => {
      const mockInterview = {
        id: "interview-1",
        userId: "test-user-123",
        companyName: "Tech Corp",
        position: "Senior Engineer",
        interviewDate: new Date("2025-10-30").toISOString(),
        outcome: "offer",
        confidenceLevel: 8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      performanceServiceMocks.createActualInterview.mockResolvedValue(mockInterview);

      const response = await request(app)
        .post("/api/perform/actual-interviews")
        .send({
          companyName: "Tech Corp",
          position: "Senior Engineer",
          interviewDate: "2025-10-30",
          interviewType: "Technical",
          outcome: "offer",
          confidenceLevel: 8,
          notes: "Great interview experience",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockInterview);
      expect(performanceServiceMocks.createActualInterview).toHaveBeenCalledWith(
        "test-user-123",
        expect.objectContaining({
          companyName: "Tech Corp",
          position: "Senior Engineer",
        })
      );
    });

    it("should return 400 for invalid request data", async () => {
      const response = await request(app)
        .post("/api/perform/actual-interviews")
        .send({
          // Missing required fields
          companyName: "",
          position: "",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid request data");
    });

    it("should handle service errors", async () => {
      performanceServiceMocks.createActualInterview.mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .post("/api/perform/actual-interviews")
        .send({
          companyName: "Tech Corp",
          position: "Engineer",
          interviewDate: "2025-10-30",
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/perform/actual-interviews", () => {
    it("should get user's interview history", async () => {
      const mockInterviews = [
        {
          id: "int-1",
          userId: "test-user-123",
          companyName: "Tech Corp",
          position: "Engineer",
          outcome: "offer",
        },
        {
          id: "int-2",
          userId: "test-user-123",
          companyName: "Startup Inc",
          position: "Lead",
          outcome: "next_round",
        },
      ];

      performanceServiceMocks.getUserInterviews.mockResolvedValue(mockInterviews);

      const response = await request(app).get("/api/perform/actual-interviews");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockInterviews);
      expect(performanceServiceMocks.getUserInterviews).toHaveBeenCalledWith("test-user-123");
    });

    it("should filter interviews by outcome", async () => {
      const mockOffers = [
        {
          id: "int-1",
          outcome: "offer",
        },
      ];

      performanceServiceMocks.getInterviewsByOutcome.mockResolvedValue(mockOffers);

      const response = await request(app)
        .get("/api/perform/actual-interviews")
        .query({ outcome: "offer" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(performanceServiceMocks.getInterviewsByOutcome).toHaveBeenCalledWith(
        "test-user-123",
        "offer"
      );
    });

    it("should return 400 for invalid outcome filter", async () => {
      const response = await request(app)
        .get("/api/perform/actual-interviews")
        .query({ outcome: "invalid-outcome" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/perform/actual-interviews/:id", () => {
    it("should get a specific interview", async () => {
      const mockInterview = {
        id: "interview-1",
        userId: "test-user-123",
        companyName: "Tech Corp",
      };

      performanceServiceMocks.getInterviewById.mockResolvedValue(mockInterview);

      const response = await request(app).get("/api/perform/actual-interviews/interview-1");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockInterview);
    });

    it("should return 404 if interview not found", async () => {
      performanceServiceMocks.getInterviewById.mockResolvedValue(null);

      const response = await request(app).get(
        "/api/perform/actual-interviews/nonexistent"
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/perform/actual-interviews/:id", () => {
    it("should update an interview", async () => {
      const mockUpdatedInterview = {
        id: "interview-1",
        userId: "test-user-123",
        outcome: "offer",
        notes: "Updated notes",
      };

      performanceServiceMocks.updateActualInterview.mockResolvedValue(mockUpdatedInterview);

      const response = await request(app)
        .put("/api/perform/actual-interviews/interview-1")
        .send({
          outcome: "offer",
          notes: "Updated notes",
          confidenceLevel: 9,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUpdatedInterview);
    });

    it("should return 400 for invalid update data", async () => {
      const response = await request(app)
        .put("/api/perform/actual-interviews/interview-1")
        .send({
          outcome: "invalid-outcome",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/perform/actual-interviews/:id", () => {
    it("should delete an interview", async () => {
      performanceServiceMocks.deleteActualInterview.mockResolvedValue(undefined);

      const response = await request(app).delete(
        "/api/perform/actual-interviews/interview-1"
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(performanceServiceMocks.deleteActualInterview).toHaveBeenCalledWith(
        "interview-1",
        "test-user-123"
      );
    });

    it("should handle errors when deleting", async () => {
      performanceServiceMocks.deleteActualInterview.mockRejectedValue(
        new Error("Interview not found")
      );

      const response = await request(app).delete(
        "/api/perform/actual-interviews/interview-1"
      );

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Reflection Tests
  // ============================================================================

  describe("POST /api/perform/reflections", () => {
    it("should create a reflection journal", async () => {
      const mockReflection = {
        id: "reflection-1",
        userId: "test-user-123",
        strengths: "Good communication",
        improvements: "More examples",
        moodScore: 8,
        createdAt: new Date().toISOString(),
      };

      reflectionServiceMocks.createReflection.mockResolvedValue(mockReflection);

      const response = await request(app)
        .post("/api/perform/reflections")
        .send({
          practiceSessionId: "11111111-1111-4111-8111-111111111111",
          strengths: "Good communication",
          improvements: "More examples",
          actionItems: "Practice STAR method",
          overallFeeling: "Confident",
          moodScore: 8,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockReflection);
    });

    it("should return 400 for missing required fields", async () => {
      const response = await request(app)
        .post("/api/perform/reflections")
        .send({
          strengths: "Good",
          // Missing improvements
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/perform/reflections", () => {
    it("should get user's reflections", async () => {
      const mockReflections = [
        { id: "ref-1", strengths: "Good pace" },
        { id: "ref-2", strengths: "Clear examples" },
      ];

      reflectionServiceMocks.getUserReflections.mockResolvedValue(mockReflections);

      const response = await request(app).get("/api/perform/reflections");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockReflections);
    });

    it("should filter reflections by practice session", async () => {
      const mockReflections = [{ id: "ref-1", practiceSessionId: "session-1" }];

      reflectionServiceMocks.getUserReflections.mockResolvedValue(mockReflections);

      const response = await request(app)
        .get("/api/perform/reflections")
        .query({ practiceSessionId: "session-1" });

      expect(response.status).toBe(200);
      expect(reflectionServiceMocks.getUserReflections).toHaveBeenCalledWith(
        "test-user-123",
        "session-1"
      );
    });
  });

  // ============================================================================
  // Analytics Tests
  // ============================================================================

  describe("GET /api/perform/insights", () => {
    it("should get comprehensive performance insights", async () => {
      const mockInsights = {
        practiceStats: {
          totalSessions: 10,
          completedSessions: 8,
          averageScore: 4.2,
          improvement: 0.5,
        },
        interviewStats: {
          totalInterviews: 5,
          successfulInterviews: 3,
          successRate: 60,
          averageConfidence: 7.5,
        },
        learningStats: {
          modulesCompleted: 7,
          totalTimeSpent: 180,
          averageModuleScore: 85,
        },
        reflectionStats: {
          totalReflections: 12,
          averageMoodScore: 7.8,
        },
        recommendations: ["Continue practicing", "Focus on examples"],
      };

      analyticsServiceMocks.getPerformanceInsights.mockResolvedValue(mockInsights);

      const response = await request(app).get("/api/perform/insights");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockInsights);
      expect(analyticsServiceMocks.getPerformanceInsights).toHaveBeenCalledWith(
        "test-user-123"
      );
    });
  });

  describe("GET /api/perform/performance-chart", () => {
    it("should get performance chart data", async () => {
      const mockChartData = [
        { date: "2025-10-01", practiceScore: 4.0, modulesCompleted: 2, reflections: 1 },
        { date: "2025-10-02", practiceScore: 4.2, modulesCompleted: 1, reflections: 1 },
      ];

      analyticsServiceMocks.getPerformanceChart.mockResolvedValue(mockChartData);

      const response = await request(app)
        .get("/api/perform/performance-chart")
        .query({ days: 30 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockChartData);
      expect(analyticsServiceMocks.getPerformanceChart).toHaveBeenCalledWith(
        "test-user-123",
        30
      );
    });

    it("should use default days if not provided", async () => {
      analyticsServiceMocks.getPerformanceChart.mockResolvedValue([]);

      const response = await request(app).get("/api/perform/performance-chart");

      expect(response.status).toBe(200);
      expect(analyticsServiceMocks.getPerformanceChart).toHaveBeenCalledWith(
        "test-user-123",
        30
      );
    });

    it("should return 400 for invalid days parameter", async () => {
      const response = await request(app)
        .get("/api/perform/performance-chart")
        .query({ days: 500 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/perform/stats", () => {
    it("should get performance statistics", async () => {
      const mockStats = {
        totalPracticeSessions: 15,
        totalInterviews: 5,
        totalModulesCompleted: 8,
        totalReflections: 12,
        averagePracticeScore: 4.1,
        interviewSuccessRate: 60,
        currentStreak: 7,
        longestStreak: 14,
      };

      analyticsServiceMocks.getPerformanceStats.mockResolvedValue(mockStats);

      const response = await request(app).get("/api/perform/stats");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStats);
    });
  });

  describe("GET /api/perform/interview-stats", () => {
    it("should get detailed interview statistics", async () => {
      const mockStats = {
        totalInterviews: 5,
        offerCount: 2,
        nextRoundCount: 1,
        rejectedCount: 1,
        pendingCount: 1,
        successRate: 75,
        averageConfidence: 7.5,
        recentInterviews: [],
        upcomingFollowUps: [],
      };

      performanceServiceMocks.getInterviewStats.mockResolvedValue(mockStats);

      const response = await request(app).get("/api/perform/interview-stats");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStats);
    });
  });

  describe("GET /api/perform/interview-timeline", () => {
    it("should get interview timeline", async () => {
      const mockTimeline = [
        {
          month: "October",
          year: 2025,
          totalInterviews: 3,
          offers: 1,
          nextRounds: 1,
          rejected: 1,
          pending: 0,
        },
      ];

      performanceServiceMocks.getInterviewTimeline.mockResolvedValue(mockTimeline);

      const response = await request(app).get("/api/perform/interview-timeline");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTimeline);
    });
  });

  // ============================================================================
  // Authentication Tests
  // ============================================================================

  describe("Authentication", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use((req, _res, next) => {
        req.user = undefined;
        next();
      });
      unauthApp.use("/api/perform", performRouter);

      const response = await request(unauthApp).get("/api/perform/insights");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
