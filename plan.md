# Smut Writer Worker App Implementation Plan

This document outlines how to build the external worker app that handles long-running story generation tasks.

## Project Overview

The worker app is a Node.js service that:

- Polls the Supabase database for generation jobs
- Processes story generation using the existing generation logic
- Updates chapter content progressively as bullets are generated
- Provides health check endpoints for deployment monitoring

## Project Setup

### 1. Initialize New Repository

```bash
mkdir smut-writer-worker
cd smut-writer-worker
npm init -y
```

### 2. Install Dependencies

```bash
npm install --save ai @ai-sdk/google dotenv express cors helmet
npm install --save-dev @types/node @types/express tsx typescript nodemon
```

### 3. Project Structure

```
smut-writer-worker/
├── src/
│   ├── lib/
│   │   ├── generation-service.ts    # Core generation logic
│   │   ├── supabase.ts             # Database client
│   │   ├── embeddings.ts           # Embedding utilities
│   │   └── types.ts                # TypeScript types
│   ├── worker.ts                   # Main worker loop
│   ├── server.ts                   # Express health check server
│   └── index.ts                    # Entry point
├── package.json
├── tsconfig.json
├── .env
├── .gitignore
└── README.md
```

## Files to Copy from Main Codebase

### Core Files (Copy Exactly)

1. **src/lib/generation-service.ts** - All generation functions
2. **src/lib/embeddings.ts** - Embedding generation utilities
3. **package.json** - Copy AI SDK dependencies

### Types and Schema (Copy & Adapt)

1. **src/lib/supabase/types.ts** - Database types
2. **supabase/migrations/** - Reference for database schema

### Configuration Files

1. **.env.example** - Environment variables template
2. **CLAUDE.md** - Project context (portions relevant to generation)

## Core Implementation

### 1. Database Client (src/lib/supabase.ts)

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
```

### 2. Worker Logic (src/worker.ts)

Key functions to implement:

**Job Polling:**

```typescript
async function pollForJobs() {
  // Query generation_jobs where status = 'pending'
  // Order by created_at ASC
  // Limit 1 (process one job at a time)
}
```

**Job Processing:**

```typescript
async function processGenerationJob(job: GenerationJob) {
  // 1. Update status to 'processing'
  // 2. Call existing generation functions from generation-service.ts
  // 3. Update chapter content progressively
  // 4. Update progress percentage
  // 5. Handle errors and retries
  // 6. Mark as 'completed' or 'failed'
}
```

**Progressive Updates:**

```typescript
async function updateChapterContent(
  chapterId: string,
  newContent: string,
  progress: number
) {
  // Update chapters table with new content
  // Update generation_jobs progress
  // Supabase Realtime will notify the UI automatically
}
```

### 3. Health Check Server (src/server.ts)

```typescript
import express from "express";

const app = express();
const PORT = process.env.PORT || 3951;

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.listen(PORT, () => {
  console.log(`Health server running on port ${PORT}`);
});
```

### 4. Main Entry Point (src/index.ts)

```typescript
import { startWorker } from "./worker";
import "./server"; // Start health check server

async function main() {
  console.log("🚀 Starting Smut Writer Worker...");

  // Start the worker loop
  await startWorker();
}

main().catch(console.error);
```

## Environment Variables

Create `.env` file:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Configuration
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Worker Configuration
POLL_INTERVAL_MS=5000
MAX_RETRIES=3
WORKER_CONCURRENCY=1

# Server Configuration
PORT=3951
NODE_ENV=production
```

## Database Schema Requirements

The worker expects this table to exist in Supabase:

```sql
CREATE TABLE generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES sequences(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_preferences JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  current_step TEXT,
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX idx_generation_jobs_created_at ON generation_jobs(created_at);
```

## Worker Algorithm

### Main Loop

1. **Poll Database** every 5 seconds for pending jobs
2. **Lock Job** by updating status to 'processing'
3. **Generate Story** using existing generation-service.ts functions
4. **Update Progress** after each bullet point generation
5. **Handle Errors** with retry logic
6. **Complete Job** and move to next

### Error Handling

- **Retry failed jobs** up to 3 times
- **Log all errors** for debugging
- **Update job status** to 'failed' after max retries
- **Continue processing** other jobs if one fails

### Progressive Updates

- Update chapter content after each bullet point
- Set progress: outline=10%, bullet1=30%, bullet2=50%, etc.
- Use Supabase's automatic realtime notifications

## Deployment Options

### Railway (Recommended)

1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically on git push
4. Monitor logs and health checks

### DigitalOcean App Platform

1. Create new app from GitHub
2. Configure build and run commands
3. Set environment variables
4. Deploy and monitor

### Fly.io

1. Install flyctl CLI
2. Run `fly launch` in project directory
3. Configure fly.toml
4. Deploy with `fly deploy`

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "health": "curl http://localhost:3951/health"
  }
}
```

## Monitoring & Debugging

### Logs to Implement

- Job started/completed
- Generation progress updates
- Error messages with stack traces
- Performance metrics (generation time per bullet)

### Health Checks

- Database connectivity
- API key validity
- Memory usage
- Active job status

## Security Considerations

1. **Use Service Role Key** for database access (not anon key)
2. **Validate job ownership** before processing
3. **Rate limit AI API calls** to avoid quota issues
4. **Sanitize user preferences** before processing
5. **Use environment variables** for all secrets

## Testing Strategy

### Local Development

1. Set up local environment with test database
2. Create test generation jobs manually
3. Run worker and verify processing
4. Test error scenarios and retries

### Production Testing

1. Deploy to staging environment first
2. Create test generation job from main app
3. Verify real-time updates work end-to-end
4. Monitor performance and error rates

This plan provides everything needed to build a robust, scalable worker service that handles the story generation workload efficiently.
