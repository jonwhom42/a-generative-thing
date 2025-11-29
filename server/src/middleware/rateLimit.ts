/**
 * Per-User Rate Limiting Middleware
 *
 * Limits the number of requests a user can make to Gemini endpoints
 * within a configurable time window. Uses an in-memory store.
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limit tracking
// Key: userId, Value: { count, resetAt }
const userRequestCounts = new Map<string, RateLimitEntry>();

// Configuration from environment with defaults
const WINDOW_MS = parseInt(process.env.GEMINI_RATE_LIMIT_WINDOW_MS || '60000', 10);
const MAX_REQUESTS = parseInt(process.env.GEMINI_RATE_LIMIT_MAX_REQUESTS || '60', 10);

// Cleanup interval to prevent memory leaks (run every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// Periodically clean up expired entries
setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of userRequestCounts.entries()) {
    if (now > entry.resetAt) {
      userRequestCounts.delete(userId);
    }
  }
}, CLEANUP_INTERVAL_MS);

/**
 * Rate limiting middleware for Gemini routes
 *
 * Must be applied AFTER requireAuth middleware (needs req.userId)
 *
 * Returns 429 Too Many Requests with:
 * - JSON body: { error: "Rate limit exceeded", retryAfterMs: <ms> }
 * - Retry-After header (in seconds)
 */
export function rateLimitGemini(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userId = req.userId;

  // If no userId (shouldn't happen after requireAuth), skip rate limiting
  if (!userId) {
    next();
    return;
  }

  const now = Date.now();
  const entry = userRequestCounts.get(userId);

  // First request or window expired - start fresh
  if (!entry || now > entry.resetAt) {
    userRequestCounts.set(userId, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    next();
    return;
  }

  // Check if limit exceeded
  if (entry.count >= MAX_REQUESTS) {
    const retryAfterMs = entry.resetAt - now;
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

    res.setHeader('Retry-After', retryAfterSeconds.toString());
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfterMs,
    });
    return;
  }

  // Increment count and proceed
  entry.count++;
  next();
}

/**
 * Get current rate limit status for a user (useful for debugging/monitoring)
 */
export function getRateLimitStatus(userId: string): {
  count: number;
  maxRequests: number;
  windowMs: number;
  resetAt: number | null;
} {
  const entry = userRequestCounts.get(userId);
  return {
    count: entry?.count || 0,
    maxRequests: MAX_REQUESTS,
    windowMs: WINDOW_MS,
    resetAt: entry?.resetAt || null,
  };
}
