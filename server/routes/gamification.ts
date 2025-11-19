// Gamification API Routes
// RESTful endpoints for badges, XP points, streaks, and leaderboard

import { Router } from "express";
import { z } from "zod";
import { GamificationService } from "../services/gamification-service";
import { BadgeService } from "../services/badge-service";

const router = Router();

//
// ======================
// Badge Routes
// ======================
//

/**
 * GET /badges
 * Get all available badges
 * Query params: category (optional)
 */
router.get('/badges', async (req, res) => {
  try {
    const category = req.query.category as string | undefined;

    const allBadges = await BadgeService.getAllBadges(category);
    return res.json({ success: true, data: allBadges });
  } catch (error) {
    console.error('❌ Error getting badges:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve badges',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /user-badges
 * Get user's badges with progress
 * Query params: earnedOnly (boolean)
 */
router.get('/user-badges', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const earnedOnly = req.query.earnedOnly === 'true';

    const userBadges = await BadgeService.getUserBadges(req.user.id, earnedOnly);
    const stats = await BadgeService.getUserBadgeStats(req.user.id);

    return res.json({
      success: true,
      data: {
        badges: userBadges,
        stats,
      },
    });
  } catch (error) {
    console.error('❌ Error getting user badges:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve user badges',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /award-badge
 * Award a badge to a user (internal/admin use)
 */
const awardBadgeSchema = z.object({
  badgeId: z.string().uuid('Invalid badge ID'),
  progress: z.number().int().min(0).optional(),
});

router.post('/award-badge', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const validatedData = awardBadgeSchema.parse(req.body);

    const result = await GamificationService.awardBadge(
      req.user.id,
      validatedData.badgeId,
      validatedData.progress
    );

    return res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    console.error('❌ Error awarding badge:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to award badge',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

//
// ======================
// XP Points Routes
// ======================
//

/**
 * POST /add-points
 * Add XP points to user
 */
const addPointsSchema = z.object({
  points: z.number().int().min(1, 'Points must be at least 1'),
  source: z.string().min(1, 'Source is required'),
  description: z.string().optional(),
});

router.post('/add-points', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const validatedData = addPointsSchema.parse(req.body);

    const result = await GamificationService.addPoints(
      req.user.id,
      validatedData.points,
      validatedData.source,
      validatedData.description
    );

    return res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('❌ Error adding points:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add points',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /points
 * Get user's current XP points and level
 */
router.get('/points', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const points = await GamificationService.getPoints(req.user.id);
    return res.json({ success: true, data: points });
  } catch (error) {
    console.error('❌ Error getting points:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve points',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

//
// ======================
// Streak Routes
// ======================
//

/**
 * POST /update-streak
 * Update user's activity streak
 */
router.post('/update-streak', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const result = await GamificationService.updateStreak(req.user.id);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Error updating streak:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update streak',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /streak
 * Get user's current streak information
 */
router.get('/streak', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const streak = await GamificationService.getStreak(req.user.id);
    return res.json({ success: true, data: streak });
  } catch (error) {
    console.error('❌ Error getting streak:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve streak',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

//
// ======================
// Leaderboard Route
// ======================
//

/**
 * GET /leaderboard
 * Get top users by XP
 * Query params: limit (number, default 10, max 100)
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(
      parseInt(req.query.limit as string) || 10,
      100
    );

    const leaderboard = await GamificationService.getLeaderboard(limit);
    return res.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('❌ Error getting leaderboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve leaderboard',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
