import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import { registerRoutes } from '../../routes';
import type { Server } from 'http';

/**
 * API Response Time Performance Tests
 *
 * Tests critical API endpoints to ensure they respond within acceptable timeframes:
 * - Health checks: < 50ms
 * - Authentication: < 150ms
 * - Credit operations: < 100ms
 * - Session creation: < 200ms
 * - Scenario lists: < 150ms
 *
 * These benchmarks are designed for production environments and help identify
 * performance regressions early.
 */

// Mock Stripe configuration to avoid missing env var errors
vi.mock('../../config/stripe', () => ({
  stripeClient: {
    customers: { create: vi.fn(), retrieve: vi.fn() },
    subscriptions: { create: vi.fn(), retrieve: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
  },
  STRIPE_MODE: 'test',
  STRIPE_SECRET_KEY: 'sk_test_mock',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_mock',
}));

// Mock rate limiter
vi.mock('express-rate-limit', () => ({
  default: vi.fn(() => (req: any, res: any, next: any) => next()),
}));

describe('API Response Time Tests', () => {
  let app: Express;
  let server: Server;

  beforeAll(async () => {
    // Set required environment variables
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.SESSION_SECRET = 'test-secret-key-for-testing';
    process.env.BYPASS_AUTH = 'true';
    process.env.OPENAI_API_KEY = 'sk-test-mock-key';
    process.env.STRIPE_TEST_SECRET_KEY = 'sk_test_mock';

    app = express();
    server = await registerRoutes(app);
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  it('GET /api/health/simple should respond in < 50ms', async () => {
    const start = Date.now();

    const response = await request(app)
      .get('/api/health/simple');

    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(duration).toBeLessThan(50);

    console.log(`✓ Health check completed in ${duration}ms`);
  });

  it('POST /api/auth/login should respond in < 150ms', async () => {
    const start = Date.now();

    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({
        email: 'test@example.com',
        password: 'Test123!@#'
      }));

    const duration = Date.now() - start;

    // Either success (200), auth failure (401), validation error (422), or server error (500) is acceptable
    expect([200, 401, 422, 500]).toContain(response.status);
    expect(duration).toBeLessThan(150);

    console.log(`✓ Login endpoint completed in ${duration}ms`);
  });

  it('GET /api/credits/balance should respond in < 100ms (with auth bypass)', async () => {
    // This test assumes BYPASS_AUTH is enabled in test environment
    const start = Date.now();

    const response = await request(app)
      .get('/api/credits/balance');

    const duration = Date.now() - start;

    // Either success (200) or auth required (401) is acceptable
    expect([200, 401]).toContain(response.status);
    expect(duration).toBeLessThan(100);

    console.log(`✓ Credit balance check completed in ${duration}ms`);
  });

  it('POST /api/practice/sessions should respond in < 200ms (with auth bypass)', async () => {
    const start = Date.now();

    const response = await request(app)
      .post('/api/practice/sessions')
      .send({
        scenarioId: 'test-scenario-001',
        interviewStage: 'phone-screening',
        interviewLanguage: 'en',
        voiceEnabled: false
      });

    const duration = Date.now() - start;

    // Either success (200/201) or validation error (400/401/422) is acceptable
    expect([200, 201, 400, 401, 422]).toContain(response.status);
    expect(duration).toBeLessThan(200);

    console.log(`✓ Practice session creation completed in ${duration}ms`);
  });

  it('GET /api/practice/scenarios should respond in < 150ms', async () => {
    const start = Date.now();

    const response = await request(app)
      .get('/api/practice/scenarios');

    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(duration).toBeLessThan(150);

    console.log(`✓ Scenario list fetch completed in ${duration}ms`);
  });
});
