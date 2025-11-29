/**
 * Structured Request Logging Middleware
 *
 * Logs request metadata for Gemini API calls without exposing sensitive data.
 * Environment-aware: pretty logs in development, JSON in production.
 */

import { Request, Response, NextFunction } from 'express';

interface LogEntry {
  timestamp: string;
  method: string;
  path: string;
  userId?: string;
  statusCode: number;
  latencyMs: number;
  contentLength?: number;
}

/**
 * Format a log entry based on environment
 */
function formatLog(entry: LogEntry): string {
  if (process.env.NODE_ENV === 'production') {
    // JSON format for production (log aggregators)
    return JSON.stringify(entry);
  }

  // Pretty format for development
  const status = entry.statusCode >= 400 ? `\x1b[31m${entry.statusCode}\x1b[0m` : `\x1b[32m${entry.statusCode}\x1b[0m`;
  const user = entry.userId ? `[${entry.userId.slice(0, 8)}...]` : '[anon]';
  return `${entry.timestamp} ${entry.method} ${entry.path} ${status} ${entry.latencyMs}ms ${user}`;
}

/**
 * Request logging middleware
 *
 * Captures:
 * - Timestamp
 * - HTTP method
 * - Request path
 * - User ID (truncated for privacy in dev logs)
 * - Response status code
 * - Request latency in milliseconds
 *
 * Does NOT log:
 * - Request bodies (may contain images/base64)
 * - Authorization headers
 * - API keys
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  // Capture original end method to intercept response completion
  const originalEnd = res.end.bind(res);

  // Override res.end to log after response is sent
  // Using type assertion due to complex overload signatures
  (res.end as Function) = function (
    chunk?: unknown,
    encodingOrCb?: BufferEncoding | (() => void),
    cb?: () => void
  ): Response {
    const latencyMs = Date.now() - startTime;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      userId: req.userId,
      statusCode: res.statusCode,
      latencyMs,
    };

    // Add content length if available
    const contentLength = res.getHeader('content-length');
    if (contentLength) {
      entry.contentLength = typeof contentLength === 'string'
        ? parseInt(contentLength, 10)
        : contentLength as number;
    }

    // Log the entry
    console.log(formatLog(entry));

    // Call original end with proper arguments
    // Type assertion needed due to complex overloads
    if (typeof encodingOrCb === 'function') {
      return (originalEnd as Function)(chunk, encodingOrCb);
    }
    return (originalEnd as Function)(chunk, encodingOrCb, cb);
  };

  next();
}

/**
 * Log application startup info
 */
export function logStartup(port: number | string): void {
  const info = {
    timestamp: new Date().toISOString(),
    event: 'server_start',
    port,
    nodeEnv: process.env.NODE_ENV || 'development',
    rateLimitWindow: process.env.GEMINI_RATE_LIMIT_WINDOW_MS || '60000',
    rateLimitMax: process.env.GEMINI_RATE_LIMIT_MAX_REQUESTS || '60',
  };

  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(info));
  } else {
    console.log(`\n🚀 Gemini proxy server started`);
    console.log(`   Port: ${port}`);
    console.log(`   Environment: ${info.nodeEnv}`);
    console.log(`   Rate limit: ${info.rateLimitMax} requests per ${parseInt(info.rateLimitWindow, 10) / 1000}s`);
    console.log(`   Health check: http://localhost:${port}/api/health`);
    console.log(`   Gemini routes: http://localhost:${port}/api/gemini/*\n`);
  }
}
