import type { RequestHandler } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replit-auth";

// Development flag - set to false for production
const DEVELOPMENT_MODE = process.env.NODE_ENV === 'development';

/**
 * Enhanced authentication middleware that requires valid user session
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  // In development, allow bypass for testing but still log
  if (DEVELOPMENT_MODE && process.env.BYPASS_AUTH === 'true') {
    console.log('⚠️  DEVELOPMENT: Bypassing authentication - NOT FOR PRODUCTION');
    req.user = { 
      id: "dev-user-123", 
      role: "user",
      email: "dev@example.com",
      firstName: "Dev",
      lastName: "User"
    };
    return next();
  }

  // Use proper Replit authentication
  return isAuthenticated(req, res, next);
};

/**
 * Middleware to validate that the user owns the requested session
 */
export const validateSessionOwnership: RequestHandler = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId || req.params.id;
    const userId = req.user?.id;

    if (!sessionId) {
      return res.status(400).json({ 
        message: "Session ID is required",
        code: "MISSING_SESSION_ID" 
      });
    }

    if (!userId) {
      return res.status(401).json({ 
        message: "User authentication required",
        code: "UNAUTHORIZED" 
      });
    }

    // Fetch session and validate ownership
    const session = await storage.getInterviewSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ 
        message: "Session not found",
        code: "SESSION_NOT_FOUND" 
      });
    }

    if (session.userId !== userId) {
      console.log(`🚫 Access denied: User ${userId} attempted to access session ${sessionId} owned by ${session.userId}`);
      return res.status(403).json({ 
        message: "Access denied - you can only access your own sessions",
        code: "ACCESS_DENIED" 
      });
    }

    // Store session in request for downstream use
    (req as any).interviewSession = session;
    next();
  } catch (error) {
    console.error('Error validating session ownership:', error);
    res.status(500).json({ 
      message: "Failed to validate session ownership",
      code: "VALIDATION_ERROR" 
    });
  }
};

/**
 * Middleware to validate that the user can access evaluation results
 */
export const validateEvaluationAccess: RequestHandler = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        message: "User authentication required",
        code: "UNAUTHORIZED" 
      });
    }

    // First validate session ownership
    const session = await storage.getInterviewSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ 
        message: "Session not found",
        code: "SESSION_NOT_FOUND" 
      });
    }

    if (session.userId !== userId) {
      return res.status(403).json({ 
        message: "Access denied - you can only access your own evaluations",
        code: "ACCESS_DENIED" 
      });
    }

    // Ensure session is completed before allowing evaluation access
    if (session.status !== 'completed') {
      return res.status(400).json({ 
        message: "Evaluation not available - session not completed",
        code: "SESSION_NOT_COMPLETED" 
      });
    }

    (req as any).interviewSession = session;
    next();
  } catch (error) {
    console.error('Error validating evaluation access:', error);
    res.status(500).json({ 
      message: "Failed to validate evaluation access",
      code: "VALIDATION_ERROR" 
    });
  }
};

/**
 * Middleware to ensure user exists and create if needed (for development)
 */
export const ensureUser: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ 
        message: "User authentication required",
        code: "UNAUTHORIZED" 
      });
    }

    // Ensure user exists in database
    let user = await storage.getUser(req.user.id);
    if (!user) {
      // Create user if not exists (typically handled by auth flow)
      user = await storage.upsertUser({
        id: req.user.id,
        email: req.user.email || `user-${req.user.id}@example.com`,
        firstName: req.user.firstName || "User",
        lastName: req.user.lastName || req.user.id.substring(0, 8),
        role: req.user.role || "user"
      });
      console.log(`✅ Created new user profile: ${user.id}`);
    }

    next();
  } catch (error) {
    console.error('Error ensuring user:', error);
    res.status(500).json({ 
      message: "Failed to validate user",
      code: "USER_VALIDATION_ERROR" 
    });
  }
};

/**
 * Admin-only middleware
 */
export const requireAdmin: RequestHandler = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ 
      message: "Admin access required",
      code: "ADMIN_REQUIRED" 
    });
  }
  next();
};

// Extend Express Request type to include interview session
declare global {
  namespace Express {
    interface Request {
      interviewSession?: any;
    }
  }
}