import { db } from "../db";
import {
  supportTickets,
  feedback,
  type SupportTicket,
  type InsertSupportTicket,
  type Feedback,
  type InsertFeedback,
} from "@shared/schema";
import { eq, and, desc, or } from "drizzle-orm";
import crypto from "crypto";

/**
 * Support Service
 *
 * Handles support tickets and feedback including:
 * - Support ticket creation and management
 * - Ticket status tracking (open, in_progress, resolved, closed)
 * - Priority management (low, normal, high, urgent)
 * - User feedback submission and retrieval
 */
export class SupportService {
  /**
   * Create a new support ticket
   */
  static async createTicket(
    userId: string,
    data: {
      category: string;
      subject: string;
      message: string;
      priority?: "low" | "normal" | "high" | "urgent";
    }
  ): Promise<SupportTicket> {
    try {
      // Generate unique ticket number
      const ticketNumber = await this.generateTicketNumber();

      const ticketData: InsertSupportTicket = {
        userId,
        ticketNumber,
        category: data.category,
        subject: data.subject,
        message: data.message,
        status: "open",
        priority: data.priority || "normal",
        assignedTo: null,
        resolution: null,
      };

      const [ticket] = await db
        .insert(supportTickets)
        .values(ticketData)
        .returning();

      console.log(
        `✅ Created support ticket ${ticketNumber} for user ${userId}`
      );

      return ticket;
    } catch (error) {
      console.error("❌ Error creating support ticket:", error);
      throw new Error(`Failed to create support ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's support tickets
   */
  static async getUserTickets(
    userId: string,
    filters?: {
      status?: "open" | "in_progress" | "resolved" | "closed";
      priority?: "low" | "normal" | "high" | "urgent";
      limit?: number;
    }
  ): Promise<SupportTicket[]> {
    try {
      let query = db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.userId, userId));

      // Apply filters
      const conditions = [eq(supportTickets.userId, userId)];

      if (filters?.status) {
        conditions.push(eq(supportTickets.status, filters.status));
      }

      if (filters?.priority) {
        conditions.push(eq(supportTickets.priority, filters.priority));
      }

      const tickets = await db
        .select()
        .from(supportTickets)
        .where(and(...conditions))
        .orderBy(desc(supportTickets.createdAt))
        .limit(filters?.limit || 50);

      console.log(
        `✅ Retrieved ${tickets.length} support ticket(s) for user ${userId}`
      );
      return tickets;
    } catch (error) {
      console.error("❌ Error getting support tickets:", error);
      throw new Error(`Failed to get support tickets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get support ticket by ID
   */
  static async getTicketById(
    ticketId: string,
    userId: string
  ): Promise<SupportTicket | null> {
    try {
      const [ticket] = await db
        .select()
        .from(supportTickets)
        .where(
          and(
            eq(supportTickets.id, ticketId),
            eq(supportTickets.userId, userId)
          )
        )
        .limit(1);

      return ticket || null;
    } catch (error) {
      console.error("❌ Error getting support ticket by ID:", error);
      throw new Error(`Failed to get support ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update support ticket
   */
  static async updateTicket(
    ticketId: string,
    userId: string,
    data: {
      status?: "open" | "in_progress" | "resolved" | "closed";
      priority?: "low" | "normal" | "high" | "urgent";
      message?: string;
    }
  ): Promise<SupportTicket> {
    try {
      const updateData: Partial<InsertSupportTicket> = {
      };

      if (data.status !== undefined) {
        updateData.status = data.status;

        // Set resolved/closed timestamps
        if (data.status === "resolved" && !updateData.resolvedAt) {
          updateData.resolvedAt = new Date();
        }
        if (data.status === "closed" && !updateData.closedAt) {
          updateData.closedAt = new Date();
        }
      }

      if (data.priority !== undefined) {
        updateData.priority = data.priority;
      }

      if (data.message !== undefined) {
        updateData.message = data.message;
      }

      const [ticket] = await db
        .update(supportTickets)
        .set(updateData)
        .where(
          and(
            eq(supportTickets.id, ticketId),
            eq(supportTickets.userId, userId)
          )
        )
        .returning();

      if (!ticket) {
        throw new Error("Ticket not found or access denied");
      }

      console.log(
        `✅ Updated support ticket ${ticketId} for user ${userId}`
      );
      return ticket;
    } catch (error) {
      console.error("❌ Error updating support ticket:", error);
      throw new Error(`Failed to update support ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit user feedback
   */
  static async submitFeedback(
    userId: string,
    data: {
      feedbackType: "bug" | "feature" | "improvement" | "general";
      subject: string;
      message: string;
      pageUrl?: string;
      browserInfo?: any;
      screenshotUrl?: string;
    }
  ): Promise<Feedback> {
    try {
      const feedbackData: InsertFeedback = {
        userId,
        feedbackType: data.feedbackType,
        subject: data.subject,
        message: data.message,
        pageUrl: data.pageUrl || null,
        browserInfo: data.browserInfo || null,
        screenshotUrl: data.screenshotUrl || null,
        status: "open",
        priority: this.determineFeedbackPriority(data.feedbackType),
        adminNotes: null,
      };

      const [feedbackRecord] = await db
        .insert(feedback)
        .values(feedbackData)
        .returning();

      console.log(
        `✅ Created feedback (${data.feedbackType}) for user ${userId}`
      );

      return feedbackRecord;
    } catch (error) {
      console.error("❌ Error submitting feedback:", error);
      throw new Error(`Failed to submit feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's feedback submissions
   */
  static async getUserFeedback(
    userId: string,
    limit: number = 50
  ): Promise<Feedback[]> {
    try {
      const userFeedback = await db
        .select()
        .from(feedback)
        .where(eq(feedback.userId, userId))
        .orderBy(desc(feedback.createdAt))
        .limit(limit);

      console.log(
        `✅ Retrieved ${userFeedback.length} feedback submission(s) for user ${userId}`
      );
      return userFeedback;
    } catch (error) {
      console.error("❌ Error getting user feedback:", error);
      throw new Error(`Failed to get user feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get feedback by ID
   */
  static async getFeedbackById(
    feedbackId: string,
    userId: string
  ): Promise<Feedback | null> {
    try {
      const [feedbackRecord] = await db
        .select()
        .from(feedback)
        .where(
          and(eq(feedback.id, feedbackId), eq(feedback.userId, userId))
        )
        .limit(1);

      return feedbackRecord || null;
    } catch (error) {
      console.error("❌ Error getting feedback by ID:", error);
      throw new Error(`Failed to get feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get ticket statistics for a user
   */
  static async getUserTicketStats(userId: string): Promise<{
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    closedTickets: number;
    averageResolutionTime: number | null;
  }> {
    try {
      const tickets = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.userId, userId));

      const totalTickets = tickets.length;
      const openTickets = tickets.filter((t) => t.status === "open").length;
      const inProgressTickets = tickets.filter(
        (t) => t.status === "in_progress"
      ).length;
      const resolvedTickets = tickets.filter(
        (t) => t.status === "resolved"
      ).length;
      const closedTickets = tickets.filter((t) => t.status === "closed").length;

      // Calculate average resolution time (in hours)
      const resolvedWithTime = tickets.filter(
        (t) => t.resolvedAt && t.createdAt
      );

      let averageResolutionTime: number | null = null;
      if (resolvedWithTime.length > 0) {
        const totalResolutionTime = resolvedWithTime.reduce((sum, ticket) => {
          const created = new Date(ticket.createdAt).getTime();
          const resolved = new Date(ticket.resolvedAt!).getTime();
          return sum + (resolved - created);
        }, 0);

        averageResolutionTime = Math.round(
          totalResolutionTime / resolvedWithTime.length / (1000 * 60 * 60)
        ); // Convert to hours
      }

      return {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        averageResolutionTime,
      };
    } catch (error) {
      console.error("❌ Error getting ticket stats:", error);
      throw new Error(`Failed to get ticket stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate unique ticket number (format: TKT-YYYYMMDD-XXXXX)
   */
  private static async generateTicketNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");

    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      // Generate 5-digit random number
      const randomNum = Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, "0");
      const ticketNumber = `TKT-${dateStr}-${randomNum}`;

      // Check if exists
      const [existing] = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.ticketNumber, ticketNumber))
        .limit(1);

      if (!existing) {
        return ticketNumber;
      }

      attempts++;
    }

    // Fallback: use timestamp
    const timestamp = Date.now().toString().slice(-5);
    return `TKT-${dateStr}-${timestamp}`;
  }

  /**
   * Determine feedback priority based on type
   */
  private static determineFeedbackPriority(
    feedbackType: string
  ): "low" | "normal" | "high" | "urgent" {
    switch (feedbackType) {
      case "bug":
        return "high";
      case "feature":
        return "normal";
      case "improvement":
        return "normal";
      case "general":
        return "low";
      default:
        return "normal";
    }
  }
}
