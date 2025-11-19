#!/usr/bin/env node
/**
 * Telegram Deployment Approval Server
 *
 * This server provides an HTTP API for GitHub Actions to check deployment approval status.
 * It integrates with the existing Telegram webhook server to handle approval/rejection replies.
 *
 * Flow:
 * 1. GitHub Actions generates approval token
 * 2. GitHub Actions sends Telegram notification with token
 * 3. User replies "approve <token>" or "reject <token>"
 * 4. Telegram webhook receives reply, stores decision in memory
 * 5. GitHub Actions polls this server to check approval status
 * 6. Server returns APPROVED, REJECTED, or PENDING
 */

const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = process.env.APPROVAL_SERVER_PORT || 3001;

// In-memory storage for approval decisions
// Format: { token: { decision: 'APPROVED'|'REJECTED'|'PENDING', timestamp: Date } }
const approvals = new Map();

// Token expiry time (15 minutes)
const TOKEN_EXPIRY_MS = 15 * 60 * 1000;

// Cleanup expired tokens every minute
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of approvals.entries()) {
    if (now - data.timestamp > TOKEN_EXPIRY_MS) {
      console.log(`[CLEANUP] Removing expired token: ${token}`);
      approvals.delete(token);
    }
  }
}, 60 * 1000);

app.use(express.json());

// Middleware: Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * GET /status/:token
 * Check approval status for a deployment token
 *
 * Response:
 * - 200: { status: 'APPROVED'|'REJECTED'|'PENDING' }
 * - 404: Token not found or expired
 */
app.get('/status/:token', (req, res) => {
  const { token } = req.params;

  if (!approvals.has(token)) {
    return res.status(404).json({
      status: 'UNKNOWN',
      message: 'Token not found. Either it has expired or was never created.'
    });
  }

  const approval = approvals.get(token);
  const age = Date.now() - approval.timestamp;

  if (age > TOKEN_EXPIRY_MS) {
    approvals.delete(token);
    return res.status(410).json({
      status: 'EXPIRED',
      message: 'Token has expired'
    });
  }

  res.json({
    status: approval.decision,
    timestamp: approval.timestamp
  });
});

/**
 * POST /register/:token
 * Register a new approval token (called by GitHub Actions)
 *
 * Body: { metadata: { commit, author, branch } }
 * Response: 201 Created
 */
app.post('/register/:token', (req, res) => {
  const { token } = req.params;
  const { metadata } = req.body;

  if (approvals.has(token)) {
    return res.status(409).json({
      error: 'Token already registered'
    });
  }

  approvals.set(token, {
    decision: 'PENDING',
    timestamp: Date.now(),
    metadata: metadata || {}
  });

  console.log(`[REGISTER] New approval token: ${token}`);
  console.log(`[REGISTER] Metadata:`, metadata);

  res.status(201).json({
    message: 'Token registered',
    token,
    expiresIn: TOKEN_EXPIRY_MS
  });
});

/**
 * POST /approve/:token
 * Approve a deployment (called by Telegram webhook)
 *
 * Response: 200 OK
 */
app.post('/approve/:token', (req, res) => {
  const { token } = req.params;

  if (!approvals.has(token)) {
    return res.status(404).json({
      error: 'Token not found'
    });
  }

  const approval = approvals.get(token);

  if (approval.decision !== 'PENDING') {
    return res.status(409).json({
      error: `Token already ${approval.decision.toLowerCase()}`
    });
  }

  approval.decision = 'APPROVED';
  approval.approvedAt = Date.now();
  approvals.set(token, approval);

  console.log(`[APPROVE] Token approved: ${token}`);

  res.json({
    message: 'Deployment approved',
    token
  });
});

/**
 * POST /reject/:token
 * Reject a deployment (called by Telegram webhook)
 *
 * Response: 200 OK
 */
app.post('/reject/:token', (req, res) => {
  const { token } = req.params;

  if (!approvals.has(token)) {
    return res.status(404).json({
      error: 'Token not found'
    });
  }

  const approval = approvals.get(token);

  if (approval.decision !== 'PENDING') {
    return res.status(409).json({
      error: `Token already ${approval.decision.toLowerCase()}`
    });
  }

  approval.decision = 'REJECTED';
  approval.rejectedAt = Date.now();
  approvals.set(token, approval);

  console.log(`[REJECT] Token rejected: ${token}`);

  res.json({
    message: 'Deployment rejected',
    token
  });
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    activeTokens: approvals.size,
    port: PORT
  });
});

/**
 * GET /list (development only)
 * List all active tokens (for debugging)
 */
if (process.env.NODE_ENV !== 'production') {
  app.get('/list', (req, res) => {
    const tokens = Array.from(approvals.entries()).map(([token, data]) => ({
      token,
      decision: data.decision,
      age: Math.floor((Date.now() - data.timestamp) / 1000) + 's',
      metadata: data.metadata
    }));
    res.json({ tokens });
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Deployment Approval Server running on port ${PORT}`);
  console.log(`📋 Token expiry: ${TOKEN_EXPIRY_MS / 1000}s`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(``);
  console.log(`Endpoints:`);
  console.log(`  GET  /status/:token     - Check approval status`);
  console.log(`  POST /register/:token   - Register new token`);
  console.log(`  POST /approve/:token    - Approve deployment`);
  console.log(`  POST /reject/:token     - Reject deployment`);
  console.log(`  GET  /health            - Server health`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`  GET  /list              - List tokens (dev only)`);
  }
});
