
import type { GoogleOAuthSessionState } from "../services/google-oauth";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    userEmail?: string | null;
    authProvider?: "local" | "google" | "both";
    lastLoginProvider?: "local" | "google";
    oauth?: GoogleOAuthSessionState;
  }
}
