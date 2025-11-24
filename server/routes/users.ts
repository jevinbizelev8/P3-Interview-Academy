import { Router } from "express";
import { requireAuth } from "../middleware/auth-middleware";
import { storage } from "../storage";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { S3Service } from "../services/s3-service";

// Configure multer for profile photo uploads - use memory storage for S3
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory for S3 upload
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'));
    }
  }
});

const router = Router();

// Get current user profile
router.get("/profile", requireAuth, async (req, res) => {
  try {
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return user profile data in the format expected by the frontend
    const profile = {
      id: user.id,
      email: user.email,
      full_name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      mobile_number: user.mobileNumber,
      linkedin_url: user.linkedinUrl,
      timezone: user.timezone,
      country: user.country,
      current_role: user.currentRole,
      target_role: user.targetRole,
      target_industry: user.targetIndustry,
      years_experience: user.yearsExperience,
      key_skills: user.keySkills || [],
      profile_photo_url: user.profileImageUrl,
      two_factor_enabled: user.twoFactorEnabled,
      notification_email: user.notificationEmail,
      notification_whatsapp: user.notificationWhatsapp,
      notification_sms: user.notificationSms,
      // Include other fields that might be needed
      role: user.role,
      planType: user.planType,
      creditBalance: user.creditBalance,
      xpPoints: user.xpPoints,
      currentStreak: user.currentStreak,
      readinessScore: user.readinessScore,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Failed to fetch user profile" });
  }
});

// Update user profile
router.put("/profile", requireAuth, async (req, res) => {
  try {
    const updateSchema = z.object({
      full_name: z.string().optional(),
      mobile_number: z.string().optional(),
      linkedin_url: z.string().url().optional().or(z.literal("")),
      timezone: z.string().optional(),
      country: z.string().optional(),
      current_role: z.string().optional(),
      target_role: z.string().optional(),
      target_industry: z.string().optional(),
      years_experience: z.string().optional(),
      key_skills: z.array(z.string()).optional(),
      profile_photo_url: z.string().url().optional().or(z.literal("")),
      two_factor_enabled: z.boolean().optional(),
      notification_email: z.boolean().optional(),
      notification_whatsapp: z.boolean().optional(),
      notification_sms: z.boolean().optional(),
    });

    const validatedData = updateSchema.parse(req.body);

    // Map frontend field names to database field names
    const dbUpdateData = {
      fullName: validatedData.full_name,
      mobileNumber: validatedData.mobile_number,
      linkedinUrl: validatedData.linkedin_url || undefined,
      timezone: validatedData.timezone,
      country: validatedData.country,
      currentRole: validatedData.current_role,
      targetRole: validatedData.target_role,
      targetIndustry: validatedData.target_industry,
      yearsExperience: validatedData.years_experience,
      keySkills: validatedData.key_skills,
      profileImageUrl: validatedData.profile_photo_url || undefined,
      twoFactorEnabled: validatedData.two_factor_enabled,
      notificationEmail: validatedData.notification_email,
      notificationWhatsapp: validatedData.notification_whatsapp,
      notificationSms: validatedData.notification_sms,
      updatedAt: new Date(),
    };

    const updatedUser = await storage.upsertUser({
      id: req.user!.id,
      ...dbUpdateData,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return updated profile data
    const profile = {
      id: updatedUser.id,
      email: updatedUser.email,
      full_name: updatedUser.fullName || `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim(),
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      mobile_number: updatedUser.mobileNumber,
      linkedin_url: updatedUser.linkedinUrl,
      timezone: updatedUser.timezone,
      country: updatedUser.country,
      current_role: updatedUser.currentRole,
      target_role: updatedUser.targetRole,
      target_industry: updatedUser.targetIndustry,
      years_experience: updatedUser.yearsExperience,
      key_skills: updatedUser.keySkills || [],
      profile_photo_url: updatedUser.profileImageUrl,
      two_factor_enabled: updatedUser.twoFactorEnabled,
      notification_email: updatedUser.notificationEmail,
      notification_whatsapp: updatedUser.notificationWhatsapp,
      notification_sms: updatedUser.notificationSms,
      role: updatedUser.role,
      planType: updatedUser.planType,
      creditBalance: updatedUser.creditBalance,
      xpPoints: updatedUser.xpPoints,
      currentStreak: updatedUser.currentStreak,
      readinessScore: updatedUser.readinessScore,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error("Error updating user profile:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid profile data",
        errors: error.errors
      });
    }
    res.status(500).json({ message: "Failed to update user profile" });
  }
});

// Upload profile photo
router.post("/profile/photo", requireAuth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No photo uploaded"
      });
    }

    const s3Service = new S3Service();

    // Delete old photo if exists
    const currentUser = await storage.getUserById(req.user!.id);
    if (currentUser?.profileImageUrl && currentUser.profileImageUrl.includes('s3.amazonaws.com')) {
      await s3Service.deleteProfilePhoto(currentUser.profileImageUrl);
    }

    // Upload to S3
    const fileUrl = await s3Service.uploadProfilePhoto(
      req.user!.id,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Update user profile with S3 URL
    const updatedUser = await storage.upsertUser({
      id: req.user!.id,
      profileImageUrl: fileUrl,
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    console.log(`✅ Profile photo uploaded for user ${req.user!.id}: ${fileUrl}`);

    res.json({
      success: true,
      data: {
        message: "Profile photo uploaded successfully",
        profile_photo_url: fileUrl,
        user: {
          id: updatedUser.id,
          profileImageUrl: updatedUser.profileImageUrl
        }
      }
    });
  } catch (error) {
    console.error("Error uploading profile photo:", error);

    // Check if it's a Multer error
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: "File too large. Maximum size is 5MB."
        });
      }
    }

    res.status(500).json({
      success: false,
      error: "Failed to upload profile photo. Please try again.",
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

export default router;