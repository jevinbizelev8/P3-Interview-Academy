import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_USER_ID = "11111111-1111-4111-8111-222222222222";
const TEST_BADGE_ID = "22222222-2222-4222-8222-333333333333";

// Mock BadgeService
const badgeServiceMocks = vi.hoisted(() => ({
  getAllBadges: vi.fn(),
  getUserBadges: vi.fn(),
  getUserBadgeStats: vi.fn(),
  getRecentlyEarnedBadges: vi.fn(),
  hasUserEarnedBadge: vi.fn(),
  getBadgeById: vi.fn(),
}));

// Mock GamificationService
const gamificationServiceMocks = vi.hoisted(() => ({
  addPoints: vi.fn(),
  getPoints: vi.fn(),
  awardBadge: vi.fn(),
  updateStreak: vi.fn(),
  getStreak: vi.fn(),
  getLeaderboard: vi.fn(),
}));

vi.mock("../services/badge-service", () => ({
  BadgeService: badgeServiceMocks,
}));

vi.mock("../services/gamification-service", () => ({
  GamificationService: gamificationServiceMocks,
}));

describe("Gamification API Routes", () => {
  beforeEach(async () => {
    // Reset all mocks
    Object.values(badgeServiceMocks).forEach(mockFn => mockFn.mockReset?.());
    Object.values(gamificationServiceMocks).forEach(mockFn => mockFn.mockReset?.());
    await vi.resetModules();
  });

  async function createApp() {
    const { default: gamificationRouter } = await import("../routes/gamification");
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = { id: TEST_USER_ID, role: "user" };
      next();
    });
    app.use("/api/gamification", gamificationRouter);
    return app;
  }

  //
  // Badge Tests
  //

  describe("Badges", () => {
    describe("GET /api/gamification/badges", () => {
      it("returns all active badges", async () => {
        const app = await createApp();
        const mockBadges = [
          {
            id: TEST_BADGE_ID,
            name: "First Steps",
            category: "learning",
            requirementValue: 1,
            xpReward: 50,
          },
          {
            id: "badge-2",
            name: "Quick Learner",
            category: "learning",
            requirementValue: 5,
            xpReward: 100,
          },
        ];

        badgeServiceMocks.getAllBadges.mockResolvedValueOnce(mockBadges);

        const res = await request(app)
          .get("/api/gamification/badges");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(mockBadges);
        expect(badgeServiceMocks.getAllBadges).toHaveBeenCalledWith(undefined);
      });

      it("returns badges filtered by category", async () => {
        const app = await createApp();
        const mockBadges = [
          {
            id: TEST_BADGE_ID,
            name: "First Steps",
            category: "learning",
          },
        ];

        badgeServiceMocks.getAllBadges.mockResolvedValueOnce(mockBadges);

        const res = await request(app)
          .get("/api/gamification/badges?category=learning");

        expect(res.status).toBe(200);
        expect(badgeServiceMocks.getAllBadges).toHaveBeenCalledWith("learning");
      });
    });

    describe("GET /api/gamification/user-badges", () => {
      it("returns user's badges with progress and stats", async () => {
        const app = await createApp();
        const mockUserBadges = [
          {
            id: TEST_BADGE_ID,
            name: "First Steps",
            progress: 1,
            isEarned: true,
            earnedDate: new Date().toISOString(),
            progressPercentage: 100,
          },
        ];
        const mockStats = {
          totalEarned: 1,
          totalAvailable: 10,
          byCategory: {
            learning: { earned: 1, available: 5, percentage: 20 },
          },
          completionPercentage: 10,
        };

        badgeServiceMocks.getUserBadges.mockResolvedValueOnce(mockUserBadges);
        badgeServiceMocks.getUserBadgeStats.mockResolvedValueOnce(mockStats);

        const res = await request(app)
          .get("/api/gamification/user-badges");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.badges).toEqual(mockUserBadges);
        expect(res.body.data.stats).toEqual(mockStats);
        expect(badgeServiceMocks.getUserBadges).toHaveBeenCalledWith(TEST_USER_ID, false);
      });

      it("returns only earned badges when earnedOnly=true", async () => {
        const app = await createApp();

        badgeServiceMocks.getUserBadges.mockResolvedValueOnce([]);
        badgeServiceMocks.getUserBadgeStats.mockResolvedValueOnce({
          totalEarned: 0,
          totalAvailable: 10,
          byCategory: {},
          completionPercentage: 0,
        });

        const res = await request(app)
          .get("/api/gamification/user-badges?earnedOnly=true");

        expect(res.status).toBe(200);
        expect(badgeServiceMocks.getUserBadges).toHaveBeenCalledWith(TEST_USER_ID, true);
      });

      it("requires authentication", async () => {
        const { default: gamificationRouter } = await import("../routes/gamification");
        const app = express();
        app.use(express.json());
        app.use("/api/gamification", gamificationRouter);

        const res = await request(app)
          .get("/api/gamification/user-badges");

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });
    });

    describe("POST /api/gamification/award-badge", () => {
      it("awards badge successfully", async () => {
        const app = await createApp();
        const mockResult = {
          awarded: true,
          userBadge: {
            id: "user-badge-1",
            userId: TEST_USER_ID,
            badgeId: TEST_BADGE_ID,
            progress: 1,
            earnedDate: new Date().toISOString(),
          },
          xpAwarded: 50,
        };

        gamificationServiceMocks.awardBadge.mockResolvedValueOnce(mockResult);

        const res = await request(app)
          .post("/api/gamification/award-badge")
          .send({
            badgeId: TEST_BADGE_ID,
            progress: 1,
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(mockResult);
        expect(gamificationServiceMocks.awardBadge).toHaveBeenCalledWith(
          TEST_USER_ID,
          TEST_BADGE_ID,
          1
        );
      });

      it("returns 400 for invalid badgeId", async () => {
        const app = await createApp();

        const res = await request(app)
          .post("/api/gamification/award-badge")
          .send({
            badgeId: "invalid-uuid",
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it("returns 404 when badge not found", async () => {
        const app = await createApp();

        gamificationServiceMocks.awardBadge.mockRejectedValueOnce(
          new Error("Badge not found")
        );

        const res = await request(app)
          .post("/api/gamification/award-badge")
          .send({
            badgeId: TEST_BADGE_ID,
          });

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
      });
    });
  });

  //
  // XP Points Tests
  //

  describe("XP Points", () => {
    describe("POST /api/gamification/add-points", () => {
      it("adds points successfully", async () => {
        const app = await createApp();
        const mockResult = {
          newTotal: 150,
          pointsAdded: 50,
          leveledUp: false,
        };

        gamificationServiceMocks.addPoints.mockResolvedValueOnce(mockResult);

        const res = await request(app)
          .post("/api/gamification/add-points")
          .send({
            points: 50,
            source: "module_completion",
            description: "Completed Module 1",
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(mockResult);
        expect(gamificationServiceMocks.addPoints).toHaveBeenCalledWith(
          TEST_USER_ID,
          50,
          "module_completion",
          "Completed Module 1"
        );
      });

      it("returns level up notification", async () => {
        const app = await createApp();
        const mockResult = {
          newTotal: 1000,
          pointsAdded: 100,
          leveledUp: true,
          newLevel: 3,
        };

        gamificationServiceMocks.addPoints.mockResolvedValueOnce(mockResult);

        const res = await request(app)
          .post("/api/gamification/add-points")
          .send({
            points: 100,
            source: "simulation_complete",
          });

        expect(res.status).toBe(200);
        expect(res.body.data.leveledUp).toBe(true);
        expect(res.body.data.newLevel).toBe(3);
      });

      it("returns 400 for points less than 1", async () => {
        const app = await createApp();

        const res = await request(app)
          .post("/api/gamification/add-points")
          .send({
            points: 0,
            source: "test",
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it("returns 400 for missing source", async () => {
        const app = await createApp();

        const res = await request(app)
          .post("/api/gamification/add-points")
          .send({
            points: 50,
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe("GET /api/gamification/points", () => {
      it("returns user's current points and level", async () => {
        const app = await createApp();
        const mockPoints = {
          totalPoints: 250,
          currentLevel: 1,
          pointsToNextLevel: 150,
        };

        gamificationServiceMocks.getPoints.mockResolvedValueOnce(mockPoints);

        const res = await request(app)
          .get("/api/gamification/points");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(mockPoints);
        expect(gamificationServiceMocks.getPoints).toHaveBeenCalledWith(TEST_USER_ID);
      });

      it("requires authentication", async () => {
        const { default: gamificationRouter } = await import("../routes/gamification");
        const app = express();
        app.use(express.json());
        app.use("/api/gamification", gamificationRouter);

        const res = await request(app)
          .get("/api/gamification/points");

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });
    });
  });

  //
  // Streak Tests
  //

  describe("Streaks", () => {
    describe("POST /api/gamification/update-streak", () => {
      it("updates streak successfully", async () => {
        const app = await createApp();
        const mockResult = {
          currentStreak: 5,
          longestStreak: 7,
          streakContinued: true,
          streakBroken: false,
        };

        gamificationServiceMocks.updateStreak.mockResolvedValueOnce(mockResult);

        const res = await request(app)
          .post("/api/gamification/update-streak");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(mockResult);
        expect(gamificationServiceMocks.updateStreak).toHaveBeenCalledWith(TEST_USER_ID);
      });

      it("indicates when streak is broken", async () => {
        const app = await createApp();
        const mockResult = {
          currentStreak: 1,
          longestStreak: 10,
          streakContinued: false,
          streakBroken: true,
        };

        gamificationServiceMocks.updateStreak.mockResolvedValueOnce(mockResult);

        const res = await request(app)
          .post("/api/gamification/update-streak");

        expect(res.status).toBe(200);
        expect(res.body.data.streakBroken).toBe(true);
        expect(res.body.data.currentStreak).toBe(1);
      });
    });

    describe("GET /api/gamification/streak", () => {
      it("returns user's streak information", async () => {
        const app = await createApp();
        const mockStreak = {
          currentStreak: 3,
          longestStreak: 7,
          lastActivityDate: new Date(),
        };

        gamificationServiceMocks.getStreak.mockResolvedValueOnce(mockStreak);

        const res = await request(app)
          .get("/api/gamification/streak");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.currentStreak).toBe(3);
        expect(res.body.data.longestStreak).toBe(7);
        expect(res.body.data.lastActivityDate).toEqual(expect.any(String));
        expect(gamificationServiceMocks.getStreak).toHaveBeenCalledWith(TEST_USER_ID);
      });
    });
  });

  //
  // Leaderboard Tests
  //

  describe("Leaderboard", () => {
    describe("GET /api/gamification/leaderboard", () => {
      it("returns top users", async () => {
        const app = await createApp();
        const mockLeaderboard = [
          {
            userId: TEST_USER_ID,
            firstName: "John",
            lastName: "Doe",
            xpPoints: 1500,
            currentStreak: 7,
            badgeCount: 5,
            rank: 1,
          },
          {
            userId: "user-2",
            firstName: "Jane",
            lastName: "Smith",
            xpPoints: 1200,
            currentStreak: 5,
            badgeCount: 4,
            rank: 2,
          },
        ];

        gamificationServiceMocks.getLeaderboard.mockResolvedValueOnce(mockLeaderboard);

        const res = await request(app)
          .get("/api/gamification/leaderboard");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(mockLeaderboard);
        expect(gamificationServiceMocks.getLeaderboard).toHaveBeenCalledWith(10);
      });

      it("respects limit parameter", async () => {
        const app = await createApp();

        gamificationServiceMocks.getLeaderboard.mockResolvedValueOnce([]);

        const res = await request(app)
          .get("/api/gamification/leaderboard?limit=25");

        expect(res.status).toBe(200);
        expect(gamificationServiceMocks.getLeaderboard).toHaveBeenCalledWith(25);
      });

      it("caps limit at 100", async () => {
        const app = await createApp();

        gamificationServiceMocks.getLeaderboard.mockResolvedValueOnce([]);

        const res = await request(app)
          .get("/api/gamification/leaderboard?limit=500");

        expect(res.status).toBe(200);
        expect(gamificationServiceMocks.getLeaderboard).toHaveBeenCalledWith(100);
      });

      it("uses default limit of 10 when not specified", async () => {
        const app = await createApp();

        gamificationServiceMocks.getLeaderboard.mockResolvedValueOnce([]);

        const res = await request(app)
          .get("/api/gamification/leaderboard");

        expect(gamificationServiceMocks.getLeaderboard).toHaveBeenCalledWith(10);
      });
    });
  });
});
