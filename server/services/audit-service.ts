import { db } from "../db";
import { adminAuditLogs, users } from "@shared/schema";
import type { Request } from "express";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

/**
 * Audit Log Entry Interface
 */
export interface AuditLogEntry {
  adminId: string;
  action: string;
  targetUserId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit Log Filters Interface
 */
export interface AuditLogFilters {
  adminId?: string;
  action?: string;
  targetUserId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

/**
 * Admin Audit Logging Service
 *
 * Tracks all admin actions for security, compliance, and accountability.
 * All logging operations are non-blocking and fail gracefully.
 */
export class AuditService {
  /**
   * Log an admin action
   * Non-blocking: errors are logged but not thrown
   */
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      await db.insert(adminAuditLogs).values({
        adminId: entry.adminId,
        action: entry.action,
        targetUserId: entry.targetUserId,
        details: entry.details || null,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        createdAt: new Date(),
      });
    } catch (error) {
      // Don't throw - audit logging failure shouldn't break the main operation
      console.error('[AUDIT] Failed to log admin action:', error);
    }
  }

  /**
   * Extract request metadata (IP address and user agent)
   */
  static extractRequestMetadata(req: Request): { ipAddress?: string; userAgent?: string } {
    return {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    };
  }

  /**
   * Get audit logs with pagination and filters
   */
  static async getLogs(filters: AuditLogFilters = {}) {
    try {
      const {
        adminId,
        action,
        targetUserId,
        dateFrom,
        dateTo,
        page = 1,
        limit = 50,
      } = filters;

      const offset = (page - 1) * limit;

      // Build filter conditions
      const conditions = [];
      if (adminId) {
        conditions.push(eq(adminAuditLogs.adminId, adminId));
      }
      if (action) {
        conditions.push(eq(adminAuditLogs.action, action));
      }
      if (targetUserId) {
        conditions.push(eq(adminAuditLogs.targetUserId, targetUserId));
      }
      if (dateFrom) {
        conditions.push(gte(adminAuditLogs.createdAt, dateFrom));
      }
      if (dateTo) {
        conditions.push(lte(adminAuditLogs.createdAt, dateTo));
      }

      // Fetch logs with admin and target user details
      // Create alias for target user to avoid table name conflict
      const targetUser = alias(users, 'target_user');

      const logs = await db
        .select({
          id: adminAuditLogs.id,
          adminId: adminAuditLogs.adminId,
          adminEmail: users.email,
          adminName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
          action: adminAuditLogs.action,
          targetUserId: adminAuditLogs.targetUserId,
          targetUserEmail: targetUser.email,
          details: adminAuditLogs.details,
          ipAddress: adminAuditLogs.ipAddress,
          userAgent: adminAuditLogs.userAgent,
          createdAt: adminAuditLogs.createdAt,
        })
        .from(adminAuditLogs)
        .leftJoin(users, eq(adminAuditLogs.adminId, users.id))
        .leftJoin(targetUser, eq(adminAuditLogs.targetUserId, targetUser.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(adminAuditLogs.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(adminAuditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const total = Number(countResult[0]?.count || 0);

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('[AUDIT] Error fetching audit logs:', error);
      throw error;
    }
  }

  /**
   * Get unique list of actions for filtering
   */
  static async getActions(): Promise<string[]> {
    try {
      const result = await db
        .selectDistinct({ action: adminAuditLogs.action })
        .from(adminAuditLogs)
        .orderBy(adminAuditLogs.action);

      return result.map((r) => r.action).filter(Boolean) as string[];
    } catch (error) {
      console.error('[AUDIT] Error fetching actions:', error);
      return [];
    }
  }

  /**
   * Get unique list of admin users who have performed actions
   */
  static async getAdmins(): Promise<Array<{ id: string; email: string; name: string }>> {
    try {
      const result = await db
        .selectDistinct({
          id: users.id,
          email: users.email,
          name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        })
        .from(adminAuditLogs)
        .innerJoin(users, eq(adminAuditLogs.adminId, users.id))
        .orderBy(users.email);

      return result;
    } catch (error) {
      console.error('[AUDIT] Error fetching admins:', error);
      return [];
    }
  }
}
