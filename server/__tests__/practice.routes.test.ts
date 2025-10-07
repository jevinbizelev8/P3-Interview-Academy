import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const storageMocks = vi.hoisted(() => ({
  createPracticeSession: vi.fn(),
  getPracticeSession: vi.fn(),
  getUserPracticeSessions: vi.fn(),
  addPracticeMessage: vi.fn(),
  updatePracticeSession: vi.fn(),
  createPracticeReport: vi.fn(),
  getPracticeReport: vi.fn(),
  getPracticeOverview: vi.fn(),
  getPracticeMessages: vi.fn(),
  deletePracticeMessages: vi.fn(),
  deletePracticeSession: vi.fn(),
}));

const questionGeneratorMock = vi.hoisted(() => ({ generateQuestion: vi.fn() }));
const evaluationServiceMock = vi.hoisted(() => ({ evaluateSessionResponses: vi.fn() }));

const TEST_USER_ID = "11111111-1111-4111-8111-222222222222";

vi.mock("../storage.js", () => ({
  storage: storageMocks,
}));

vi.mock("../services/ai-question-generator.js", () => ({
  AIQuestionGenerator: vi.fn(() => questionGeneratorMock),
}));

vi.mock("../services/response-evaluation-service.js", () => ({
  ResponseEvaluationService: vi.fn(() => evaluationServiceMock),
}));

describe("practice routes", () => {
  beforeEach(async () => {
    Object.values(storageMocks).forEach(mockFn => mockFn.mockReset?.());
    questionGeneratorMock.generateQuestion.mockReset();
    evaluationServiceMock.evaluateSessionResponses.mockReset();
    await vi.resetModules();
  });

  async function createApp() {
    const { default: practiceRouter } = await import("../routes/practice");
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = { id: TEST_USER_ID, role: "user" };
      next();
    });
    app.use("/api/practice", practiceRouter);
    return app;
  }

  it("creates a practice session and stores it", async () => {
    const app = await createApp();
    storageMocks.createPracticeSession.mockResolvedValueOnce({
      id: "practice-session-1",
      scenarioId: "scenario-a",
      status: "active",
    });

    const res = await request(app)
      .post("/api/practice/sessions")
      .send({
        scenarioId: "scenario-a",
        interviewStage: "phone-screening",
        difficultyLevel: "beginner",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(storageMocks.createPracticeSession).toHaveBeenCalledWith(expect.objectContaining({
      userId: TEST_USER_ID,
      scenarioId: "scenario-a",
      status: "active",
    }));
  });

  it("generates an AI question, saves it, and advances the session", async () => {
    const app = await createApp();

    storageMocks.getPracticeSession.mockResolvedValueOnce({
      id: "practice-session-2",
      userId: TEST_USER_ID,
      preferredLanguage: "en",
      currentQuestionNumber: 1,
      totalQuestions: 5,
      status: "active",
      messages: [],
    });

    questionGeneratorMock.generateQuestion.mockResolvedValueOnce({
      id: "question-987",
      questionText: "What motivates you?",
    });

    storageMocks.addPracticeMessage.mockResolvedValueOnce({
      id: "message-1",
      messageType: "ai_question",
      content: "What motivates you?",
    });

    const res = await request(app)
      .post("/api/practice/sessions/practice-session-2/ai-question")
      .send({});

    expect(res.status).toBe(200);
    expect(questionGeneratorMock.generateQuestion).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: "practice-session-2",
      questionNumber: 1,
    }));
    expect(storageMocks.addPracticeMessage).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: "practice-session-2",
      messageType: "ai_question",
      content: "What motivates you?",
    }));
    expect(storageMocks.updatePracticeSession).toHaveBeenCalledWith("practice-session-2", expect.objectContaining({
      currentQuestionNumber: 2,
    }));

    expect(res.body.data.question.id).toBe("question-987");
  });

  it("completes a session by evaluating responses and storing a report", async () => {
    const app = await createApp();

    const sessionMessages = [
      {
        id: "msg-1",
        messageType: "user_response" as const,
        content: "I increased revenue by 20%",
        questionNumber: 1,
      },
    ];

    storageMocks.getPracticeSession.mockResolvedValueOnce({
      id: "practice-session-3",
      userId: TEST_USER_ID,
      status: "active",
      startedAt: new Date("2024-01-01T00:00:00Z"),
      messages: sessionMessages,
      difficultyLevel: "intermediate",
      preferredLanguage: "en",
      scenarioId: "behavioral",
    });

    evaluationServiceMock.evaluateSessionResponses.mockResolvedValueOnce({
      overallScores: {
        weightedOverallScore: 4.1,
        relevanceScore: 4,
        starStructureScore: 4,
        specificEvidenceScore: 4,
        roleAlignmentScore: 4,
        outcomeOrientedScore: 4,
        communicationScore: 4,
        problemSolvingScore: 4,
        culturalFitScore: 4,
        learningAgilityScore: 4,
        overallRating: "Strong",
        detailedFeedback: {
          strengths: ["Great clarity"],
          weaknesses: ["Could include metrics"],
          suggestions: ["Add more numbers"],
        },
      },
      sessionSummary: {
        totalResponses: 1,
        keyStrengths: ["Clear communication"],
        criticalImprovements: ["Provide quantifiable results"],
        nextSteps: ["Practice with timer"],
      },
    });

    storageMocks.createPracticeReport.mockResolvedValueOnce({ id: "report-1" });

    const res = await request(app)
      .post("/api/practice/sessions/practice-session-3/complete")
      .send();

    expect(res.status).toBe(200);
    expect(storageMocks.createPracticeReport).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: "practice-session-3",
      userId: TEST_USER_ID,
      overallScore: "4.1",
      overallRating: "Strong",
    }));
    expect(storageMocks.updatePracticeSession).toHaveBeenCalledWith("practice-session-3", expect.objectContaining({
      status: "completed",
    }));
    expect(res.body.data.report.id).toBe("report-1");
  });
});
