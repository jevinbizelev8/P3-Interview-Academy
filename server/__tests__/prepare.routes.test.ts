import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_USER_ID = "11111111-1111-4111-8111-222222222222";
const TEST_MODULE_ID = "22222222-2222-4222-8222-333333333333";
const TEST_RESUME_ID = "33333333-3333-4333-8333-444444444444";

// Mock LearningModuleService
const learningModuleServiceMocks = vi.hoisted(() => ({
  getModules: vi.fn(),
  getModulesByStage: vi.fn(),
  getModulesWithProgress: vi.fn(),
  updateProgress: vi.fn(),
  getUserProgress: vi.fn(),
}));

// Mock SelfIntroService
const selfIntroServiceMocks = vi.hoisted(() => ({
  saveDraft: vi.fn(),
  getDrafts: vi.fn(),
  getDraftByStep: vi.fn(),
  finalizeIntro: vi.fn(),
}));

// Mock ResumeService
const resumeServiceMocks = vi.hoisted(() => ({
  uploadResume: vi.fn(),
  analyzeResume: vi.fn(),
  getResumeById: vi.fn(),
}));

// Mock ReadinessService
const readinessServiceMocks = vi.hoisted(() => ({
  calculateReadinessScore: vi.fn(),
}));

// Mock database for STAR stories
const dbMocks = vi.hoisted(() => ({
  insert: vi.fn(),
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  returning: vi.fn(),
}));

vi.mock("../services/learning-module-service", () => ({
  LearningModuleService: learningModuleServiceMocks,
}));

vi.mock("../services/self-intro-service", () => ({
  SelfIntroService: vi.fn(() => selfIntroServiceMocks),
}));

vi.mock("../services/resume-service", () => ({
  ResumeService: vi.fn(() => resumeServiceMocks),
}));

vi.mock("../services/readiness-service", () => ({
  ReadinessService: readinessServiceMocks,
}));

vi.mock("../db", () => ({
  db: dbMocks,
}));

