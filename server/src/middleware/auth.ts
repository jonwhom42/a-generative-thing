/**
 * Clerk Authentication Middleware
 *
 * Validates the Clerk session token from the Authorization header.
 * Rejects requests without valid authentication.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';

// Extend Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      sessionId?: string;
    }
  }
}

/**
 * Middleware to verify Clerk authentication token
 *
 * Expects: Authorization: Bearer <session_token>
 * Sets req.userId and req.sessionId on success
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header provided' });
      return;
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    // Verify the session token with Clerk
    const sessionClaims = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    if (!sessionClaims || !sessionClaims.sub) {
      res.status(401).json({ error: 'Invalid session token' });
      return;
    }

    // Attach user info to request
    req.userId = sessionClaims.sub;
    req.sessionId = sessionClaims.sid as string | undefined;

    // Log authenticated request (for debugging)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Authenticated request from user: ${req.userId}`);
    }

    next();
  } catch (error) {
    console.error('Auth verification failed:', error);

    // Handle specific Clerk errors
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        res.status(401).json({ error: 'Session token expired' });
        return;
      }
      if (error.message.includes('invalid')) {
        res.status(401).json({ error: 'Invalid session token' });
        return;
      }
    }

    res.status(401).json({ error: 'Authentication failed' });
  }
}

// Note: Per-user rate limiting is implemented in ./rateLimit.ts
