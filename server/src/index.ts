/**
 * Backend Gemini Proxy Server
 *
 * This server provides authenticated access to Gemini API calls.
 * All requests must include a valid Clerk session token.
 * The Gemini API key is stored server-side only.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { geminiRouter } from './routes/gemini';
import { requestLogger, logStartup } from './middleware/logger';

// Load environment variables from .env.local (for local dev)
dotenv.config({ path: '.env.local' });
dotenv.config(); // Also try .env

const app = express();
const PORT = process.env.PORT || 4000;

// Validate required environment variables
if (!process.env.GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY environment variable is required');
  console.error('Please set GEMINI_API_KEY in your .env.local file');
  process.exit(1);
}

if (!process.env.CLERK_SECRET_KEY) {
  console.error('ERROR: CLERK_SECRET_KEY environment variable is required');
  console.error('Please set CLERK_SECRET_KEY in your .env.local file');
  process.exit(1);
}

// Build allowed origins for CORS
const getAllowedOrigins = (): string | string[] => {
  const frontendUrl = process.env.FRONTEND_URL;
  const isDev = process.env.NODE_ENV !== 'production';

  if (frontendUrl && isDev) {
    // In dev, allow both configured URL and localhost
    return [frontendUrl, 'http://localhost:5173'];
  }

  // Production: use configured URL or default to localhost
  return frontendUrl || 'http://localhost:5173';
};

// CORS configuration
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true,
}));

// Increase payload limit for image data (base64 images can be large)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint (no logging for health checks)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Request logging for Gemini routes
app.use('/api/gemini', requestLogger);

// Gemini API routes (all require authentication)
app.use('/api/gemini', geminiRouter);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  logStartup(PORT);
});
