import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./vite";
import { validateEmailConfig, verifyEmailTransport } from "./services/email-service";
import { sendVerificationEmail } from "./services/email-service";
import crypto from "crypto";

// Validate email configuration at startup
try {
  validateEmailConfig();
  log('✅ Email configuration validated', 'startup');
} catch (error) {
  log(`⚠️  Email configuration incomplete: ${(error as Error).message}`, 'startup');
  log('Email features will be unavailable until configuration is complete', 'startup');
}


// Proactively verify SMTP transport to catch production issues early
(async () => {
  try {
    const result = await verifyEmailTransport();
    console.log('[email-startup]', result);
  } catch (e) {
    console.error('[email-startup] verify failed to run', e);
  }
})();

// Optional one-shot SMTP self-test on startup if configured
(async () => {
  const selfTestTo = process.env.SMTP_SELF_TEST_TO;
  if (!selfTestTo) return;
  try {
    const vr = await verifyEmailTransport();
    console.log('[email-selftest-verify]', vr);
    const token = crypto.randomBytes(32).toString('hex');
    await sendVerificationEmail(selfTestTo, token, 'SelfTest');
    console.log('[email-selftest-send] attempted', { to: selfTestTo });
  } catch (e: any) {
    console.error('[email-selftest-error]', { message: e?.message, code: e?.code, command: e?.command });
  }
})();
const app = express();

// Stripe webhooks require the raw body for signature verification.
// Register this BEFORE any JSON/body parsers.
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// CORS configuration for iframe embedding
app.use((req, res, next) => {
  // Allow embedding from bizelev8.ai domains
  const allowedOrigins = [
    'https://www.bizelev8.ai',
    'https://bizelev8.ai',
    'https://p3app.bizelev8.ai'
  ];

  const origin = req.get('Origin') || req.get('Referer');
  if (origin) {
    const isAllowed = allowedOrigins.some(allowed => origin.includes(allowed.replace('https://', '')));
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }

  // Remove X-Frame-Options to allow iframe embedding from allowed domains
  res.removeHeader('X-Frame-Options');

  // Set Content-Security-Policy to allow embedding from bizelev8.ai
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://www.bizelev8.ai https://bizelev8.ai");

  // Standard CORS headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

log(`Express env: ${app.get("env")}`, "startup");

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "â€¦";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Initialize credit reset cron job (Phase 7)
  try {
    const { initializeCreditResetCron, runStartupCreditReset } = await import('./services/credit-reset-cron.js');

    // Initialize daily cron job
    initializeCreditResetCron();
    log('✅ Credit reset cron job initialized', 'startup');

    // Run startup fallback to catch any missed resets
    await runStartupCreditReset();
    log('✅ Startup credit reset fallback complete', 'startup');
  } catch (error) {
    log(`⚠️  Credit reset cron initialization failed: ${(error as Error).message}`, 'startup');
  }

  // Serve uploaded files (profile photos, resumes, etc.)
  // Note: In production, migrate to AWS S3 for scalability across multiple instances
  const uploadsPath = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    log('✅ Created uploads directory', 'startup');
  }

  app.use('/uploads', express.static(uploadsPath, {
    maxAge: '1d',  // Cache for 1 day
    etag: true,
    lastModified: true,
    // Security: Prevent directory listing
    index: false
  }));
  log('✅ Static file serving enabled for /uploads', 'startup');

  // CRITICAL: API 404 handler MUST be placed before static file serving
  // to prevent non-existent API routes from serving the frontend HTML
  app.all("/api/*", (req, res) => {
    res.status(404).json({ 
      message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
      timestamp: new Date().toISOString(),
      suggestion: "Check the API documentation for available endpoints"
    });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Serve uploaded files (profile photos, etc.)
  // Must be before Vite static middleware to take precedence
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    log('Created uploads directory', 'startup');
  }

  app.use('/uploads', express.static(uploadsDir, {
    maxAge: '1d',  // Cache for 1 day
    etag: true,
    lastModified: true,
    setHeaders: (res, filepath) => {
      // Security headers for uploaded files
      res.setHeader('X-Content-Type-Options', 'nosniff');
      // Only allow images to be displayed inline
      if (filepath.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        res.setHeader('Content-Disposition', 'inline');
      } else {
        res.setHeader('Content-Disposition', 'attachment');
      }
    }
  }));
  log('Static file serving enabled for /uploads', 'startup');

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    const { setupVite } = await import("./setup-vite");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const listenOptions: { port: number; host: string; reusePort?: boolean } = {
    port,
    host: "0.0.0.0",
  };

  if (process.platform !== "win32") {
    listenOptions.reusePort = true;
  }

  server.listen(listenOptions, () => {
    log(`serving on port ${port}`);
  });
})();

