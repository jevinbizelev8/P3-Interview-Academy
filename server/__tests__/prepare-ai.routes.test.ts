import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSession: vi.fn(),
  getSession: vi.fn(),
  getUserSessions: vi.fn(),
  generateNextQuestion: vi.fn(),
  processResponse: vi.fn(),
  getSessionProgress: vi.fn(),
  updateSessionStatus: vi.fn(),
  deleteSession: vi.fn(),
  emitToSession: vi.fn(),
}));

const TEST_USER_ID = "11111111-1111-4111-8111-333333333333";
vi.mock("../services/prepare-ai-service.js", () => ({
  PrepareAIService: vi.fn(() => ({
    createSession: mocks.createSession,
    getSession: mocks.getSession,
    getUserSessions: mocks.getUserSessions,
    generateNextQuestion: mocks.generateNextQuestion,
    processResponse: mocks.processResponse,
    getSessionProgress: mocks.getSessionProgress,
    updateSessionStatus: mocks.updateSessionStatus,
    deleteSession: mocks.deleteSession,
  })),
}));

vi.mock("../services/realtime-gateway.js", () => ({
  emitToSession: mocks.emitToSession,
}));

describe("prepare-ai routes", () => {
  beforeEach(async () => {
    Object.values(mocks).forEach(mockFn => mockFn.mockReset?.());
    await vi.resetModules();
  });

  async function createApp() {
    const { prepareAIRouter } = await import("../routes/prepare-ai");
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = { id: TEST_USER_ID, role: "user" };
      next();
    });
    app.use("/api/prepare-ai", prepareAIRouter);
    return app;
  }

  it("creates a prepare session with validated payload", async () => {
    const app = await createApp();
    mocks.createSession.mockResolvedValueOnce({ id: "prepare-session-1", jobPosition: "Product Manager" });

    const res = await request(app)
      .post("/api/prepare-ai/sessions")
      .send({
        jobPosition: "Product Manager",
        interviewStage: "functional-team",
        experienceLevel: "senior",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe("prepare-session-1");
    expect(mocks.createSession).toHaveBeenCalledWith(TEST_USER_ID, expect.objectContaining({
      jobPosition: "Product Manager",
      interviewStage: "functional-team",
      experienceLevel: "senior",
    }));
  });

  it("generates the next AI question and emits it to the session room", async () => {
    const app = await createApp();

    mocks.getSession.mockResolvedValueOnce({
      id: "prepare-session-2",
      userId: TEST_USER_ID,
      preferredLanguage: "en",
    });

    mocks.generateNextQuestion.mockResolvedValueOnce({
      id: "question-1",
      questionText: "Localized question",
      questionTextTranslated: "Tell me about yourself",
    });

    const res = await request(app)
      .post("/api/prepare-ai/sessions/prepare-session-2/question")
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("question-1");
    expect(mocks.generateNextQuestion).toHaveBeenCalledWith({
      sessionId: "prepare-session-2",
      userId: TEST_USER_ID,
      adaptiveDifficulty: true,
    });
    expect(mocks.emitToSession).toHaveBeenCalledWith("prepare-session-2", "question-generated", {
      question: "Tell me about yourself",
      questionId: "question-1",
    });
  });

  it("records a response and returns evaluation metadata", async () => {
    const app = await createApp();

    mocks.getSession.mockResolvedValueOnce({
      id: "prepare-session-3",
      userId: TEST_USER_ID,
    });

    mocks.processResponse.mockResolvedValueOnce({
      id: "response-1",
      feedback: "Great structure",
    });

    const res = await request(app)
      .post("/api/prepare-ai/sessions/prepare-session-3/respond")
      .send({
        questionId: "11111111-1111-1111-1111-111111111111",
        responseText: "I led the launch of...",
        inputMethod: "text",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("response-1");
    expect(mocks.processResponse).toHaveBeenCalledWith(
      "prepare-session-3",
      "11111111-1111-1111-1111-111111111111",
      "I led the launch of...",
      expect.objectContaining({ inputMethod: "text" })
    );
  });
});
