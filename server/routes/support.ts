import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { SupportService } from "../services/support-service";

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const createTicketSchema = z.object({
  category: z.string().min(1, "Category is required").max(50),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(1, "Message is required"),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

const updateTicketSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  message: z.string().optional(),
});

const submitFeedbackSchema = z.object({
  feedbackType: z.enum(["bug", "feature", "improvement", "general"]),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(1, "Message is required"),
  pageUrl: z.string().url().optional(),
  browserInfo: z.any().optional(),
  screenshotUrl: z.string().url().optional(),
});

// ============================================================================
// Support Ticket Endpoints
// ============================================================================

/**
 * POST /api/support/tickets
 * Create a new support ticket
 */
router.post(
  "/tickets",
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

      const validation = createTicketSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: "Invalid request data",
          details: validation.error.errors,
        });
        return;
      }

      const ticket = await SupportService.createTicket(userId, validation.data);

      res.status(201).json({
        success: true,
        data: ticket,
        message: "Support ticket created successfully",
      });
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create support ticket",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/support/tickets
 * Get user's support tickets with optional filtering
 */
router.get(
  "/tickets",
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

      const { status, priority, limit } = req.query;

      // Validate status filter
      if (status && !["open", "in_progress", "resolved", "closed"].includes(status as string)) {
        res.status(400).json({
          success: false,
          error: "Invalid status filter",
          validStatuses: ["open", "in_progress", "resolved", "closed"],
        });
        return;
      }

      // Validate priority filter
      if (priority && !["low", "normal", "high", "urgent"].includes(priority as string)) {
        res.status(400).json({
          success: false,
          error: "Invalid priority filter",
          validPriorities: ["low", "normal", "high", "urgent"],
        });
        return;
      }

      const filters = {
        status: status as "open" | "in_progress" | "resolved" | "closed" | undefined,
        priority: priority as "low" | "normal" | "high" | "urgent" | undefined,
        limit: limit ? Math.min(parseInt(limit as string), 100) : 50,
      };

      const tickets = await SupportService.getUserTickets(userId, filters);

      res.status(200).json({
        success: true,
        data: {
          tickets,
          total: tickets.length,
          filters: {
            status: filters.status || "all",
            priority: filters.priority || "all",
            limit: filters.limit,
          },
        },
      });
    } catch (error) {
      console.error("Error getting support tickets:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get support tickets",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/support/tickets/:id
 * Get a specific support ticket by ID
 */
router.get(
  "/tickets/:id",
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

      const ticket = await SupportService.getTicketById(id, userId);

      if (!ticket) {
        res.status(404).json({
          success: false,
          error: "Support ticket not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      console.error("Error getting support ticket:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get support ticket",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * PUT /api/support/tickets/:id
 * Update a support ticket
 */
router.put(
  "/tickets/:id",
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

      const validation = updateTicketSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: "Invalid request data",
          details: validation.error.errors,
        });
        return;
      }

      const ticket = await SupportService.updateTicket(
        id,
        userId,
        validation.data
      );

      res.status(200).json({
        success: true,
        data: ticket,
        message: "Support ticket updated successfully",
      });
    } catch (error) {
      console.error("Error updating support ticket:", error);

      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).json({
          success: false,
          error: "Support ticket not found or access denied",
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to update support ticket",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/support/tickets/stats
 * Get user's ticket statistics
 */
router.get(
  "/tickets-stats",
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

      const stats = await SupportService.getUserTicketStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting ticket stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get ticket statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// ============================================================================
// Feedback Endpoints
// ============================================================================

/**
 * POST /api/support/feedback
 * Submit user feedback
 */
router.post(
  "/feedback",
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

      const validation = submitFeedbackSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: "Invalid request data",
          details: validation.error.errors,
        });
        return;
      }

      const feedback = await SupportService.submitFeedback(
        userId,
        validation.data
      );

      res.status(201).json({
        success: true,
        data: feedback,
        message: "Feedback submitted successfully. Thank you for helping us improve!",
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({
        success: false,
        error: "Failed to submit feedback",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/support/feedback
 * Get user's feedback submissions
 */
router.get(
  "/feedback",
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

      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

      const feedbackList = await SupportService.getUserFeedback(userId, limit);

      res.status(200).json({
        success: true,
        data: {
          feedback: feedbackList,
          total: feedbackList.length,
          limit,
        },
      });
    } catch (error) {
      console.error("Error getting feedback:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get feedback",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/support/feedback/:id
 * Get a specific feedback submission by ID
 */
router.get(
  "/feedback/:id",
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

      const feedback = await SupportService.getFeedbackById(id, userId);

      if (!feedback) {
        res.status(404).json({
          success: false,
          error: "Feedback not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: feedback,
      });
    } catch (error) {
      console.error("Error getting feedback:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get feedback",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
