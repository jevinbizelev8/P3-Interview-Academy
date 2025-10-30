import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { PerformanceService } from "../services/performance-service";
import { ReflectionService } from "../services/reflection-service";
import { AnalyticsService } from "../services/analytics-service";

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const createActualInterviewSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position is required"),
  interviewDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid interview date",
  }),
  interviewType: z.string().optional(),
  outcome: z.enum(["offer", "next_round", "rejected", "pending"]).optional(),
  confidenceLevel: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
  followUpDate: z.string().optional().refine(
    (date) => !date || !isNaN(Date.parse(date)),
    { message: "Invalid follow-up date" }
  ),
});

const updateActualInterviewSchema = z.object({
  companyName: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  interviewDate: z.string().optional().refine(
    (date) => !date || !isNaN(Date.parse(date)),
    { message: "Invalid interview date" }
  ),
  interviewType: z.string().optional(),
  outcome: z.enum(["offer", "next_round", "rejected", "pending"]).optional(),
  confidenceLevel: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
  followUpDate: z.string().optional().refine(
    (date) => !date || !isNaN(Date.parse(date)),
    { message: "Invalid follow-up date" }
  ),
});

const createReflectionSchema = z.object({
  practiceSessionId: z.string().uuid().optional(),
  strengths: z.string().min(1, "Strengths are required"),
  improvements: z.string().min(1, "Improvements are required"),
  actionItems: z.string().optional(),
  overallFeeling: z.string().optional(),
  moodScore: z.number().min(1).max(10).optional(),
});

// ============================================================================
// Actual Interview Endpoints
// ============================================================================

/**
 * POST /api/perform/actual-interviews
 * Create a new actual interview record
 */
router.post(
  "/actual-interviews",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const validation = createActualInterviewSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: "Invalid request data",
          details: validation.error.errors,
        });
        return;
      }

      const { interviewDate, followUpDate, ...otherData } = validation.data;
      const interview = await PerformanceService.createActualInterview(userId, {
        ...otherData,
        interviewDate: new Date(interviewDate),
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      });

      res.status(201).json({
        success: true,
        data: interview,
      });
    } catch (error) {
      console.error("Error creating actual interview:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create actual interview",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/perform/actual-interviews
 * Get user's actual interview history
 */
router.get(
  "/actual-interviews",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { outcome } = req.query;

      let interviews;
      if (outcome && typeof outcome === "string") {
        const validOutcomes = ["offer", "next_round", "rejected", "pending"];
        if (!validOutcomes.includes(outcome)) {
          res.status(400).json({
            success: false,
            error: "Invalid outcome filter",
          });
          return;
        }
        interviews = await PerformanceService.getInterviewsByOutcome(
          userId,
          outcome as "offer" | "next_round" | "rejected" | "pending"
        );
      } else {
        interviews = await PerformanceService.getUserInterviews(userId);
      }

      res.status(200).json({
        success: true,
        data: interviews,
      });
    } catch (error) {
      console.error("Error getting actual interviews:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get actual interviews",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/perform/actual-interviews/:id
 * Get a specific actual interview by ID
 */
router.get(
  "/actual-interviews/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { id } = req.params;
      const interview = await PerformanceService.getInterviewById(id, userId);

      if (!interview) {
        res.status(404).json({
          success: false,
          error: "Interview not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: interview,
      });
    } catch (error) {
      console.error("Error getting actual interview:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get actual interview",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * PUT /api/perform/actual-interviews/:id
 * Update an actual interview record
 */
router.put(
  "/actual-interviews/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { id } = req.params;
      const validation = updateActualInterviewSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: "Invalid request data",
          details: validation.error.errors,
        });
        return;
      }

      const { interviewDate, followUpDate, ...otherData } = validation.data;
      const updateData: any = { ...otherData };

      if (interviewDate) {
        updateData.interviewDate = new Date(interviewDate);
      }
      if (followUpDate) {
        updateData.followUpDate = new Date(followUpDate);
      }

      const interview = await PerformanceService.updateActualInterview(
        id,
        userId,
        updateData
      );

      res.status(200).json({
        success: true,
        data: interview,
      });
    } catch (error) {
      console.error("Error updating actual interview:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update actual interview",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * DELETE /api/perform/actual-interviews/:id
 * Delete an actual interview record
 */
router.delete(
  "/actual-interviews/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { id } = req.params;
      await PerformanceService.deleteActualInterview(id, userId);

      res.status(200).json({
        success: true,
        data: { message: "Interview deleted successfully" },
      });
    } catch (error) {
      console.error("Error deleting actual interview:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete actual interview",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// ============================================================================
// Reflection Journal Endpoints
// ============================================================================

/**
 * POST /api/perform/reflections
 * Create a reflection journal entry
 */
router.post(
  "/reflections",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const validation = createReflectionSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: "Invalid request data",
          details: validation.error.errors,
        });
        return;
      }

      const reflection = await ReflectionService.createReflection(
        userId,
        validation.data
      );

      res.status(201).json({
        success: true,
        data: reflection,
      });
    } catch (error) {
      console.error("Error creating reflection:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create reflection",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/perform/reflections
 * Get user's reflection journals
 */
router.get(
  "/reflections",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { practiceSessionId } = req.query;

      const reflections = await ReflectionService.getUserReflections(
        userId,
        practiceSessionId as string | undefined
      );

      res.status(200).json({
        success: true,
        data: reflections,
      });
    } catch (error) {
      console.error("Error getting reflections:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get reflections",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// ============================================================================
// Analytics & Performance Endpoints
// ============================================================================

/**
 * GET /api/perform/insights
 * Get comprehensive performance insights
 */
router.get(
  "/insights",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const insights = await AnalyticsService.getPerformanceInsights(userId);

      res.status(200).json({
        success: true,
        data: insights,
      });
    } catch (error) {
      console.error("Error getting performance insights:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get performance insights",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/perform/performance-chart
 * Get performance chart data over time
 */
router.get(
  "/performance-chart",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const days = req.query.days
        ? parseInt(req.query.days as string, 10)
        : 30;

      if (isNaN(days) || days < 1 || days > 365) {
        res.status(400).json({
          success: false,
          error: "Invalid days parameter (must be 1-365)",
        });
        return;
      }

      const chartData = await AnalyticsService.getPerformanceChart(
        userId,
        days
      );

      res.status(200).json({
        success: true,
        data: chartData,
      });
    } catch (error) {
      console.error("Error getting performance chart:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get performance chart",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/perform/stats
 * Get performance statistics summary
 */
router.get(
  "/stats",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const stats = await AnalyticsService.getPerformanceStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting performance stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get performance stats",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/perform/interview-stats
 * Get detailed interview statistics
 */
router.get(
  "/interview-stats",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const stats = await PerformanceService.getInterviewStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting interview stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get interview stats",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/perform/interview-timeline
 * Get interview timeline grouped by month
 */
router.get(
  "/interview-timeline",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const timeline = await PerformanceService.getInterviewTimeline(userId);

      res.status(200).json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      console.error("Error getting interview timeline:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get interview timeline",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
