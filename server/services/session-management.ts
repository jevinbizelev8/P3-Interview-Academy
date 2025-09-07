import { storage } from "../storage";
import type { InterviewSession } from "@shared/schema";

export class SessionManagementService {
  private static readonly SESSION_TIMEOUT_MINUTES = 30;
  private static readonly ABANDONED_SESSION_HOURS = 24;
  private static readonly CLEANUP_INTERVAL_MINUTES = 15;

  /**
   * Initialize session management service with periodic cleanup
   */
  static initialize() {
    // Run cleanup every 15 minutes
    setInterval(() => {
      this.cleanupAbandonedSessions().catch(error => {
        console.error('Error in session cleanup:', error);
      });
    }, this.CLEANUP_INTERVAL_MINUTES * 60 * 1000);

    console.log('📋 Session management service initialized');
  }

  /**
   * Clean up abandoned and timed-out sessions
   */
  static async cleanupAbandonedSessions(): Promise<void> {
    try {
      const cutoffTime = new Date(Date.now() - this.ABANDONED_SESSION_HOURS * 60 * 60 * 1000);
      
      const cleanedCount = await storage.cleanupAbandonedSessions(cutoffTime);
      console.log(`✅ Cleaned up ${cleanedCount} abandoned sessions`);
    } catch (error) {
      console.error('Error cleaning up abandoned sessions:', error);
    }
  }

  /**
   * Check if a session is still active (not timed out)
   */
  static isSessionActive(session: InterviewSession): boolean {
    if (session.status === 'completed') {
      return true; // Completed sessions don't timeout
    }

    const lastActivity = session.autoSavedAt || session.startedAt;
    if (!lastActivity) {
      return false;
    }

    const timeoutTime = new Date(lastActivity.getTime() + this.SESSION_TIMEOUT_MINUTES * 60 * 1000);
    return new Date() < timeoutTime;
  }

  /**
   * Get session status with timeout information
   */
  static getSessionStatus(session: InterviewSession): {
    status: 'active' | 'timeout' | 'completed' | 'expired';
    timeRemaining?: number; // minutes
    message: string;
  } {
    if (session.status === 'completed') {
      return {
        status: 'completed',
        message: 'Session completed'
      };
    }

    const lastActivity = session.autoSavedAt || session.startedAt;
    if (!lastActivity) {
      return {
        status: 'expired',
        message: 'Session data unavailable'
      };
    }

    const timeoutTime = new Date(lastActivity.getTime() + this.SESSION_TIMEOUT_MINUTES * 60 * 1000);
    const now = new Date();

    if (now > timeoutTime) {
      return {
        status: 'timeout',
        message: 'Session timed out due to inactivity'
      };
    }

    const timeRemaining = Math.ceil((timeoutTime.getTime() - now.getTime()) / (1000 * 60));
    
    return {
      status: 'active',
      timeRemaining,
      message: `Session active - ${timeRemaining} minutes remaining`
    };
  }

  /**
   * Extend session timeout by updating auto-save timestamp
   */
  static async extendSession(sessionId: string, userId: string): Promise<void> {
    try {
      // Update the auto-save timestamp to extend the session
      await storage.updateInterviewSession(sessionId, {
        autoSavedAt: new Date()
      });
      
      console.log(`⏰ Extended session ${sessionId} for user ${userId}`);
    } catch (error) {
      console.error('Error extending session:', error);
      throw error;
    }
  }

  /**
   * Archive old completed sessions to keep the database clean
   */
  static async archiveOldCompletedSessions(olderThanDays = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      
      const archivedCount = await storage.archiveOldCompletedSessions(cutoffDate);
      console.log(`📦 Archived ${archivedCount} old completed sessions`);
      return archivedCount;
    } catch (error) {
      console.error('Error archiving old sessions:', error);
      return 0;
    }
  }

  /**
   * Get user session statistics
   */
  static async getUserSessionStats(userId: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    abandonedSessions: number;
    averageSessionDuration: number; // minutes
  }> {
    try {
      const sessions = await storage.getUserInterviewSessions(userId);
      
      let activeSessions = 0;
      let completedSessions = 0;
      let abandonedSessions = 0;
      let totalDuration = 0;
      let sessionsWithDuration = 0;

      for (const session of sessions) {
        if (session.status === 'completed') {
          completedSessions++;
          if (session.duration) {
            totalDuration += session.duration;
            sessionsWithDuration++;
          }
        } else if (this.isSessionActive(session)) {
          activeSessions++;
        } else {
          abandonedSessions++;
        }
      }

      return {
        totalSessions: sessions.length,
        activeSessions,
        completedSessions,
        abandonedSessions,
        averageSessionDuration: sessionsWithDuration > 0 ? totalDuration / sessionsWithDuration : 0
      };
    } catch (error) {
      console.error('Error getting user session stats:', error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        completedSessions: 0,
        abandonedSessions: 0,
        averageSessionDuration: 0
      };
    }
  }

  /**
   * Recovery helper for interrupted sessions
   */
  static async recoverSession(sessionId: string, userId: string): Promise<{
    canRecover: boolean;
    session?: InterviewSession;
    message: string;
  }> {
    try {
      const session = await storage.getInterviewSession(sessionId);
      
      if (!session || session.userId !== userId) {
        return {
          canRecover: false,
          message: 'Session not found or access denied'
        };
      }

      if (session.status === 'completed') {
        return {
          canRecover: false,
          session,
          message: 'Session already completed'
        };
      }

      const sessionStatus = this.getSessionStatus(session);
      
      if (sessionStatus.status === 'timeout' || sessionStatus.status === 'expired') {
        return {
          canRecover: false,
          session,
          message: 'Session has expired and cannot be recovered'
        };
      }

      // Extend the session to give user more time
      await this.extendSession(sessionId, userId);
      
      return {
        canRecover: true,
        session,
        message: `Session recovered - ${sessionStatus.timeRemaining} minutes remaining`
      };
    } catch (error) {
      console.error('Error recovering session:', error);
      return {
        canRecover: false,
        message: 'Error recovering session'
      };
    }
  }
}