import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { db } from "../db";
import {
  users,
  organizations,
  organizationMemberships,
  practiceSessions,
  preparationSessions,
  creditLedger,
} from "@shared/schema";
import { organizationAnalyticsService } from "../services/organization-analytics-service";
import { sql } from "drizzle-orm";

describe("Organization Analytics Service", () => {
  let testOrg1: any;
  let testOrg2: any;
  let testUser1: any;
  let testUser2: any;
  let testUser3: any;

  beforeAll(async () => {
    // Clean up any existing test data
    await db.execute(sql`DELETE FROM ${creditLedger} WHERE user_id LIKE 'test-org-analytics-%'`);
    await db.execute(sql`DELETE FROM ${practiceSessions} WHERE user_id LIKE 'test-org-analytics-%'`);
    await db.execute(sql`DELETE FROM ${preparationSessions} WHERE user_id LIKE 'test-org-analytics-%'`);
    await db.execute(sql`DELETE FROM ${organizationMemberships} WHERE user_id LIKE 'test-org-analytics-%'`);
    await db.execute(sql`DELETE FROM ${users} WHERE id LIKE 'test-org-analytics-%'`);
    await db.execute(sql`DELETE FROM ${organizations} WHERE name LIKE 'Test Analytics Org%'`);
  });

  afterAll(async () => {
    // Clean up test data
    await db.execute(sql`DELETE FROM ${creditLedger} WHERE user_id LIKE 'test-org-analytics-%'`);
    await db.execute(sql`DELETE FROM ${practiceSessions} WHERE user_id LIKE 'test-org-analytics-%'`);
    await db.execute(sql`DELETE FROM ${preparationSessions} WHERE user_id LIKE 'test-org-analytics-%'`);
    await db.execute(sql`DELETE FROM ${organizationMemberships} WHERE user_id LIKE 'test-org-analytics-%'`);
    await db.execute(sql`DELETE FROM ${users} WHERE id LIKE 'test-org-analytics-%'`);
    await db.execute(sql`DELETE FROM ${organizations} WHERE name LIKE 'Test Analytics Org%'`);
  });

  beforeEach(async () => {
    // Create test organizations
    [testOrg1] = await db
      .insert(organizations)
      .values({
        name: "Test Analytics Org 1",
        type: "customer",
        createdBy: "test-admin",
      })
      .returning();

    [testOrg2] = await db
      .insert(organizations)
      .values({
        name: "Test Analytics Org 2",
        type: "reseller",
        createdBy: "test-admin",
      })
      .returning();

    // Create test users
    [testUser1] = await db
      .insert(users)
      .values({
        id: "test-org-analytics-user-1",
        email: "analytics1@test.com",
        firstName: "Analytics",
        lastName: "User One",
        role: "user",
        passwordHash: "test",
      })
      .returning();

    [testUser2] = await db
      .insert(users)
      .values({
        id: "test-org-analytics-user-2",
        email: "analytics2@test.com",
        firstName: "Analytics",
        lastName: "User Two",
        role: "user",
        passwordHash: "test",
      })
      .returning();

    [testUser3] = await db
      .insert(users)
      .values({
        id: "test-org-analytics-user-3",
        email: "analytics3@test.com",
        firstName: "Analytics",
        lastName: "User Three",
        role: "user",
        passwordHash: "test",
      })
      .returning();

    // Add users to organizations
    await db.insert(organizationMemberships).values([
      {
        organizationId: testOrg1.id,
        userId: testUser1.id,
        role: "member",
      },
      {
        organizationId: testOrg1.id,
        userId: testUser2.id,
        role: "manager",
      },
      {
        organizationId: testOrg2.id,
        userId: testUser3.id,
        role: "member",
      },
    ]);

    // Create practice sessions with time tracking
    await db.insert(practiceSessions).values([
      {
        userId: testUser1.id,
        jobPosition: "Software Engineer",
        totalDuration: 3600, // 1 hour
        lastActivityAt: new Date(),
      },
      {
        userId: testUser2.id,
        jobPosition: "Product Manager",
        totalDuration: 7200, // 2 hours
        lastActivityAt: new Date(),
      },
    ]);

    // Create preparation sessions with time tracking
    await db.insert(preparationSessions).values([
      {
        userId: testUser1.id,
        jobPosition: "Software Engineer",
        totalDuration: 1800, // 30 minutes
        lastActivityAt: new Date(),
      },
      {
        userId: testUser3.id,
        jobPosition: "Designer",
        totalDuration: 5400, // 1.5 hours
        lastActivityAt: new Date(),
      },
    ]);

    // Create credit consumption records
    await db.insert(creditLedger).values([
      {
        userId: testUser1.id,
        amount: -100,
        reason: "Practice session",
        module: "practice",
      },
      {
        userId: testUser2.id,
        amount: -200,
        reason: "Practice session",
        module: "practice",
      },
      {
        userId: testUser1.id,
        amount: -50,
        reason: "Preparation session",
        module: "prepare",
      },
      {
        userId: testUser3.id,
        amount: -150,
        reason: "Preparation session",
        module: "prepare",
      },
    ]);
  });

  describe("getAllOrganizationSummaries", () => {
    it("should return summaries for all organizations", async () => {
      const summaries = await organizationAnalyticsService.getAllOrganizationSummaries();

      expect(summaries).toBeDefined();
      expect(summaries.length).toBeGreaterThanOrEqual(2);

      const org1Summary = summaries.find((s) => s.id === testOrg1.id);
      const org2Summary = summaries.find((s) => s.id === testOrg2.id);

      expect(org1Summary).toBeDefined();
      expect(org2Summary).toBeDefined();
    });

    it("should calculate correct member count", async () => {
      const summaries = await organizationAnalyticsService.getAllOrganizationSummaries();

      const org1Summary = summaries.find((s) => s.id === testOrg1.id);
      const org2Summary = summaries.find((s) => s.id === testOrg2.id);

      expect(org1Summary?.memberCount).toBe(2);
      expect(org2Summary?.memberCount).toBe(1);
    });

    it("should calculate total credits consumed", async () => {
      const summaries = await organizationAnalyticsService.getAllOrganizationSummaries();

      const org1Summary = summaries.find((s) => s.id === testOrg1.id);
      const org2Summary = summaries.find((s) => s.id === testOrg2.id);

      // Org 1: User1 (-100, -50) + User2 (-200) = 350
      expect(org1Summary?.totalCreditsConsumed).toBe(350);
      // Org 2: User3 (-150) = 150
      expect(org2Summary?.totalCreditsConsumed).toBe(150);
    });

    it("should calculate total time spent", async () => {
      const summaries = await organizationAnalyticsService.getAllOrganizationSummaries();

      const org1Summary = summaries.find((s) => s.id === testOrg1.id);
      const org2Summary = summaries.find((s) => s.id === testOrg2.id);

      // Org 1: User1 (3600 practice + 1800 prep) + User2 (7200 practice) = 12600 seconds
      expect(org1Summary?.totalTimeSpent).toBe(12600);
      // Org 2: User3 (5400 prep) = 5400 seconds
      expect(org2Summary?.totalTimeSpent).toBe(5400);
    });

    it("should calculate time breakdown by module", async () => {
      const summaries = await organizationAnalyticsService.getAllOrganizationSummaries();

      const org1Summary = summaries.find((s) => s.id === testOrg1.id);

      expect(org1Summary?.timeByModule).toBeDefined();
      expect(org1Summary?.timeByModule.prepare).toBe(1800);
      expect(org1Summary?.timeByModule.practice).toBe(10800); // 3600 + 7200
      expect(org1Summary?.timeByModule.perform).toBe(0);
    });
  });

  describe("getOrganizationAnalytics", () => {
    it("should return detailed analytics for a specific organization", async () => {
      const analytics = await organizationAnalyticsService.getOrganizationAnalytics(
        testOrg1.id
      );

      expect(analytics).toBeDefined();
      expect(analytics?.id).toBe(testOrg1.id);
      expect(analytics?.name).toBe("Test Analytics Org 1");
      expect(analytics?.type).toBe("customer");
    });

    it("should return null for non-existent organization", async () => {
      const analytics = await organizationAnalyticsService.getOrganizationAnalytics(
        "non-existent-org-id"
      );

      expect(analytics).toBeNull();
    });

    it("should include member analytics with correct data", async () => {
      const analytics = await organizationAnalyticsService.getOrganizationAnalytics(
        testOrg1.id
      );

      expect(analytics?.members).toBeDefined();
      expect(analytics?.members.length).toBe(2);

      const user1Analytics = analytics?.members.find(
        (m) => m.userId === testUser1.id
      );
      const user2Analytics = analytics?.members.find(
        (m) => m.userId === testUser2.id
      );

      expect(user1Analytics).toBeDefined();
      expect(user2Analytics).toBeDefined();

      // User 1: 3600 practice + 1800 prep = 5400 seconds
      expect(user1Analytics?.totalTimeSpent).toBe(5400);
      // User 2: 7200 practice = 7200 seconds
      expect(user2Analytics?.totalTimeSpent).toBe(7200);
    });

    it("should calculate member credits consumed correctly", async () => {
      const analytics = await organizationAnalyticsService.getOrganizationAnalytics(
        testOrg1.id
      );

      const user1Analytics = analytics?.members.find(
        (m) => m.userId === testUser1.id
      );
      const user2Analytics = analytics?.members.find(
        (m) => m.userId === testUser2.id
      );

      // User 1: -100 + -50 = 150
      expect(user1Analytics?.creditsConsumed).toBe(150);
      // User 2: -200 = 200
      expect(user2Analytics?.creditsConsumed).toBe(200);
    });

    it("should track member session counts", async () => {
      const analytics = await organizationAnalyticsService.getOrganizationAnalytics(
        testOrg1.id
      );

      const user1Analytics = analytics?.members.find(
        (m) => m.userId === testUser1.id
      );
      const user2Analytics = analytics?.members.find(
        (m) => m.userId === testUser2.id
      );

      // User 1: 1 practice + 1 prep = 2 sessions
      expect(user1Analytics?.sessionCount).toBe(2);
      // User 2: 1 practice = 1 session
      expect(user2Analytics?.sessionCount).toBe(1);
    });

    it("should include member time breakdown by module", async () => {
      const analytics = await organizationAnalyticsService.getOrganizationAnalytics(
        testOrg1.id
      );

      const user1Analytics = analytics?.members.find(
        (m) => m.userId === testUser1.id
      );

      expect(user1Analytics?.timeByModule).toBeDefined();
      expect(user1Analytics?.timeByModule.prepare).toBe(1800);
      expect(user1Analytics?.timeByModule.practice).toBe(3600);
      expect(user1Analytics?.timeByModule.perform).toBe(0);
    });

    it("should track last activity timestamp", async () => {
      const analytics = await organizationAnalyticsService.getOrganizationAnalytics(
        testOrg1.id
      );

      const user1Analytics = analytics?.members.find(
        (m) => m.userId === testUser1.id
      );

      expect(user1Analytics?.lastActivity).toBeDefined();
      expect(user1Analytics?.lastActivity).toBeInstanceOf(Date);

      // Should be recent (within last minute)
      const timeDiff = new Date().getTime() - user1Analytics!.lastActivity!.getTime();
      expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
    });

    it("should aggregate organization totals correctly", async () => {
      const analytics = await organizationAnalyticsService.getOrganizationAnalytics(
        testOrg1.id
      );

      expect(analytics?.totalTimeSpent).toBe(12600);
      expect(analytics?.totalCreditsConsumed).toBe(350);
      expect(analytics?.memberCount).toBe(2);
    });
  });
});
