import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express, { type Express } from "express";
import supportRouter from "../routes/support";

// Mock support service
const supportServiceMocks = vi.hoisted(() => ({
  createTicket: vi.fn(),
  getUserTickets: vi.fn(),
  getTicketById: vi.fn(),
  updateTicket: vi.fn(),
  submitFeedback: vi.fn(),
  getUserFeedback: vi.fn(),
  getFeedbackById: vi.fn(),
  getUserTicketStats: vi.fn(),
}));

vi.mock("../services/support-service", () => ({
  SupportService: supportServiceMocks,
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

  app.use("/api/support", supportRouter);
  return app;
}

describe("Support Module Routes", () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  // ============================================================================
  // Create Ticket Tests
  // ============================================================================

  describe("POST /api/support/tickets", () => {
    it("should create a support ticket", async () => {
      const mockTicket = {
        id: "ticket-1",
        userId: "test-user-123",
        ticketNumber: "TKT-20251029-12345",
        category: "technical",
        subject: "Login issue",
        message: "I cannot log in to my account",
        status: "open",
        priority: "high",
        createdAt: new Date().toISOString(),
      };

      supportServiceMocks.createTicket.mockResolvedValue(mockTicket);

      const response = await request(app)
        .post("/api/support/tickets")
        .send({
          category: "technical",
          subject: "Login issue",
          message: "I cannot log in to my account",
          priority: "high",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTicket);
      expect(response.body.message).toContain("successfully");
    });

    it("should create ticket with default priority", async () => {
      const mockTicket = {
        id: "ticket-2",
        priority: "normal",
      };

      supportServiceMocks.createTicket.mockResolvedValue(mockTicket);

      const response = await request(app)
        .post("/api/support/tickets")
        .send({
          category: "general",
          subject: "Question",
          message: "How do I...?",
        });

      expect(response.status).toBe(201);
      expect(supportServiceMocks.createTicket).toHaveBeenCalledWith(
        "test-user-123",
        expect.objectContaining({
          category: "general",
          subject: "Question",
          message: "How do I...?",
        })
      );
    });

    it("should return 400 for missing required fields", async () => {
      const response = await request(app)
        .post("/api/support/tickets")
        .send({
          category: "technical",
          // Missing subject and message
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid request data");
    });

    it("should return 400 for invalid priority", async () => {
      const response = await request(app)
        .post("/api/support/tickets")
        .send({
          category: "technical",
          subject: "Issue",
          message: "Problem description",
          priority: "invalid-priority",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should handle service errors", async () => {
      supportServiceMocks.createTicket.mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .post("/api/support/tickets")
        .send({
          category: "technical",
          subject: "Issue",
          message: "Problem",
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Get Tickets Tests
  // ============================================================================

  describe("GET /api/support/tickets", () => {
    it("should get user's tickets", async () => {
      const mockTickets = [
        {
          id: "ticket-1",
          ticketNumber: "TKT-001",
          status: "open",
          priority: "high",
        },
        {
          id: "ticket-2",
          ticketNumber: "TKT-002",
          status: "resolved",
          priority: "normal",
        },
      ];

      supportServiceMocks.getUserTickets.mockResolvedValue(mockTickets);

      const response = await request(app).get("/api/support/tickets");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tickets).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it("should filter by status", async () => {
      const openTickets = [
        { id: "ticket-1", status: "open" },
      ];

      supportServiceMocks.getUserTickets.mockResolvedValue(openTickets);

      const response = await request(app)
        .get("/api/support/tickets")
        .query({ status: "open" });

      expect(response.status).toBe(200);
      expect(supportServiceMocks.getUserTickets).toHaveBeenCalledWith(
        "test-user-123",
        expect.objectContaining({ status: "open" })
      );
    });

    it("should filter by priority", async () => {
      const urgentTickets = [
        { id: "ticket-1", priority: "urgent" },
      ];

      supportServiceMocks.getUserTickets.mockResolvedValue(urgentTickets);

      const response = await request(app)
        .get("/api/support/tickets")
        .query({ priority: "urgent" });

      expect(response.status).toBe(200);
      expect(supportServiceMocks.getUserTickets).toHaveBeenCalledWith(
        "test-user-123",
        expect.objectContaining({ priority: "urgent" })
      );
    });

    it("should return 400 for invalid status filter", async () => {
      const response = await request(app)
        .get("/api/support/tickets")
        .query({ status: "invalid-status" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid status filter");
    });

    it("should return 400 for invalid priority filter", async () => {
      const response = await request(app)
        .get("/api/support/tickets")
        .query({ priority: "invalid-priority" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid priority filter");
    });

    it("should respect custom limit", async () => {
      supportServiceMocks.getUserTickets.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/support/tickets")
        .query({ limit: 20 });

      expect(response.status).toBe(200);
      expect(supportServiceMocks.getUserTickets).toHaveBeenCalledWith(
        "test-user-123",
        expect.objectContaining({ limit: 20 })
      );
    });

    it("should cap limit at 100", async () => {
      supportServiceMocks.getUserTickets.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/support/tickets")
        .query({ limit: 200 });

      expect(response.status).toBe(200);
      expect(supportServiceMocks.getUserTickets).toHaveBeenCalledWith(
        "test-user-123",
        expect.objectContaining({ limit: 100 })
      );
    });
  });

  // ============================================================================
  // Get Ticket By ID Tests
  // ============================================================================

  describe("GET /api/support/tickets/:id", () => {
    it("should get specific ticket", async () => {
      const mockTicket = {
        id: "ticket-1",
        ticketNumber: "TKT-001",
        subject: "Login issue",
        status: "open",
      };

      supportServiceMocks.getTicketById.mockResolvedValue(mockTicket);

      const response = await request(app).get("/api/support/tickets/ticket-1");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTicket);
    });

    it("should return 404 if ticket not found", async () => {
      supportServiceMocks.getTicketById.mockResolvedValue(null);

      const response = await request(app).get(
        "/api/support/tickets/nonexistent"
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Update Ticket Tests
  // ============================================================================

  describe("PUT /api/support/tickets/:id", () => {
    it("should update ticket status", async () => {
      const updatedTicket = {
        id: "ticket-1",
        status: "resolved",
        resolvedAt: new Date().toISOString(),
      };

      supportServiceMocks.updateTicket.mockResolvedValue(updatedTicket);

      const response = await request(app)
        .put("/api/support/tickets/ticket-1")
        .send({
          status: "resolved",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("resolved");
      expect(response.body.message).toContain("successfully");
    });

    it("should update ticket priority", async () => {
      const updatedTicket = {
        id: "ticket-1",
        priority: "urgent",
      };

      supportServiceMocks.updateTicket.mockResolvedValue(updatedTicket);

      const response = await request(app)
        .put("/api/support/tickets/ticket-1")
        .send({
          priority: "urgent",
        });

      expect(response.status).toBe(200);
      expect(response.body.data.priority).toBe("urgent");
    });

    it("should return 400 for invalid status", async () => {
      const response = await request(app)
        .put("/api/support/tickets/ticket-1")
        .send({
          status: "invalid-status",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 if ticket not found", async () => {
      supportServiceMocks.updateTicket.mockRejectedValue(
        new Error("Ticket not found or access denied")
      );

      const response = await request(app)
        .put("/api/support/tickets/nonexistent")
        .send({
          status: "closed",
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Ticket Stats Tests
  // ============================================================================

  describe("GET /api/support/tickets-stats", () => {
    it("should get ticket statistics", async () => {
      const mockStats = {
        totalTickets: 10,
        openTickets: 3,
        inProgressTickets: 2,
        resolvedTickets: 4,
        closedTickets: 1,
        averageResolutionTime: 24,
      };

      supportServiceMocks.getUserTicketStats.mockResolvedValue(mockStats);

      const response = await request(app).get("/api/support/tickets-stats");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStats);
    });

    it("should handle user with no tickets", async () => {
      const mockStats = {
        totalTickets: 0,
        openTickets: 0,
        inProgressTickets: 0,
        resolvedTickets: 0,
        closedTickets: 0,
        averageResolutionTime: null,
      };

      supportServiceMocks.getUserTicketStats.mockResolvedValue(mockStats);

      const response = await request(app).get("/api/support/tickets-stats");

      expect(response.status).toBe(200);
      expect(response.body.data.totalTickets).toBe(0);
    });
  });

  // ============================================================================
  // Submit Feedback Tests
  // ============================================================================

  describe("POST /api/support/feedback", () => {
    it("should submit bug feedback", async () => {
      const mockFeedback = {
        id: "feedback-1",
        userId: "test-user-123",
        feedbackType: "bug",
        subject: "Button not working",
        message: "The submit button doesn't respond",
        status: "open",
        priority: "high",
        createdAt: new Date().toISOString(),
      };

      supportServiceMocks.submitFeedback.mockResolvedValue(mockFeedback);

      const response = await request(app)
        .post("/api/support/feedback")
        .send({
          feedbackType: "bug",
          subject: "Button not working",
          message: "The submit button doesn't respond",
          pageUrl: "http://localhost:5000/practice",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockFeedback);
      expect(response.body.message).toContain("Thank you");
    });

    it("should submit feature request", async () => {
      const mockFeedback = {
        id: "feedback-2",
        feedbackType: "feature",
        priority: "normal",
      };

      supportServiceMocks.submitFeedback.mockResolvedValue(mockFeedback);

      const response = await request(app)
        .post("/api/support/feedback")
        .send({
          feedbackType: "feature",
          subject: "Dark mode",
          message: "Please add dark mode support",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it("should return 400 for missing required fields", async () => {
      const response = await request(app)
        .post("/api/support/feedback")
        .send({
          feedbackType: "bug",
          // Missing subject and message
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid feedback type", async () => {
      const response = await request(app)
        .post("/api/support/feedback")
        .send({
          feedbackType: "invalid-type",
          subject: "Test",
          message: "Test message",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should accept optional fields", async () => {
      const mockFeedback = {
        id: "feedback-3",
        pageUrl: "http://localhost:5000/dashboard",
        screenshotUrl: "http://example.com/screenshot.png",
      };

      supportServiceMocks.submitFeedback.mockResolvedValue(mockFeedback);

      const response = await request(app)
        .post("/api/support/feedback")
        .send({
          feedbackType: "improvement",
          subject: "UI Enhancement",
          message: "The dashboard could be improved",
          pageUrl: "http://localhost:5000/dashboard",
          screenshotUrl: "http://example.com/screenshot.png",
          browserInfo: { browser: "Chrome", version: "120.0" },
        });

      expect(response.status).toBe(201);
      expect(supportServiceMocks.submitFeedback).toHaveBeenCalledWith(
        "test-user-123",
        expect.objectContaining({
          pageUrl: "http://localhost:5000/dashboard",
          screenshotUrl: "http://example.com/screenshot.png",
        })
      );
    });
  });

  // ============================================================================
  // Get Feedback Tests
  // ============================================================================

  describe("GET /api/support/feedback", () => {
    it("should get user's feedback submissions", async () => {
      const mockFeedback = [
        {
          id: "feedback-1",
          feedbackType: "bug",
          subject: "Issue 1",
          status: "open",
        },
        {
          id: "feedback-2",
          feedbackType: "feature",
          subject: "Request 1",
          status: "open",
        },
      ];

      supportServiceMocks.getUserFeedback.mockResolvedValue(mockFeedback);

      const response = await request(app).get("/api/support/feedback");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.feedback).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it("should respect custom limit", async () => {
      supportServiceMocks.getUserFeedback.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/support/feedback")
        .query({ limit: 20 });

      expect(response.status).toBe(200);
      expect(supportServiceMocks.getUserFeedback).toHaveBeenCalledWith(
        "test-user-123",
        20
      );
    });

    it("should cap limit at 100", async () => {
      supportServiceMocks.getUserFeedback.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/support/feedback")
        .query({ limit: 200 });

      expect(response.status).toBe(200);
      expect(supportServiceMocks.getUserFeedback).toHaveBeenCalledWith(
        "test-user-123",
        100
      );
    });
  });

  // ============================================================================
  // Get Feedback By ID Tests
  // ============================================================================

  describe("GET /api/support/feedback/:id", () => {
    it("should get specific feedback", async () => {
      const mockFeedback = {
        id: "feedback-1",
        subject: "Bug report",
        status: "open",
      };

      supportServiceMocks.getFeedbackById.mockResolvedValue(mockFeedback);

      const response = await request(app).get("/api/support/feedback/feedback-1");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockFeedback);
    });

    it("should return 404 if feedback not found", async () => {
      supportServiceMocks.getFeedbackById.mockResolvedValue(null);

      const response = await request(app).get(
        "/api/support/feedback/nonexistent"
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Authentication Tests
  // ============================================================================

  describe("Authentication", () => {
    it("should return 401 for unauthenticated ticket creation", async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use((req, _res, next) => {
        req.user = undefined;
        next();
      });
      unauthApp.use("/api/support", supportRouter);

      const response = await request(unauthApp)
        .post("/api/support/tickets")
        .send({
          category: "technical",
          subject: "Issue",
          message: "Problem",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 401 for unauthenticated feedback submission", async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use((req, _res, next) => {
        req.user = undefined;
        next();
      });
      unauthApp.use("/api/support", supportRouter);

      const response = await request(unauthApp)
        .post("/api/support/feedback")
        .send({
          feedbackType: "bug",
          subject: "Issue",
          message: "Problem",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
