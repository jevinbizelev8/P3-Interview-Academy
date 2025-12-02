import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

/**
 * Authentication Bypass Prevention Tests
 *
 * Tests security fixes from Phase 3.5 that prevent unauthorized access
 * to protected endpoints and admin-only functionality.
 *
 * Coverage:
 * - Unauthenticated access to protected endpoints
 * - Expired/invalid token rejection
 * - Token tampering detection
 * - Admin-only endpoint protection
 * - Session validation
 */

// Mock database
const queryChain = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockResolvedValue([]),
};

vi.mock('../../db', () => ({
  db: {
    select: vi.fn(() => queryChain),
  },
}));

// Mock storage
vi.mock('../../storage', () => ({
  storage: {
    getUser: vi.fn(),
    getCreditBalance: vi.fn(),
    getUserPracticeSessions: vi.fn(),
    getUserAIPrepareSessions: vi.fn(),
    getUserProfile: vi.fn(),
  },
}));

// Mock session middleware
vi.mock('express-session', () => ({
  default: () => (req: any, res: any, next: any) => {
    req.session = req.mockSession || {};
    next();
  },
}));

describe('Authentication Bypass Prevention Tests', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create fresh Express app with auth middleware
    app = express();
    app.use(express.json());

    // Import auth middleware
    const { requireAuth } = await import('../../auth-simple');
    const { requireAdmin } = await import('../../middleware/auth-middleware');

    // Protected routes
    app.get('/api/credits/balance', requireAuth, (req, res) => {
      res.json({ balance: 100 });
    });

    app.get('/api/practice/sessions', requireAuth, (req, res) => {
      res.json({ sessions: [] });
    });

    app.get('/api/prepare/sessions', requireAuth, (req, res) => {
      res.json({ sessions: [] });
    });

    app.get('/api/user/profile', requireAuth, (req, res) => {
      res.json({ id: req.user?.id, email: req.user?.email });
    });

    // Admin-only route
    app.get('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
      res.json({ users: [] });
    });
  });

  it('should block unauthenticated access to protected endpoints', async () => {
    const protectedEndpoints = [
      '/api/credits/balance',
      '/api/practice/sessions',
      '/api/prepare/sessions',
      '/api/user/profile'
    ];

    for (const endpoint of protectedEndpoints) {
      const response = await request(app)
        .get(endpoint)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toMatch(/unauthorized|authentication/i);
    }
  });

  it('should reject expired tokens', async () => {
    // Mock expired session
    const response = await request(app)
      .get('/api/credits/balance')
      .set('Cookie', 'connect.sid=expired-session-token')
      .expect('Content-Type', /json/);

    expect(response.status).toBe(401);
    expect(response.body.message.toLowerCase()).toMatch(/unauthorized|session/i);
  });

  it('should reject invalid tokens', async () => {
    const invalidTokens = [
      'invalid-jwt-token',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
      'Bearer invalid',
      'malformed.token.here'
    ];

    for (const token of invalidTokens) {
      const response = await request(app)
        .get('/api/credits/balance')
        .set('Cookie', `connect.sid=${token}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
    }
  });

  it('should detect token tampering', async () => {
    // Create a tampered session cookie
    const tamperedSession = 's%3A' + Buffer.from(JSON.stringify({
      userId: 'tampered-user-id',
      role: 'admin', // Try to escalate privileges
    })).toString('base64');

    const response = await request(app)
      .get('/api/credits/balance')
      .set('Cookie', `connect.sid=${tamperedSession}`)
      .expect('Content-Type', /json/);

    // Should reject tampered session
    expect(response.status).toBe(401);
  });

  it('should prevent regular users from accessing admin endpoints', async () => {
    // Mock regular user session
    const regularUserApp = express();
    regularUserApp.use(express.json());
    regularUserApp.use((req, res, next) => {
      req.user = {
        id: 'regular-user-123',
        role: 'user',
        email: 'user@test.com',
        firstName: 'Regular',
        lastName: 'User'
      };
      next();
    });

    const { requireAdmin } = await import('../../middleware/auth-middleware');

    regularUserApp.get('/api/admin/users', requireAdmin, (req, res) => {
      res.json({ users: [] });
    });

    const response = await request(regularUserApp)
      .get('/api/admin/users')
      .expect('Content-Type', /json/);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message.toLowerCase()).toMatch(/admin.*required|forbidden|access denied/i);
  });
});
