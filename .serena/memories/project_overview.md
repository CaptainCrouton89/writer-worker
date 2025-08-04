# Project Overview

## Purpose
This is a **Node.js background worker service** that handles AI-powered story generation tasks for the Smut AI application. It polls a Supabase database for generation jobs and processes them using Google's Gemini AI model and OpenRouter.

## Architecture
The application consists of two main components:

1. **Health Check Server** (`src/server.ts`) - Express.js server on port 3951 for monitoring
2. **Background Worker** (`src/worker.ts`) - Polls database for jobs and processes them

### Core Services
- **Job Processor** (`src/job-processor-v2.ts`) - Main job processing logic with retry and error handling
- **Generation Modules** (`src/generation/`) - Specialized AI generation logic:
  - `metadata/` - Story metadata generation
  - `outline/` - Story outline creation and regeneration
  - `plot/` - Chapter and plot point generation
  - `video/` - Video generation capabilities
- **Supabase Client** (`src/lib/supabase.ts`) - Database connection and operations
- **Worker Process** (`src/worker.ts`) - Configurable concurrency with retry logic and graceful shutdown

### Job Processing Flow
1. Worker polls `generation_jobs` table for pending jobs
2. Jobs are processed with configurable concurrency (default: 2)
3. Stories are generated progressively in chapters with real-time updates
4. Failed jobs are retried with exponential backoff
5. Orphaned jobs are cleaned up on startup

## Key Database Tables
- `generation_jobs` - Main job queue with status tracking
- `chapters` - Generated story content
- `sequences` - Story collections
- `chapter_sequence_map` - Chapter-to-sequence relationships