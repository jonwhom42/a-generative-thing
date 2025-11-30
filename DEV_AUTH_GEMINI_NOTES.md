# Gemini Backend Proxy - Developer Notes

This document explains the authenticated Gemini proxy architecture implemented in this app.

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Browser       │────>│  Backend Proxy       │────>│  Gemini API     │
│  (React App)    │     │  (Express Server)    │     │                 │
│                 │     │                      │     │                 │
│  - No API key   │     │  - GEMINI_API_KEY    │     │                 │
│  - Clerk token  │     │  - Validates Clerk   │     │                 │
│                 │     │  - Rate limit ready  │     │                 │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
```

## Security Guarantees

1. **No Gemini API key in browser bundle** - The `GEMINI_API_KEY` is only used server-side
2. **Authentication required** - All Gemini endpoints require a valid Clerk session token
3. **Per-user rate limiting** - Configurable limits to prevent API abuse (see below)

## Running Locally

### Prerequisites

1. Copy `.env.example` to `.env.local` and fill in the values:
   ```bash
   # Frontend (public)
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx

   # Backend (secret)
   GEMINI_API_KEY=your_gemini_api_key
   CLERK_SECRET_KEY=sk_test_xxx
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development Mode

**Option 1: Single Command (Recommended)**
```bash
npm run dev:full
```
This runs both backend (port 4000) and frontend (port 5173) concurrently.

**Option 2: Separate Terminals**

Terminal 1 - Backend Server:
```bash
npm run server:dev
```

Terminal 2 - Frontend Dev Server:
```bash
npm run dev
```

The Vite dev server proxies `/api/*` requests to the backend automatically.

### Smoke Test

Verify the server is running correctly:
```bash
npm run server:smoke
```
This tests health check, CORS, and auth requirements.

### Production Build

```bash
npm run build            # Build frontend
npm run server:build     # Build backend
npm run server:start     # Run production backend
```

## Manual Testing Checklist

### Authentication Flow
- [ ] Sign up at /sign-up (if first time)
- [ ] Sign in at /sign-in
- [ ] Verify UserButton appears in top right
- [ ] Verify sign out works

### PostGenerator Flow
1. [ ] Create a project on Dashboard
2. [ ] Add an idea to the project
3. [ ] Click "Generate Content" on the idea
4. [ ] Observe loading state while generating
5. [ ] Verify A/B variants are created with:
   - [ ] Post text content
   - [ ] Generated images
   - [ ] Predicted analytics
   - [ ] Rationale text
6. [ ] Test "Regenerate Image" button
7. [ ] Test "Edit Image" functionality (mask painting)
8. [ ] Test "Generate Video" if available
9. [ ] Save post and verify it appears under the idea

### ImageEditor Flow
1. [ ] Navigate to Tools > Image Editor
2. [ ] Test "Generate Image" with a prompt
3. [ ] Test "Edit Image" with mask painting
4. [ ] Test reference image upload
5. [ ] Test video generation (Veo)
6. [ ] Test video extension

### ChatBot Flow
1. [ ] Click the chat icon in the bottom-right corner
2. [ ] Test basic conversation (e.g., "What projects do I have?")
3. [ ] Test project creation via chat (e.g., "Create a project called Test Project")
4. [ ] Test idea creation via chat (e.g., "Add an idea to [project name]")
5. [ ] Test web search capability (e.g., "Search for marketing trends 2024")
6. [ ] Verify function calls execute and update the app state
7. [ ] Test minimize/expand functionality
8. [ ] Test close and reopen chat

### Error Handling
- [ ] Verify meaningful error messages when generation fails
- [ ] Verify 401 error when session expires (sign out and try to generate)

## API Endpoints

All endpoints require `Authorization: Bearer <clerk_session_token>` header.

| Endpoint | Method | Description | Used By |
|----------|--------|-------------|---------|
| `/api/health` | GET | Health check | Monitoring |
| `/api/gemini/generate-post-content` | POST | Generate A/B post variants | PostGenerator |
| `/api/gemini/generate-image` | POST | Generate image from prompt | PostGenerator |
| `/api/gemini/edit-image` | POST | Edit image with mask | PostGenerator |
| `/api/gemini/generate-video` | POST | Generate video | PostGenerator |
| `/api/gemini/generate-image-v3` | POST | V3 image generation | ImageEditor |
| `/api/gemini/edit-image-v3` | POST | V3 image editing | ImageEditor |
| `/api/gemini/generate-video-v31` | POST | Veo 3.1 video | ImageEditor |
| `/api/gemini/extend-video-v31` | POST | Extend video | ImageEditor |
| `/api/gemini/chat` | POST | AI chat with function calling | ChatBot |

