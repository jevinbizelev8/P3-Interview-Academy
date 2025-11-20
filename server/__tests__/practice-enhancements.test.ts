import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express, { type Express } from "express";
import practiceRouter from "../routes/practice";

// Mock storage
const storageMocks = vi.hoisted(() => ({
  getUserPracticeSessions: vi.fn(),
  getPracticeSession: vi.fn(),
  getPracticeReport: vi.fn(),
  getPracticeOverview: vi.fn(),
}));

vi.mock("../storage", () => ({
  storage: storageMocks,
}));

// Mock AI services (not used in these tests but required by practice routes)
vi.mock("../services/ai-question-generator", () => ({
  AIQuestionGenerator: vi.fn().mockImplementation(() => ({
    generateQuestion: vi.fn(),
  })),
}));

vi.mock("../services/response-evaluation-service", () => ({
  ResponseEvaluationService: vi.fn().mockImplementation(() => ({
    evaluateSessionResponses: vi.fn(),
  })),
}));

// Mock credit middleware
vi.mock("../middleware/credit-middleware", () => ({
  requireCredits: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../services/credit-service", () => ({
  CreditService: {
    deductCredits: vi.fn(),
  },
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

  app.use("/api/practice", practiceRouter);
  return app;
}

describe.skip("Practice Module Enhancements", () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  // ============================================================================
  // Practice History Tests
  // ============================================================================

  describe("GET /api/practice/history", () => {
    it("should get comprehensive practice history with analytics", async () => {
      const mockSessions = [
        {
          id: "session-1",
          userId: "test-user-123",
          status: "completed",
          totalQuestions: 10,
          totalDuration: 1200,
          createdAt: new Date("2025-10-25"),
        },
        {
          id: "session-2",
          userId: "test-user-123",
          status: "completed",
          totalQuestions: 8,
          totalDuration: 960,
          createdAt: new Date("2025-10-26"),
        },
        {
          id: "session-3",
          userId: "test-user-123",
          status: "active",
          totalQuestions: 5,
          totalDuration: 0,
          createdAt: new Date("2025-10-27"),
        },
      ];

      const mockReport1 = {
        id: "report-1",
        sessionId: "session-1",
        overallScore: "4.2",
      };

      const mockReport2 = {
        id: "report-2",
        sessionId: "session-2",
        overallScore: "3.8",
      };

      storageMocks.getUserPracticeSessions.mockResolvedValue(mockSessions);
      storageMocks.getPracticeReport
        .mockResolvedValueOnce(mockReport1)
        .mockResolvedValueOnce(mockReport2);

      const response = await request(app).get("/api/practice/history");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toHaveLength(3);
      expect(response.body.data.analytics).toEqual({
        totalSessions: 3,
        completedSessions: 2,
        activeSessions: 1,
        avgScore: 4.0,
        avgQuestionsPerSession: 9,
        totalPracticeTime: 2160,
      });
      expect(response.body.data.pagination).toEqual({
        limit: 20,
        offset: 0,
        total: 3,
        hasMore: false,
      });
    });

    it("should filter sessions by status", async () => {
      const mockSessions = [
        {
          id: "session-1",
          status: "completed",
          totalQuestions: 10,
        },
        {
          id: "session-2",
          status: "active",
          totalQuestions: 5,
        },
      ];

      storageMocks.getUserPracticeSessions.mockResolvedValue(mockSessions);

      const response = await request(app)
        .get("/api/practice/history")
        .query({ status: "completed" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.analytics.completedSessions).toBe(1);
      expect(response.body.data.analytics.activeSessions).toBe(0);
    });

    it("should return 400 for invalid status filter", async () => {
      const response = await request(app)
        .get("/api/practice/history")
        .query({ status: "invalid-status" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid status filter");
    });

    it("should handle pagination parameters", async () => {
      const mockSessions = Array.from({ length: 25 }, (_, i) => ({
        id: `session-${i}`,
        status: "completed",
        totalQuestions: 10,
      }));

      storageMocks.getUserPracticeSessions.mockResolvedValue(mockSessions);

      const response = await request(app)
        .get("/api/practice/history")
        .query({ limit: 10, offset: 5 });

      expect(response.status).toBe(200);
      expect(response.body.data.sessions).toHaveLength(10);
      expect(response.body.data.pagination).toEqual({
        limit: 10,
        offset: 5,
        total: 25,
        hasMore: true,
      });
    });

    it("should limit maximum page size to 100", async () => {
      const mockSessions = Array.from({ length: 150 }, (_, i) => ({
        id: `session-${i}`,
        status: "completed",
      }));

      storageMocks.getUserPracticeSessions.mockResolvedValue(mockSessions);

      const response = await request(app)
        .get("/api/practice/history")
        .query({ limit: 200 });

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.limit).toBe(100);
    });

    it("should handle sessions with missing reports", async () => {
      const mockSessions = [
        {
          id: "session-1",
          status: "completed",
          totalQuestions: 10,
        },
      ];

      storageMocks.getUserPracticeSessions.mockResolvedValue(mockSessions);
      storageMocks.getPracticeReport.mockResolvedValue(null);

      const response = await request(app).get("/api/practice/history");

      expect(response.status).toBe(200);
      expect(response.body.data.analytics.avgScore).toBe(0);
    });
  });

  // ============================================================================
  // Practice Assessment Tests
  // ============================================================================

  describe("GET /api/practice/assessment/:id", () => {
    it("should get comprehensive assessment for completed session", async () => {
      const mockSession = {
        id: "session-1",
        userId: "test-user-123",
        jobPosition: "Software Engineer",
        companyName: "Tech Corp",
        interviewStage: "Technical",
        difficultyLevel: "intermediate",
        preferredLanguage: "en",
        totalQuestions: 5,
        currentQuestionNumber: 6,
        totalDuration: 1200,
        status: "completed",
        createdAt: new Date("2025-10-25T10:00:00Z"),
        updatedAt: new Date("2025-10-25T10:20:00Z"),
        messages: [
          {
            id: "msg-1",
            messageType: "ai_question",
            questionNumber: 1,
            content: "Tell me about a challenging project",
          },
          {
            id: "msg-2",
            messageType: "user_response",
            questionNumber: 1,
            content: "I worked on a complex system...",
            responseTime: 180,
            inputMethod: "text",
          },
          {
            id: "msg-3",
            messageType: "ai_question",
            questionNumber: 2,
            content: "How do you handle conflict?",
          },
          {
            id: "msg-4",
            messageType: "user_response",
            questionNumber: 2,
            content: "I approach conflict with empathy...",
            responseTime: 150,
            inputMethod: "voice",
          },
        ],
      };

      const mockReport = {
        id: "report-1",
        sessionId: "session-1",
        overallScore: "4.2",
        overallRating: "Strong",
        relevanceScore: "4.5",
        starStructureScore: "4.0",
        specificEvidenceScore: "4.2",
        roleAlignmentScore: "4.3",
        outcomeOrientedScore: "4.1",
        communicationScore: "4.4",
        problemSolvingScore: "4.0",
        culturalFitScore: "4.2",
        learningAgilityScore: "4.1",
        strengths: JSON.stringify([
          "Clear communication",
          "Good STAR structure",
          "Specific examples",
        ]),
        weaknesses: JSON.stringify(["Could include more metrics", "Brief on results"]),
        improvements: JSON.stringify([
          "Add quantifiable outcomes",
          "Elaborate on impact",
        ]),
        detailedFeedback: "Strong performance overall with good use of STAR method.",
        keyInsights: JSON.stringify([
          "Completed 5 questions in 20 minutes",
          "Overall performance: Strong (4.2/5.0)",
          "Pass threshold: ✅ ACHIEVED",
        ]),
        recommendedActions: JSON.stringify([
          "Continue practicing STAR responses",
          "Focus on measurable outcomes",
          "Schedule follow-up sessions",
        ]),
        evaluatedBy: "comprehensive-ai",
        criteriaVersion: "9-criteria-v1.0",
        sessionLanguage: "en",
        totalResponses: 5,
        sessionDuration: 1200,
      };

      storageMocks.getPracticeSession.mockResolvedValue(mockSession);
      storageMocks.getPracticeReport.mockResolvedValue(mockReport);

      const response = await request(app).get("/api/practice/assessment/session-1");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const assessment = response.body.data;

      // Verify session data
      expect(assessment.session).toEqual({
        id: "session-1",
        jobPosition: "Software Engineer",
        companyName: "Tech Corp",
        interviewStage: "Technical",
        difficultyLevel: "intermediate",
        preferredLanguage: "en",
        totalQuestions: 5,
        currentQuestionNumber: 6,
        totalDuration: 1200,
        createdAt: mockSession.createdAt.toISOString(),
        completedAt: mockSession.updatedAt.toISOString(),
      });

      // Verify evaluation data
      expect(assessment.evaluation.overallScore).toBe(4.2);
      expect(assessment.evaluation.overallRating).toBe("Strong");
      expect(assessment.evaluation.criteriaScores).toEqual({
        relevanceScore: 4.5,
        starStructureScore: 4.0,
        specificEvidenceScore: 4.2,
        roleAlignmentScore: 4.3,
        outcomeOrientedScore: 4.1,
        communicationScore: 4.4,
        problemSolvingScore: 4.0,
        culturalFitScore: 4.2,
        learningAgilityScore: 4.1,
      });

      // Verify feedback
      expect(assessment.evaluation.feedback.strengths).toHaveLength(3);
      expect(assessment.evaluation.feedback.weaknesses).toHaveLength(2);
      expect(assessment.evaluation.feedback.improvements).toHaveLength(2);

      // Verify Q&A pairs
      expect(assessment.questionsAndResponses).toHaveLength(2);
      expect(assessment.questionsAndResponses[0]).toEqual({
        questionNumber: 1,
        question: "Tell me about a challenging project",
        response: "I worked on a complex system...",
        responseTime: 180,
        inputMethod: "text",
      });
    });

    it("should return 404 for non-existent session", async () => {
      storageMocks.getPracticeSession.mockResolvedValue(null);

      const response = await request(app).get("/api/practice/assessment/nonexistent");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Practice session not found");
    });

    it("should return 403 for unauthorized access", async () => {
      const mockSession = {
        id: "session-1",
        userId: "other-user-456",
        status: "completed",
      };

      storageMocks.getPracticeSession.mockResolvedValue(mockSession);

      const response = await request(app).get("/api/practice/assessment/session-1");

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Access denied to this session");
    });

    it("should return 400 for incomplete session", async () => {
      const mockSession = {
        id: "session-1",
        userId: "test-user-123",
        status: "active",
      };

      storageMocks.getPracticeSession.mockResolvedValue(mockSession);

      const response = await request(app).get("/api/practice/assessment/session-1");

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Session not completed");
    });

    it("should return 404 if report not available", async () => {
      const mockSession = {
        id: "session-1",
        userId: "test-user-123",
        status: "completed",
      };

      storageMocks.getPracticeSession.mockResolvedValue(mockSession);
      storageMocks.getPracticeReport.mockResolvedValue(null);

      const response = await request(app).get("/api/practice/assessment/session-1");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Assessment not found");
    });

    it("should handle malformed JSON in report fields", async () => {
      const mockSession = {
        id: "session-1",
        userId: "test-user-123",
        status: "completed",
        messages: [],
      };

      const mockReport = {
        id: "report-1",
        sessionId: "session-1",
        overallScore: "4.0",
        overallRating: "Good",
        relevanceScore: "4.0",
        starStructureScore: "4.0",
        specificEvidenceScore: "4.0",
        roleAlignmentScore: "4.0",
        outcomeOrientedScore: "4.0",
        communicationScore: "4.0",
        problemSolvingScore: "4.0",
        culturalFitScore: "4.0",
        learningAgilityScore: "4.0",
        strengths: null, // Malformed
        weaknesses: null, // Malformed
        improvements: null, // Malformed
        keyInsights: null, // Malformed
        recommendedActions: null, // Malformed
        detailedFeedback: "Test feedback",
        evaluatedBy: "test",
        criteriaVersion: "v1",
        sessionLanguage: "en",
        totalResponses: 0,
        sessionDuration: 0,
      };

      storageMocks.getPracticeSession.mockResolvedValue(mockSession);
      storageMocks.getPracticeReport.mockResolvedValue(mockReport);

      const response = await request(app).get("/api/practice/assessment/session-1");

      expect(response.status).toBe(200);
      expect(response.body.data.evaluation.feedback.strengths).toEqual([]);
      expect(response.body.data.evaluation.feedback.weaknesses).toEqual([]);
    });
  });

  // ============================================================================
  // Authentication Tests
  // ============================================================================

  describe("Authentication", () => {
    it("should return 401 for unauthenticated history request", async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use((req, _res, next) => {
        req.user = undefined;
        next();
      });
      unauthApp.use("/api/practice", practiceRouter);

      const response = await request(unauthApp).get("/api/practice/history");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("User not authenticated");
    });

    it("should return 401 for unauthenticated assessment request", async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use((req, _res, next) => {
        req.user = undefined;
        next();
      });
      unauthApp.use("/api/practice", practiceRouter);

      const response = await request(unauthApp).get("/api/practice/assessment/session-1");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("User not authenticated");
    });
  });
});