describe("Prepare API Routes", () => {
  beforeEach(async () => {
    // Reset all mocks
    Object.values(learningModuleServiceMocks).forEach(mockFn => mockFn.mockReset?.());
    Object.values(selfIntroServiceMocks).forEach(mockFn => mockFn.mockReset?.());
    Object.values(resumeServiceMocks).forEach(mockFn => mockFn.mockReset?.());
    Object.values(readinessServiceMocks).forEach(mockFn => mockFn.mockReset?.());
    Object.values(dbMocks).forEach(mockFn => mockFn.mockReset?.());
    await vi.resetModules();
  });

  async function createApp() {
    const { default: prepareRouter } = await import("../routes/prepare");
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = { id: TEST_USER_ID, role: "user" };
      next();
    });
    app.use("/api/prepare", prepareRouter);
    return app;
  }

  //
  // Learning Modules Tests
  //

  describe("Learning Modules", () => {
    describe("GET /api/prepare/modules", () => {
      it("returns all modules without progress", async () => {
        const app = await createApp();
        const mockModules = [
          { id: TEST_MODULE_ID, title: "Interview Basics", stage: "prepare" },
          { id: "module-2", title: "STAR Method", stage: "prepare" },
        ];

        learningModuleServiceMocks.getModules.mockResolvedValueOnce(mockModules);

        const res = await request(app)
          .get("/api/prepare/modules");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(mockModules);
        expect(learningModuleServiceMocks.getModules).toHaveBeenCalled();
      });

      it("returns modules with progress when includeProgress=true", async () => {
        const app = await createApp();
        const mockModulesWithProgress = [
          {
            id: TEST_MODULE_ID,
            title: "Interview Basics",
            progress: { isCompleted: true, score: 85 }
          },
        ];

        learningModuleServiceMocks.getModulesWithProgress.mockResolvedValueOnce(mockModulesWithProgress);

        const res = await request(app)
          .get("/api/prepare/modules?includeProgress=true");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(mockModulesWithProgress);
        expect(learningModuleServiceMocks.getModulesWithProgress).toHaveBeenCalledWith(TEST_USER_ID);
      });

      it("requires authentication", async () => {
        const { default: prepareRouter } = await import("../routes/prepare");
        const app = express();
        app.use(express.json());
        app.use("/api/prepare", prepareRouter);

        const res = await request(app)
          .get("/api/prepare/modules");

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });
    });

    describe("GET /api/prepare/modules/:stage", () => {
      it("returns modules for valid stage", async () => {
        const app = await createApp();
        const mockModules = [
          { id: TEST_MODULE_ID, title: "Interview Basics", stage: "prepare" },
        ];

        learningModuleServiceMocks.getModulesByStage.mockResolvedValueOnce(mockModules);

        const res = await request(app)
          .get("/api/prepare/modules/prepare");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(mockModules);
        expect(learningModuleServiceMocks.getModulesByStage).toHaveBeenCalledWith("prepare");
      });

      it("returns 400 for invalid stage", async () => {
        const app = await createApp();

        const res = await request(app)
          .get("/api/prepare/modules/invalid-stage");

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe("POST /api/prepare/modules/progress", () => {
      it("updates module progress successfully", async () => {
        const app = await createApp();
        const mockProgress = {
          id: "progress-1",
          userId: TEST_USER_ID,
          moduleId: TEST_MODULE_ID,
          isCompleted: true,
          score: 90,
        };

        learningModuleServiceMocks.updateProgress.mockResolvedValueOnce(mockProgress);

        const res = await request(app)
          .post("/api/prepare/modules/progress")
          .send({
            moduleId: TEST_MODULE_ID,
            isCompleted: true,
            score: 90,
            timeSpentMinutes: 15,
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(mockProgress);
        expect(learningModuleServiceMocks.updateProgress).toHaveBeenCalledWith(
          TEST_USER_ID,
          TEST_MODULE_ID,
          expect.objectContaining({ isCompleted: true, score: 90 })
        );
      });

      it("returns 400 for invalid moduleId", async () => {
        const app = await createApp();

        const res = await request(app)
          .post("/api/prepare/modules/progress")
          .send({
            moduleId: "invalid-uuid",
            isCompleted: true,
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe("GET /api/prepare/modules/progress", () => {
      it("returns all user progress", async () => {
        const app = await createApp();
        const mockProgress = [
          { moduleId: TEST_MODULE_ID, isCompleted: true, score: 90 },
          { moduleId: "module-2", isCompleted: false, score: null },
        ];

        learningModuleServiceMocks.getUserProgress.mockResolvedValueOnce(mockProgress);

        const res = await request(app)
          .get("/api/prepare/modules/progress");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(mockProgress);
        expect(learningModuleServiceMocks.getUserProgress).toHaveBeenCalledWith(TEST_USER_ID, undefined);
      });

      it("returns progress for specific module", async () => {
        const app = await createApp();
        const mockProgress = [
          { moduleId: TEST_MODULE_ID, isCompleted: true, score: 90 },
        ];

        learningModuleServiceMocks.getUserProgress.mockResolvedValueOnce(mockProgress);

        const res = await request(app)
          .get(`/api/prepare/modules/progress?moduleId=${TEST_MODULE_ID}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(learningModuleServiceMocks.getUserProgress).toHaveBeenCalledWith(TEST_USER_ID, TEST_MODULE_ID);
      });

      it("returns 400 for invalid moduleId format", async () => {
        const app = await createApp();

        const res = await request(app)
          .get("/api/prepare/modules/progress?moduleId=invalid-uuid");

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });
  });

  //
  // Self-Introduction Tests
  //

  describe("Self-Introduction", () => {
    describe("POST /api/prepare/self-intro/draft", () => {
      it("saves draft successfully", async () => {
        const app = await createApp();
        const mockDraft = {
          id: "draft-1",
          userId: TEST_USER_ID,
          stepNumber: 1,
          stepData: { intro: "Hello, my name is..." },
        };

        selfIntroServiceMocks.saveDraft.mockResolvedValueOnce(mockDraft);

        const res = await request(app)
          .post("/api/prepare/self-intro/draft")
          .send({
            stepNumber: 1,
            stepData: { intro: "Hello, my name is..." },
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(mockDraft);
        expect(selfIntroServiceMocks.saveDraft).toHaveBeenCalledWith(
          TEST_USER_ID,
          1,
          { intro: "Hello, my name is..." }
        );
      });

      it("returns 400 for invalid step number", async () => {
        const app = await createApp();

        const res = await request(app)
          .post("/api/prepare/self-intro/draft")
          .send({
            stepNumber: 7, // Invalid: must be 1-6
            stepData: {},
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe("GET /api/prepare/self-intro/draft", () => {
      it("returns all draft steps", async () => {
        const app = await createApp();
        const mockDrafts = [
          { stepNumber: 1, stepData: { intro: "Hello" } },
          { stepNumber: 2, stepData: { background: "I graduated from..." } },
        ];

        selfIntroServiceMocks.getDrafts.mockResolvedValueOnce(mockDrafts);

        const res = await request(app)
          .get("/api/prepare/self-intro/draft");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(mockDrafts);
        expect(selfIntroServiceMocks.getDrafts).toHaveBeenCalledWith(TEST_USER_ID);
      });

      it("returns specific step draft", async () => {
        const app = await createApp();
        const mockDraft = { stepNumber: 1, stepData: { intro: "Hello" } };

        selfIntroServiceMocks.getDraftByStep.mockResolvedValueOnce(mockDraft);

        const res = await request(app)
          .get("/api/prepare/self-intro/draft?stepNumber=1");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(mockDraft);
        expect(selfIntroServiceMocks.getDraftByStep).toHaveBeenCalledWith(TEST_USER_ID, 1);
      });

      it("returns 404 when step draft not found", async () => {
        const app = await createApp();

        selfIntroServiceMocks.getDraftByStep.mockResolvedValueOnce(null);

        const res = await request(app)
          .get("/api/prepare/self-intro/draft?stepNumber=3");

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
      });

      it("returns 400 for invalid step number", async () => {
        const app = await createApp();

        const res = await request(app)
          .get("/api/prepare/self-intro/draft?stepNumber=10");

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe("POST /api/prepare/self-intro/finalize", () => {
      it("finalizes self-intro with AI feedback", async () => {
        const app = await createApp();
        const mockIntro = {
          id: "intro-1",
          userId: TEST_USER_ID,
          script: "Hello, my name is John...",
          overallScore: 85,
          aiFeedback: {
            structureScore: 80,
            clarityScore: 90,
            impactScore: 85,
            strengths: ["Clear opening", "Good pace"],
            improvements: ["Add more specifics"],
          },
        };

        selfIntroServiceMocks.finalizeIntro.mockResolvedValueOnce(mockIntro);

        const res = await request(app)
          .post("/api/prepare/self-intro/finalize")
          .send({
            script: "Hello, my name is John...",
            videoUrl: "https://example.com/video.mp4",
            videoDuration: 60,
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(mockIntro);
        expect(selfIntroServiceMocks.finalizeIntro).toHaveBeenCalledWith(
          TEST_USER_ID,
          "Hello, my name is John...",
          "https://example.com/video.mp4",
          60
        );
      });

      it("returns 400 for missing script", async () => {
        const app = await createApp();

        const res = await request(app)
          .post("/api/prepare/self-intro/finalize")
          .send({});

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it("returns 400 for script too short", async () => {
        const app = await createApp();

        const res = await request(app)
          .post("/api/prepare/self-intro/finalize")
          .send({
            script: "Hi",
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });
  });

  //
  // Resume Analyzer Tests
  //

  describe("Resume Analyzer", () => {
    describe("POST /api/prepare/resume/analyze", () => {
      it("analyzes resume successfully", async () => {
        const app = await createApp();
        const mockAnalysis = {
          atsScore: 75,
          jdMatchPercentage: 80,
          strengths: ["Clear experience section", "Good keywords"],
          gaps: ["Missing certifications"],
          keywords: ["JavaScript", "React", "Node.js"],
          atsTips: ["Use standard headings"],
          suggestions: ["Add more metrics"],
        };

        resumeServiceMocks.analyzeResume.mockResolvedValueOnce(mockAnalysis);

        const res = await request(app)
          .post("/api/prepare/resume/analyze")
          .send({
            resumeId: TEST_RESUME_ID,
            jobDescriptionText: "Looking for a senior developer...",
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(mockAnalysis);
        expect(resumeServiceMocks.analyzeResume).toHaveBeenCalledWith(
          TEST_RESUME_ID,
          "Looking for a senior developer..."
        );
      });

      it("returns 404 when resume not found", async () => {
        const app = await createApp();

        resumeServiceMocks.analyzeResume.mockRejectedValueOnce(new Error("Resume not found"));

        const res = await request(app)
          .post("/api/prepare/resume/analyze")
          .send({
            resumeId: TEST_RESUME_ID,
          });

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
      });

      it("returns 400 for invalid resumeId", async () => {
        const app = await createApp();

        const res = await request(app)
          .post("/api/prepare/resume/analyze")
          .send({
            resumeId: "invalid-uuid",
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe("GET /api/prepare/resume/:id", () => {
      it("returns resume successfully", async () => {
        const app = await createApp();
        const mockResume = {
          id: TEST_RESUME_ID,
          userId: TEST_USER_ID,
          filename: "resume.pdf",
          atsScore: 75,
        };

        resumeServiceMocks.getResumeById.mockResolvedValueOnce(mockResume);

        const res = await request(app)
          .get(`/api/prepare/resume/${TEST_RESUME_ID}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(mockResume);
      });

      it("returns 404 when resume not found", async () => {
        const app = await createApp();

        resumeServiceMocks.getResumeById.mockResolvedValueOnce(null);

        const res = await request(app)
          .get(`/api/prepare/resume/${TEST_RESUME_ID}`);

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
      });

      it("returns 403 when accessing another user's resume", async () => {
        const app = await createApp();
        const mockResume = {
          id: TEST_RESUME_ID,
          userId: "different-user-id",
          filename: "resume.pdf",
        };

        resumeServiceMocks.getResumeById.mockResolvedValueOnce(mockResume);

        const res = await request(app)
          .get(`/api/prepare/resume/${TEST_RESUME_ID}`);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain("Access denied");
      });

      it("returns 400 for invalid resume ID format", async () => {
        const app = await createApp();

        const res = await request(app)
          .get("/api/prepare/resume/invalid-uuid");

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });
  });

  //
  // STAR Stories Tests
  //

  describe("STAR Stories", () => {
    describe("POST /api/prepare/star-stories", () => {
      it("creates STAR story successfully", async () => {
        const app = await createApp();
        const mockStory = {
          id: "story-1",
          userId: TEST_USER_ID,
          title: "Led team project",
          situation: "Our team was behind schedule...",
          task: "I needed to get us back on track...",
          action: "I organized daily standups...",
          result: "We delivered on time with 95% quality...",
          tags: ["leadership", "teamwork"],
        };

        dbMocks.insert.mockReturnValue(dbMocks);
        dbMocks.returning.mockResolvedValueOnce([mockStory]);

        const res = await request(app)
          .post("/api/prepare/star-stories")
          .send({
            title: "Led team project",
            situation: "Our team was behind schedule...",
            task: "I needed to get us back on track...",
            action: "I organized daily standups...",
            result: "We delivered on time with 95% quality...",
            tags: ["leadership", "teamwork"],
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe("Led team project");
      });

      it("returns 400 for missing required fields", async () => {
        const app = await createApp();

        const res = await request(app)
          .post("/api/prepare/star-stories")
          .send({
            title: "Led team project",
            // Missing situation, task, action, result
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe("GET /api/prepare/star-stories", () => {
      it("returns user's STAR stories", async () => {
        const app = await createApp();
        const mockStories = [
          {
            id: "story-1",
            userId: TEST_USER_ID,
            title: "Led team project",
          },
          {
            id: "story-2",
            userId: TEST_USER_ID,
            title: "Resolved customer issue",
          },
        ];

        dbMocks.select.mockReturnValue(dbMocks);
        dbMocks.from.mockReturnValue(dbMocks);
        dbMocks.where.mockResolvedValueOnce(mockStories);

        const res = await request(app)
          .get("/api/prepare/star-stories");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(2);
      });
    });
  });

  //
  // Readiness Score Tests
  //

  describe("Readiness Score", () => {
    describe("GET /api/prepare/readiness-score", () => {
      it("calculates and returns readiness score", async () => {
        const app = await createApp();
        const mockResult = {
          overallScore: 72,
          breakdown: {
            simulationPerformance: { score: 75, weight: 0.6, weighted: 45 },
            moduleCompletion: { score: 60, weight: 0.2, weighted: 12 },
            selfIntroduction: { score: 80, weight: 0.1, weighted: 8 },
            resumeOptimization: { score: 70, weight: 0.05, weighted: 3.5 },
            practiceConsistency: { score: 70, weight: 0.05, weighted: 3.5 },
          },
          recommendations: [
            "Complete more practice simulations",
            "Finish remaining learning modules",
          ],
        };

        readinessServiceMocks.calculateReadinessScore.mockResolvedValueOnce(mockResult);

        const res = await request(app)
          .get("/api/prepare/readiness-score");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.overallScore).toBe(72);
        expect(res.body.data.breakdown).toBeDefined();
        expect(res.body.data.recommendations).toBeDefined();
        expect(readinessServiceMocks.calculateReadinessScore).toHaveBeenCalledWith(TEST_USER_ID);
      });

      it("requires authentication", async () => {
        const { default: prepareRouter } = await import("../routes/prepare");
        const app = express();
        app.use(express.json());
        app.use("/api/prepare", prepareRouter);

        const res = await request(app)
          .get("/api/prepare/readiness-score");

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });
    });
  });
});
