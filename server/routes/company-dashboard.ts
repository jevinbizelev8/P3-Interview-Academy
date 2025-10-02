import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { storage } from "../storage.js";
import { creditService } from "../services/credit-service.js";
import { requireAdmin } from "../middleware/auth-middleware";

const router = Router();

const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  type: z.enum(["customer", "reseller"]).default("customer"),
});

const provisionUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  password: z.string().min(8),
  accountTier: z.enum(["free", "paid"]).default("paid"),
  monthlyCredits: z.number().min(0).optional(),
  organizationId: z.string().uuid().optional(),
  organizationRole: z.enum(["member", "manager", "admin"]).default("member"),
});

const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["member", "manager", "admin"]).default("member"),
  monthlyCredits: z.number().min(0).optional(),
});

const updateUserCreditsSchema = z.object({
  accountTier: z.enum(["free", "paid"]).optional(),
  monthlyCredits: z.number().min(0).optional(),
  creditBalance: z.number().min(0).optional(),
  reason: z.string().min(1).max(500).optional(),
}).refine(
  (payload) =>
    typeof payload.accountTier !== "undefined"
    || typeof payload.monthlyCredits !== "undefined"
    || typeof payload.creditBalance !== "undefined",
  {
    message: "Provide at least one field to update",
    path: ["accountTier"],
  },
);

const MANAGER_ROLES = new Set(["owner", "admin", "manager"]);

async function ensureOrganizationManagementAccess(userId: string, organizationId: string) {
  const membership = await storage.getOrganizationMembership(userId, organizationId);
  if (!membership || !MANAGER_ROLES.has(membership.role)) {
    throw new Error("ACCESS_DENIED");
  }
  return membership;
}

router.post("/organizations", requireAdmin, async (req, res) => {
  try {
    const validation = createOrganizationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "INVALID_ORGANIZATION",
        details: validation.error.issues,
      });
    }

    const organization = await storage.createOrganization({
      ...validation.data,
      createdBy: req.user!.id,
    });

    await storage.addOrganizationMembership({
      organizationId: organization.id,
      userId: req.user!.id,
      role: "owner",
    });

    res.status(201).json({
      success: true,
      data: organization,
    });
  } catch (error) {
    console.error("Failed to create organization:", error);
    res.status(500).json({
      error: "ORGANIZATION_CREATION_FAILED",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/users", requireAdmin, async (req, res) => {
  try {
    const validation = provisionUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "INVALID_USER_PROVISION",
        details: validation.error.issues,
      });
    }

    const payload = validation.data;
    const existingUser = await storage.getUserByEmail(payload.email);
    const userId = existingUser?.id ?? crypto.randomUUID();
    const role = payload.organizationRole === "admin"
      ? "admin"
      : payload.organizationRole === "manager"
        ? "manager"
        : existingUser?.role ?? "user";

    const hashedPassword = await bcrypt.hash(payload.password, 12);

    const user = await storage.upsertUser({
      id: userId,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName ?? "",
      role,
      passwordHash: hashedPassword,
    });

    await creditService.initializeUserAccount(
      user.id,
      payload.accountTier,
      payload.monthlyCredits,
    );

    if (payload.organizationId) {
      const organization = await storage.getOrganization(payload.organizationId);
      if (!organization) {
        return res.status(404).json({ error: "ORGANIZATION_NOT_FOUND" });
      }

      await storage.addOrganizationMembership({
        organizationId: payload.organizationId,
        userId: user.id,
        role: payload.organizationRole,
      });
    }

    const creditSummary = await creditService.getUserSummary(user.id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        credits: creditSummary,
      },
    });
  } catch (error) {
    console.error("Failed to provision user:", error);
    res.status(500).json({
      error: "USER_PROVISION_FAILED",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/organizations/:orgId/members", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    const validation = addMemberSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "INVALID_MEMBERSHIP",
        details: validation.error.issues,
      });
    }

    const { orgId } = req.params;
    const payload = validation.data;

    if (req.user.role !== "admin") {
      const membership = await ensureOrganizationManagementAccess(req.user.id, orgId);
      if (membership.role === "manager" && payload.role === "admin") {
        return res.status(403).json({
          error: "INSUFFICIENT_PRIVILEGES",
          message: "Managers cannot assign admin memberships",
        });
      }
    }

    const member = await storage.addOrganizationMembership({
      organizationId: orgId,
      userId: payload.userId,
      role: payload.role,
    });

    if (payload.role !== "member") {
      const newRole = payload.role === "admin" ? "admin" : "manager";
      await storage.updateUser(payload.userId, { role: newRole });
    }

    if (typeof payload.monthlyCredits === "number") {
      await creditService.initializeUserAccount(payload.userId, payload.role === "member" ? "free" : "paid", payload.monthlyCredits);
    }

    res.status(201).json({
      success: true,
      data: member,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ACCESS_DENIED") {
      return res.status(403).json({
        error: "ACCESS_DENIED",
        message: "You do not have permission to manage this organization",
      });
    }

    console.error("Failed to add organization member:", error);
    res.status(500).json({
      error: "MEMBERSHIP_UPDATE_FAILED",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/credits/me", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    const summary = await creditService.getUserSummary(req.user.id);
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error("Failed to retrieve user credits:", error);
    res.status(500).json({
      error: "CREDIT_LOOKUP_FAILED",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/users/:userId/credits", requireAdmin, async (req, res) => {
  try {
    const summary = await creditService.getUserSummary(req.params.userId);
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error("Failed to retrieve user credits:", error);
    res.status(500).json({
      error: "CREDIT_LOOKUP_FAILED",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.patch("/users/:userId/credits", requireAdmin, async (req, res) => {
  try {
    const validation = updateUserCreditsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "INVALID_CREDIT_UPDATE",
        details: validation.error.issues,
      });
    }

    const summary = await creditService.adminAdjustUserCredits(
      req.params.userId,
      validation.data,
    );

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error("Failed to update user credits:", error);
    res.status(500).json({
      error: "CREDIT_UPDATE_FAILED",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/organizations/:orgId/usage", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    const { orgId } = req.params;

    if (req.user.role !== "admin") {
      await ensureOrganizationManagementAccess(req.user.id, orgId);
    }

    const organization = await storage.getOrganization(orgId);
    if (!organization) {
      return res.status(404).json({ error: "ORGANIZATION_NOT_FOUND" });
    }

    const members = await storage.getOrganizationMembers(orgId);
    const usage = await Promise.all(
      members.map(async (membership) => {
        const summary = await creditService.getUserSummary(membership.userId);
        return {
          membership: {
            id: membership.id,
            role: membership.role,
            userId: membership.userId,
          },
          user: {
            id: membership.user.id,
            email: membership.user.email,
            firstName: membership.user.firstName,
            lastName: membership.user.lastName,
            role: membership.user.role,
          },
          credits: summary,
        };
      }),
    );

    res.json({
      success: true,
      data: {
        organization: {
          id: organization.id,
          name: organization.name,
          type: organization.type,
        },
        members: usage,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ACCESS_DENIED") {
      return res.status(403).json({
        error: "ACCESS_DENIED",
        message: "You do not have permission to view this organization",
      });
    }

    console.error("Failed to retrieve organization usage:", error);
    res.status(500).json({
      error: "ORGANIZATION_USAGE_FAILED",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
