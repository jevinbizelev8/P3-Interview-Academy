/**
 * Schema Migration API Endpoint
 *
 * Provides a safe way to apply database schema fixes without direct DB access.
 * This endpoint can be called from staging/production to fix schema issues.
 */

import { Router } from 'express';
import { pool } from '../db';
import type { QueryResult } from 'pg';

const router = Router();

// Middleware to require admin authentication
// In production, this should check for admin role
const requireAdmin = (req: any, res: any, next: any) => {
  const adminKey = req.get('X-Admin-Key');
  const expected = process.env.ADMIN_MIGRATION_KEY;

  if (!expected || adminKey !== expected) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  next();
};

/**
 * POST /api/schema/fix-current-role
 *
 * Fixes the SQL reserved keyword issue with 'current_role' column.
 *
 * The issue: PostgreSQL treats 'current_role' as a system function
 * The fix: Rename column to 'user_current_role' to avoid conflict
 */
router.post('/fix-current-role', requireAdmin, async (req, res) => {
  const client = await pool.connect();

  try {
    await (client.query as any)('BEGIN');

    console.log('[Schema Migration] Checking current_role column...');

    // Check if old column exists
    const checkOld: QueryResult = await (client.query as any)(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'current_role'
    `);

    // Check if new column exists
    const checkNew: QueryResult = await (client.query as any)(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'user_current_role'
    `);

    if (checkNew.rows.length > 0) {
      console.log('[Schema Migration] Column already migrated to user_current_role');
      await (client.query as any)('ROLLBACK');
      return res.json({
        status: 'already_applied',
        message: 'Column has already been migrated to user_current_role'
      });
    }

    if (checkOld.rows.length === 0) {
      console.log('[Schema Migration] Neither column exists, adding user_current_role');
      // Add the new column
      await (client.query as any)(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS user_current_role VARCHAR
      `);

      await (client.query as any)('COMMIT');
      return res.json({
        status: 'column_added',
        message: 'Added user_current_role column (old column did not exist)'
      });
    }

    // Rename old column to new column
    console.log('[Schema Migration] Renaming current_role to user_current_role');
    await (client.query as any)(`
      ALTER TABLE users
      RENAME COLUMN current_role TO user_current_role
    `);

    await (client.query as any)('COMMIT');

    console.log('[Schema Migration] Successfully renamed column');
    return res.json({
      status: 'migrated',
      message: 'Successfully renamed current_role to user_current_role'
    });

  } catch (error: any) {
    await (client.query as any)('ROLLBACK');
    console.error('[Schema Migration] Error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message,
      error: String(error)
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/schema/status
 *
 * Check the current schema status
 */
router.get('/status', requireAdmin, async (req, res) => {
  const client = await pool.connect();

  try {
    const result: QueryResult = await (client.query as any)(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('current_role', 'user_current_role')
      ORDER BY column_name
    `);

    return res.json({
      status: 'ok',
      columns: result.rows.map((r: any) => r.column_name)
    });

  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  } finally {
    client.release();
  }
});

export default router;
