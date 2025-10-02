import { db } from "../db";
import { eq, and, sql } from "drizzle-orm";
import {
  organizations,
  organizationMemberships,
  users,
  practiceSessions,
  preparationSessions,
  creditLedger,
} from "@shared/schema";
import type {
  OrganizationSummary,
  OrganizationAnalytics,
  MemberAnalytics,
  ModuleTimeBreakdown,
} from "@shared/types";

class OrganizationAnalyticsService {
  /**
   * Get summary statistics for all organizations
   */
  async getAllOrganizationSummaries(): Promise<OrganizationSummary[]> {
    const orgs = await db.select().from(organizations);

    const summaries = await Promise.all(
      orgs.map(async (org) => {
        const members = await db
          .select({ userId: organizationMemberships.userId })
          .from(organizationMemberships)
          .where(eq(organizationMemberships.organizationId, org.id));

        const userIds = members.map((m) => m.userId);

        // Get total credits consumed by all members
        const creditResult = userIds.length > 0
          ? await db
              .select({
                total: sql<number>`COALESCE(SUM(ABS(${creditLedger.amount})), 0)`,
              })
              .from(creditLedger)
              .where(
                and(
                  sql`${creditLedger.userId} = ANY(${userIds})`,
                  sql`${creditLedger.amount} < 0`
                )
              )
          : [{ total: 0 }];

        // Get total time from practice sessions
        const practiceTimeResult = userIds.length > 0
          ? await db
              .select({
                total: sql<number>`COALESCE(SUM(${practiceSessions.totalDuration}), 0)`,
              })
              .from(practiceSessions)
              .where(sql`${practiceSessions.userId} = ANY(${userIds})`)
          : [{ total: 0 }];

        // Get total time from preparation sessions
        const prepTimeResult = userIds.length > 0
          ? await db
              .select({
                total: sql<number>`COALESCE(SUM(${preparationSessions.totalDuration}), 0)`,
              })
              .from(preparationSessions)
              .where(sql`${preparationSessions.userId} = ANY(${userIds})`)
          : [{ total: 0 }];

        const practiceTime = Number(practiceTimeResult[0]?.total || 0);
        const prepareTime = Number(prepTimeResult[0]?.total || 0);
        const totalTime = practiceTime + prepareTime;

        const summary: OrganizationSummary = {
          id: org.id,
          name: org.name,
          type: org.type || "customer",
          memberCount: members.length,
          totalCreditsConsumed: Number(creditResult[0]?.total || 0),
          totalTimeSpent: totalTime,
          timeByModule: {
            prepare: prepareTime,
            practice: practiceTime,
            perform: 0, // Perform module doesn't track session time
          },
          createdAt: org.createdAt || new Date(),
        };

        return summary;
      })
    );

    return summaries;
  }

  /**
   * Get detailed analytics for a specific organization
   */
  async getOrganizationAnalytics(
    organizationId: string
  ): Promise<OrganizationAnalytics | null> {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });

    if (!org) {
      return null;
    }

    const memberships = await db.query.organizationMemberships.findMany({
      where: eq(organizationMemberships.organizationId, organizationId),
      with: {
        user: true,
      },
    });

    const memberAnalytics: MemberAnalytics[] = await Promise.all(
      memberships.map(async (membership) => {
        const user = membership.user!;

        // Get practice session time for this user
        const practiceTimeResult = await db
          .select({
            total: sql<number>`COALESCE(SUM(${practiceSessions.totalDuration}), 0)`,
            count: sql<number>`COUNT(${practiceSessions.id})`,
          })
          .from(practiceSessions)
          .where(eq(practiceSessions.userId, user.id));

        // Get preparation session time for this user
        const prepTimeResult = await db
          .select({
            total: sql<number>`COALESCE(SUM(${preparationSessions.totalDuration}), 0)`,
            count: sql<number>`COUNT(${preparationSessions.id})`,
          })
          .from(preparationSessions)
          .where(eq(preparationSessions.userId, user.id));

        // Get credits consumed by this user
        const creditsResult = await db
          .select({
            total: sql<number>`COALESCE(SUM(ABS(${creditLedger.amount})), 0)`,
          })
          .from(creditLedger)
          .where(
            and(
              eq(creditLedger.userId, user.id),
              sql`${creditLedger.amount} < 0`
            )
          );

        // Get last activity timestamp
        const lastPracticeActivity = await db
          .select({ lastActivity: practiceSessions.lastActivityAt })
          .from(practiceSessions)
          .where(eq(practiceSessions.userId, user.id))
          .orderBy(sql`${practiceSessions.lastActivityAt} DESC NULLS LAST`)
          .limit(1);

        const lastPrepActivity = await db
          .select({ lastActivity: preparationSessions.lastActivityAt })
          .from(preparationSessions)
          .where(eq(preparationSessions.userId, user.id))
          .orderBy(sql`${preparationSessions.lastActivityAt} DESC NULLS LAST`)
          .limit(1);

        const practiceLastActivity = lastPracticeActivity[0]?.lastActivity;
        const prepLastActivity = lastPrepActivity[0]?.lastActivity;

        let lastActivity: Date | null = null;
        if (practiceLastActivity && prepLastActivity) {
          lastActivity = new Date(
            Math.max(
              new Date(practiceLastActivity).getTime(),
              new Date(prepLastActivity).getTime()
            )
          );
        } else if (practiceLastActivity) {
          lastActivity = new Date(practiceLastActivity);
        } else if (prepLastActivity) {
          lastActivity = new Date(prepLastActivity);
        }

        const practiceTime = Number(practiceTimeResult[0]?.total || 0);
        const prepareTime = Number(prepTimeResult[0]?.total || 0);
        const practiceCount = Number(practiceTimeResult[0]?.count || 0);
        const prepareCount = Number(prepTimeResult[0]?.count || 0);

        const memberAnalytic: MemberAnalytics = {
          userId: user.id,
          email: user.email || "",
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          role: membership.role || "member",
          totalTimeSpent: practiceTime + prepareTime,
          timeByModule: {
            prepare: prepareTime,
            practice: practiceTime,
            perform: 0,
          },
          creditsConsumed: Number(creditsResult[0]?.total || 0),
          sessionCount: practiceCount + prepareCount,
          lastActivity,
        };

        return memberAnalytic;
      })
    );

    // Calculate organization totals
    const totalTimeSpent = memberAnalytics.reduce(
      (sum, m) => sum + m.totalTimeSpent,
      0
    );
    const totalCreditsConsumed = memberAnalytics.reduce(
      (sum, m) => sum + m.creditsConsumed,
      0
    );
    const timeByModule: ModuleTimeBreakdown = memberAnalytics.reduce(
      (acc, m) => ({
        prepare: acc.prepare + m.timeByModule.prepare,
        practice: acc.practice + m.timeByModule.practice,
        perform: acc.perform + m.timeByModule.perform,
      }),
      { prepare: 0, practice: 0, perform: 0 }
    );

    const analytics: OrganizationAnalytics = {
      id: org.id,
      name: org.name,
      type: org.type || "customer",
      memberCount: memberships.length,
      totalCreditsConsumed,
      totalTimeSpent,
      timeByModule,
      createdAt: org.createdAt || new Date(),
      members: memberAnalytics,
    };

    return analytics;
  }
}

export const organizationAnalyticsService = new OrganizationAnalyticsService();
