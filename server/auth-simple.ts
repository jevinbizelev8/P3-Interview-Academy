import bcrypt from "bcryptjs";
import session from "express-session";
import crypto from "crypto";
import type { Express, RequestHandler } from "express";
import { createSessionStore } from "./session-store";
import { storage } from "./storage";
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from "./services/email-service";

export function getSession() {
  const sessionTtlMs = 7 * 24 * 60 * 60 * 1000; // 1 week
  const sessionStore = createSessionStore({
    ttl: Math.floor(sessionTtlMs / 1000),
  });

  // Let Express inspect X-Forwarded-Proto and auto-set secure cookies when appropriate
  const secureCookie = process.env.FORCE_HTTPS === 'true' ? true : 'auto';
  const sameSite = secureCookie === true ? 'none' : 'lax';

  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    name: 'connect.sid',
    rolling: true, // Reset expiration on each request for active users
    cookie: {
      httpOnly: true, // Prevent XSS attacks
      secure: secureCookie,
      maxAge: sessionTtlMs, // 7 days but resets with rolling
      sameSite,
      domain: undefined, // Let browser handle domain
    },
    // Enhanced security: clean up expired sessions
    genid: () => {
      return crypto.randomBytes(32).toString('hex');
    }
  });
}


export async function setupSimpleAuth(app: Express) {
  app.set("trust proxy", 1);
  
  // Add session middleware
  const sessionMiddleware = getSession();
  app.use(sessionMiddleware);

  // Signup endpoint
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName) {
        return res.status(400).json({ message: "Email, password, and first name are required" });
      }

      // Validate password strength (8+ characters, at least one number)
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }
      if (!/\d/.test(password)) {
        return res.status(400).json({ message: "Password must contain at least one number" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Generate email verification token (expires in 24 hours)
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create user (unverified)
      const userId = crypto.randomUUID();
      const user = await storage.upsertUser({
        id: userId,
        email,
        firstName,
        lastName: lastName || "",
        role: "user",
        passwordHash: hashedPassword,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        authProvider: "local"
      });

      // Send verification email
      try {
        await sendVerificationEmail(email, verificationToken, firstName);
        console.log(`✅ Verification email sent to: ${email}`);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }

      // Return success WITHOUT creating session
      console.log("Signup successful, verification email sent:", email);

      res.json({
        success: true,
        message: "Account created! Please check your email to verify your account.",
        requiresVerification: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    console.log("🔐 LOGIN ATTEMPT:", {
      email: req.body?.email,
      hasPassword: !!req.body?.password,
      userAgent: req.get('User-Agent'),
      origin: req.get('Origin'),
      sessionID: req.sessionID
    });
    
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        console.log("❌ LOGIN FAILED: Missing credentials");
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        console.log("❌ LOGIN FAILED: User not found or no password hash:", { email, userExists: !!user, hasPasswordHash: !!user?.passwordHash });
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        console.log("❌ LOGIN FAILED: Invalid password for user:", user.id);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check email verification
      if (!user.emailVerified) {
        console.log("❌ LOGIN FAILED: Email not verified for user:", user.id);
        return res.status(401).json({
          message: "Please verify your email before logging in",
          requiresVerification: true
        });
      }

      // Create session
      console.log("✅ LOGIN SUCCESS: Creating session for user:", {
        userId: user.id,
        email: user.email,
        sessionID: req.sessionID,
        cookieSettings: {
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
          sameSite: 'lax'
        }
      });
      
      (req.session as any).userId = user.id;
      (req.session as any).userEmail = user.email;
      
      req.session.save((err) => {
        if (err) {
          console.error("❌ SESSION SAVE ERROR:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        
        console.log("✅ SESSION SAVED:", {
          sessionID: req.sessionID,
          userId: (req.session as any).userId,
          cookieWillBeSet: true,
          sessionData: {
            userId: (req.session as any).userId,
            userEmail: (req.session as any).userEmail
          }
        });
        
        res.json({ 
          success: true, 
          user: { 
            id: user.id, 
            email: user.email, 
            firstName: user.firstName, 
            lastName: user.lastName 
          } 
        });
      });
    } catch (error) {
      console.error("❌ LOGIN ERROR:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user
  app.get("/api/auth/user", async (req, res) => {
    const authStartTime = Date.now();
    console.log("🔍 AUTH CHECK:", {
      sessionID: req.sessionID,
      cookies: req.headers.cookie,
      userAgent: req.get('User-Agent'),
      origin: req.get('Origin'),
      referer: req.get('Referer')
    });

    try {
      // Handle case where session might be undefined/null after logout
      if (!req.session) {
        console.log("❌ AUTH FAILED: No session object");
        return res.status(401).json({ message: "Unauthorized" });
      }

      const session = req.session as any;
      const sessionLoadTime = Date.now() - authStartTime;

      console.log("📋 SESSION STATE:", {
        exists: !!req.session,
        sessionID: req.sessionID,
        userId: session?.userId,
        userEmail: session?.userEmail,
        sessionKeys: session ? Object.keys(session) : 'no session',
        loadTime: `${sessionLoadTime}ms`
      });

      if (!session.userId) {
        console.log(`❌ AUTH FAILED: No userId in session (checked in ${Date.now() - authStartTime}ms)`);
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userLookupStart = Date.now();
      let user;
      try {
        user = await storage.getUser(session.userId);
      } catch (dbError) {
        console.error("❌ AUTH ERROR: Database lookup failed:", dbError);
        return res.status(401).json({ message: "Authentication failed" });
      }

      const userLookupTime = Date.now() - userLookupStart;
      if (!user) {
        console.log("❌ AUTH FAILED: User not found in database:", session.userId);
        return res.status(401).json({ message: "User not found" });
      }

      console.log("✅ AUTH SUCCESS: User authenticated:", {
        userId: user.id,
        email: user.email,
        sessionID: req.sessionID,
        totalTime: `${Date.now() - authStartTime}ms`,
        userLookupTime: `${userLookupTime}ms`
      });

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      });
    } catch (error) {
      console.error("❌ AUTH ERROR:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    console.log("🚪 LOGOUT REQUEST:", {
      sessionID: req.sessionID,
      userId: (req.session as any)?.userId
    });

    req.session.destroy((err) => {
      if (err) {
        console.error("❌ LOGOUT ERROR:", err);
        return res.status(500).json({ message: "Logout failed" });
      }

      // Clear the session cookie
      res.clearCookie('connect.sid', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === 'true',
        sameSite: 'lax'
      });

      console.log("✅ LOGOUT SUCCESS: Session destroyed");
      res.json({ success: true });
    });
  });

  // Email verification endpoint
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Verification token is required" });
      }

      const user = await storage.getUserByVerificationToken(token);

      if (!user) {
        return res.status(400).json({
          message: "Invalid or expired verification token",
          expired: true
        });
      }

      if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
        return res.status(400).json({
          message: "Verification token has expired. Please request a new one.",
          expired: true
        });
      }

      if (user.emailVerified) {
        return res.status(200).json({
          message: "Email already verified. You can now log in.",
          alreadyVerified: true
        });
      }

      await storage.upsertUser({
        id: user.id,
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      });

      try {
        await sendWelcomeEmail(user.email!, user.firstName!);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }

      (req.session as any).userId = user.id;
      (req.session as any).userEmail = user.email;

      req.session.save((err) => {
        if (err) {
          console.error("Session save error after verification:", err);
          return res.json({
            success: true,
            message: "Email verified successfully! Please log in.",
            verified: true
          });
        }

        console.log("✅ Email verified and user auto-logged in:", user.email);

        res.json({
          success: true,
          message: "Email verified successfully!",
          verified: true,
          autoLoggedIn: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          }
        });
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Resend verification email endpoint
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.json({
          success: true,
          message: "If the email is registered, a verification email has been sent"
        });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified. Please log in." });
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await storage.upsertUser({
        id: user.id,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires
      });

      try {
        await sendVerificationEmail(user.email!, verificationToken, user.firstName!);
        console.log(`✅ Verification email resent to: ${user.email}`);
      } catch (emailError) {
        console.error("Failed to resend verification email:", emailError);
        return res.status(500).json({ message: "Failed to send verification email" });
      }

      res.json({
        success: true,
        message: "Verification email has been sent. Please check your inbox."
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  });

  // Forgot password endpoint
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists for security
        return res.json({
          success: true,
          message: "If the email exists, reset instructions have been sent"
        });
      }

      // Generate password reset token (expires in 1 hour)
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Update user with reset token
      await storage.upsertUser({
        id: user.id,
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      });

      // Send password reset email
      try {
        await sendPasswordResetEmail(user.email!, resetToken, user.firstName!);
        console.log(`✅ Password reset email sent to: ${user.email}`);
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
        return res.status(500).json({ message: "Failed to send reset email" });
      }

      res.json({
        success: true,
        message: "If the email exists, reset instructions have been sent"
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Reset password endpoint
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      // Validate password strength
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }
      if (!/\d/.test(newPassword)) {
        return res.status(400).json({ message: "Password must contain at least one number" });
      }

      // Find user by reset token
      const user = await storage.getUserByPasswordResetToken(token);

      if (!user) {
        return res.status(400).json({
          message: "Invalid or expired reset token",
          expired: true
        });
      }

      // Check if token has expired
      if (user.passwordResetExpires && new Date() > user.passwordResetExpires) {
        return res.status(400).json({
          message: "Reset token has expired. Please request a new one.",
          expired: true
        });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update user password and clear reset token
      await storage.upsertUser({
        id: user.id,
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      });

      console.log(`✅ Password reset successfully for user: ${user.email}`);

      res.json({
        success: true,
        message: "Password has been reset successfully. You can now log in with your new password."
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  const session = req.session as any;
  if (!session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getUser(session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      id: user.id,
      email: user.email || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      role: user.role || "user"
    };
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
};

