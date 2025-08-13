/**
 * Comprehensive Error Logging and Fallback Reporting System
 * For P³ Interview Academy SeaLion Integration
 */

interface ErrorLog {
  timestamp: Date;
  component: string;
  operation: string;
  errorType: string;
  message: string;
  fallbackUsed: boolean;
  context?: any;
  userId?: string;
  sessionId?: string;
}

interface FallbackReport {
  totalErrors: number;
  fallbackSuccessRate: number;
  mostCommonErrors: { error: string; count: number }[];
  componentStatus: { [component: string]: 'healthy' | 'degraded' | 'failing' };
  recommendations: string[];
}

class ErrorLogger {
  private errors: ErrorLog[] = [];
  private readonly maxErrors = 1000; // Keep last 1000 errors

  /**
   * Log an error with comprehensive context
   */
  logError(
    component: string,
    operation: string,
    error: any,
    fallbackUsed: boolean = false,
    context?: any,
    userId?: string,
    sessionId?: string
  ): void {
    const errorLog: ErrorLog = {
      timestamp: new Date(),
      component,
      operation,
      errorType: error?.name || error?.constructor?.name || 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
      fallbackUsed,
      context,
      userId,
      sessionId
    };

    this.errors.push(errorLog);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Console log for immediate visibility
    console.error(`[${component}] ${operation} failed:`, {
      error: errorLog.message,
      fallbackUsed,
      timestamp: errorLog.timestamp.toISOString(),
      ...(context && { context }),
      ...(sessionId && { sessionId })
    });
  }

  /**
   * Log successful fallback usage
   */
  logFallbackSuccess(
    component: string,
    operation: string,
    context?: any,
    userId?: string,
    sessionId?: string
  ): void {
    console.log(`[${component}] Fallback successful for ${operation}:`, {
      timestamp: new Date().toISOString(),
      ...(context && { context }),
      ...(sessionId && { sessionId })
    });
  }

  /**
   * Generate comprehensive fallback report
   */
  generateFallbackReport(): FallbackReport {
    const recentErrors = this.errors.filter(
      error => Date.now() - error.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    const totalErrors = recentErrors.length;
    const fallbacksUsed = recentErrors.filter(error => error.fallbackUsed).length;
    const fallbackSuccessRate = totalErrors > 0 ? (fallbacksUsed / totalErrors) * 100 : 100;

    // Count error types
    const errorCounts = recentErrors.reduce((acc, error) => {
      const key = `${error.component}.${error.operation}: ${error.errorType}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));

    // Analyze component health
    const componentHealth = this.analyzeComponentHealth(recentErrors);

    // Generate recommendations
    const recommendations = this.generateRecommendations(recentErrors, fallbackSuccessRate);

    return {
      totalErrors,
      fallbackSuccessRate,
      mostCommonErrors,
      componentStatus: componentHealth,
      recommendations
    };
  }

  /**
   * Analyze health status of each component
   */
  private analyzeComponentHealth(errors: ErrorLog[]): { [component: string]: 'healthy' | 'degraded' | 'failing' } {
    const componentErrors = errors.reduce((acc, error) => {
      acc[error.component] = (acc[error.component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const result: { [component: string]: 'healthy' | 'degraded' | 'failing' } = {};

    // Define components
    const knownComponents = ['SeaLion', 'Authentication', 'Database', 'FileSystem', 'API'];
    
    knownComponents.forEach(component => {
      const errorCount = componentErrors[component] || 0;
      if (errorCount === 0) {
        result[component] = 'healthy';
      } else if (errorCount <= 5) {
        result[component] = 'degraded';
      } else {
        result[component] = 'failing';
      }
    });

    return result;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(errors: ErrorLog[], fallbackSuccessRate: number): string[] {
    const recommendations: string[] = [];

    // Check API key issues
    const authErrors = errors.filter(error => 
      error.message.toLowerCase().includes('api key') || 
      error.message.toLowerCase().includes('authentication') ||
      error.message.toLowerCase().includes('401')
    );

    if (authErrors.length > 0) {
      recommendations.push('🔑 API Key Issue: Verify SEALION_API_KEY is correctly configured');
      recommendations.push('🔧 Check API key format matches SeaLion requirements (not OpenAI format)');
    }

    // Check fallback performance
    if (fallbackSuccessRate < 90) {
      recommendations.push('⚠️ Low fallback success rate - review fallback logic implementation');
    } else if (fallbackSuccessRate > 95) {
      recommendations.push('✅ Excellent fallback system performance');
    }

    // Check for specific error patterns
    const typeErrors = errors.filter(error => error.message.includes('Type') || error.message.includes('type'));
    if (typeErrors.length > 3) {
      recommendations.push('🔧 Multiple TypeScript type errors detected - review type definitions');
    }

    const networkErrors = errors.filter(error => 
      error.message.includes('network') || 
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED')
    );
    if (networkErrors.length > 2) {
      recommendations.push('🌐 Network connectivity issues detected - check internet connection');
    }

    // Performance recommendations
    if (errors.length > 50) {
      recommendations.push('📊 High error volume - consider implementing circuit breaker pattern');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ System appears stable - continue monitoring');
    }

    return recommendations;
  }

  /**
   * Get error statistics for specific component
   */
  getComponentStats(component: string): {
    totalErrors: number;
    recentErrors: number;
    fallbackRate: number;
    lastError?: ErrorLog;
  } {
    const componentErrors = this.errors.filter(error => error.component === component);
    const recentErrors = componentErrors.filter(
      error => Date.now() - error.timestamp.getTime() < 60 * 60 * 1000 // Last hour
    );

    const fallbacksUsed = componentErrors.filter(error => error.fallbackUsed).length;
    const fallbackRate = componentErrors.length > 0 ? (fallbacksUsed / componentErrors.length) * 100 : 0;

    return {
      totalErrors: componentErrors.length,
      recentErrors: recentErrors.length,
      fallbackRate,
      lastError: componentErrors[componentErrors.length - 1]
    };
  }

  /**
   * Clear old errors (cleanup)
   */
  clearOldErrors(olderThanHours: number = 48): number {
    const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000);
    const initialCount = this.errors.length;
    this.errors = this.errors.filter(error => error.timestamp.getTime() > cutoff);
    return initialCount - this.errors.length;
  }

  /**
   * Export errors for analysis
   */
  exportErrors(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = 'timestamp,component,operation,errorType,message,fallbackUsed,userId,sessionId';
      const rows = this.errors.map(error => 
        `${error.timestamp.toISOString()},${error.component},${error.operation},${error.errorType},"${error.message.replace(/"/g, '""')}",${error.fallbackUsed},${error.userId || ''},${error.sessionId || ''}`
      );
      return [headers, ...rows].join('\n');
    }
    return JSON.stringify(this.errors, null, 2);
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

// Convenience functions for common error types
export const logSeaLionError = (operation: string, error: any, fallbackUsed: boolean = false, context?: any, sessionId?: string) => {
  errorLogger.logError('SeaLion', operation, error, fallbackUsed, context, undefined, sessionId);
};

export const logAuthError = (operation: string, error: any, userId?: string) => {
  errorLogger.logError('Authentication', operation, error, false, undefined, userId);
};

export const logDatabaseError = (operation: string, error: any, context?: any) => {
  errorLogger.logError('Database', operation, error, false, context);
};

export const logAPIError = (operation: string, error: any, fallbackUsed: boolean = false, context?: any) => {
  errorLogger.logError('API', operation, error, fallbackUsed, context);
};

export default errorLogger;