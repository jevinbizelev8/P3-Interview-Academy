import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit-service';

/**
 * Middleware to log admin actions
 *
 * Usage:
 *   router.post("/endpoint", requireAdmin, auditLog("ACTION_NAME"), handler);
 *   router.post("/endpoint", requireAdmin, auditLog("ACTION_NAME", (req) => req.body.targetId), handler);
 *
 * @param action - The action name (e.g., "ADD_CREDITS", "BULK_USER_ACTION")
 * @param extractTarget - Optional function to extract target user ID from request
 */
export function auditLog(
  action: string,
  extractTarget?: (req: Request) => string | undefined
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);

    // Override res.json to log after successful operations
    res.json = function (body: any) {
      // Log only on successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const metadata = AuditService.extractRequestMetadata(req);

        // Extract target user ID
        const targetUserId = extractTarget
          ? extractTarget(req)
          : req.params.id || req.params.userId;

        // Log the action (non-blocking) - only if user is authenticated
        if (req.user?.id) {
          AuditService.log({
            adminId: req.user.id,
            action,
            targetUserId,
            details: {
              method: req.method,
              url: req.url,
              body: sanitizeBody(req.body),
              response: sanitizeResponse(body),
              statusCode: res.statusCode,
            },
            ...metadata,
          }).catch((error) => {
            console.error('[AUDIT] Error logging action:', error);
          });
        }
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Sanitize request body to remove sensitive fields
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const { password, passwordHash, token, ...rest } = body;
  return rest;
}

/**
 * Sanitize response to limit size in logs
 */
function sanitizeResponse(response: any): any {
  if (!response) {
    return response;
  }

  // If response is a string, truncate
  if (typeof response === 'string') {
    return response.slice(0, 500);
  }

  // If response is an object, create a summary
  if (typeof response === 'object') {
    const summary: any = {
      success: response.success,
      message: response.message,
    };

    // Include data summary if present
    if (response.data) {
      if (Array.isArray(response.data)) {
        summary.dataCount = response.data.length;
      } else if (typeof response.data === 'object') {
        summary.dataKeys = Object.keys(response.data);
      }
    }

    return summary;
  }

  return response;
}