## Rate Limiting

Per-user rate limiting is enabled by default. Configure via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_RATE_LIMIT_WINDOW_MS` | `60000` | Time window in milliseconds (1 minute) |
| `GEMINI_RATE_LIMIT_MAX_REQUESTS` | `60` | Max requests per window per user |

When a user exceeds the limit:
- Response: `429 Too Many Requests`
- Body: `{ "error": "Rate limit exceeded", "retryAfterMs": <ms> }`
- Header: `Retry-After: <seconds>`

## Request Logging

All `/api/gemini/*` requests are logged with:
- Timestamp, method, path
- User ID (truncated in dev logs)
- Status code, latency (ms)

**Development mode**: Pretty-printed colored logs
**Production mode**: JSON-structured logs for aggregators

Sensitive data (request bodies, API keys, base64 payloads) is never logged.

## ChatBot Feature

The ChatBot is a floating AI assistant in the bottom-right corner with full app control capabilities.

### Features
- **App Data Access**: Reads all projects, ideas, and experiments to provide context-aware responses
- **Function Calling**: Can create, update, and delete projects, ideas, and experiments through natural language
- **Google Search Grounding**: Can search the web for market research, competitor analysis, and trends
- **Conversational UI**: Expandable/collapsible chat window with message history

### Supported Actions via Chat
| Action | Example Prompt |
|--------|----------------|
| Create project | "Create a new project called Summer Campaign" |
| Update project | "Change the stage of Summer Campaign to testing" |
| Delete project | "Delete the Test Project" |
| Create idea | "Add an idea about email marketing to Summer Campaign" |
| Update idea | "Mark the email marketing idea as ready to test" |
| Create experiment | "Create an A/B test for the email marketing idea" |
| Web search | "Search for social media trends in 2024" |

### Technical Details
- Model: `gemini-2.5-flash` with function calling and Google Search grounding
- System instruction includes current app state (projects, ideas, experiments)
- Function calls are executed client-side against StorageContext

## Known Limitations

1. **Video downloads** - Videos are downloaded server-side and sent as base64. Large videos may be slow.
2. **In-memory rate limiting** - Rate limit state is lost on server restart. For high-availability, use Redis.
3. **No caching** - Repeated identical requests will hit the Gemini API each time.

## TODOs

### Completed
- [x] Implement per-user rate limiting (`server/src/middleware/rateLimit.ts`)
- [x] Add request logging/monitoring (`server/src/middleware/logger.ts`)
- [x] Configure CORS for production domain

### Medium Priority
- [ ] Add response caching for identical requests
- [ ] Add request queue for long-running video operations
- [ ] Add WebSocket support for progress updates
- [ ] Migrate rate limiting to Redis for multi-instance deployments

### Low Priority
- [ ] Add admin endpoint to view usage stats
- [ ] Add user-specific usage tracking using `userId`

## Troubleshooting

### "Session token getter not configured"
The GeminiAuthProvider is not wrapping the component. Ensure the component is inside the `<SignedIn>` branch in App.tsx.

### "No session token available"
The user is not authenticated. Redirect to /sign-in.

### "Authentication failed" (401)
- Check CLERK_SECRET_KEY is set correctly in .env.local
- Check the session token hasn't expired
- Verify the token format in the Authorization header

### "GEMINI_API_KEY not configured"
Ensure GEMINI_API_KEY is set in .env.local (no VITE_ prefix for server-side keys).

### "Rate limit exceeded" (429)
The user has exceeded the configured rate limit. Wait for the `Retry-After` period or adjust limits via environment variables.

## Files Changed

### Backend Server Files
- `server/src/index.ts` - Express server entry point with CORS and logging
- `server/src/routes/gemini.ts` - Gemini API proxy routes
- `server/src/middleware/auth.ts` - Clerk auth middleware
- `server/src/middleware/rateLimit.ts` - Per-user rate limiting middleware
- `server/src/middleware/logger.ts` - Structured request logging
- `server/scripts/smoke-test.ts` - Server health verification script
- `server/tsconfig.json` - TypeScript config for server

### Frontend Files
- `src/context/GeminiAuthContext.tsx` - Wires Clerk auth to Gemini service
- `src/services/gemini.ts` - API calls via backend proxy
- `src/App.tsx` - GeminiAuthProvider integration, ChatBot inclusion
- `src/components/ChatBot/ChatBot.tsx` - Floating chat UI component
- `src/components/ChatBot/index.ts` - ChatBot exports

### Config Files
- `vite.config.ts` - Dev server proxy configuration
- `package.json` - Server scripts and dependencies
- `.env.example` - Environment variable documentation
