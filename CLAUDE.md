# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Node.js background worker service** that handles AI-powered story generation tasks for the Smut AI application. It polls a Supabase database for generation jobs and processes them using Google's Gemini AI model.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run production build
- `npm run health` - Check application health status
- `npm run db:pull` - Pull latest schema from Supabase
- `npm run db:types` - Generate TypeScript types from Supabase schema

**Note**: No test framework is currently configured - tests need to be set up if required.

## Architecture

The application consists of two main components:

1. **Health Check Server** (`src/server.ts`) - Express.js server on port 3951 for monitoring
2. **Background Worker** (`src/worker.ts`) - Polls database for jobs and processes them

### Core Services

- **Job Processor** (`src/job-processor.ts`) - Main job processing logic with retry and error handling
- **Generation Modules** (`src/generation/`) - Specialized AI generation logic:
  - `metadata/` - Story metadata generation
  - `outline/` - Story outline creation and regeneration  
  - `plot/` - Chapter and plot point generation
- **Supabase Client** (`src/lib/supabase.ts`) - Database connection and operations
- **Worker Process** (`src/worker.ts`) - Configurable concurrency with retry logic and graceful shutdown

### Job Processing Flow

1. Worker polls `generation_jobs` table for pending jobs
2. Jobs are processed with configurable concurrency (default: 2)
3. Stories are generated progressively in chapters with real-time updates
4. Failed jobs are retried with exponential backoff
5. Orphaned jobs are cleaned up on startup

## Database Guidelines

- After making changes to the database, push the migration and pull the new types
- All supabase stuff should be done on the remote db. Push changes there
- **Database Migrations**: Always use `supabase migration new <name>` to create migrations, then `supabase db push` to apply to remote. For complex migrations, create multiple smaller migrations
- **SQL Function Debugging**: When creating complex SQL functions with JOINs, be careful of ambiguous column references - fully qualify columns (e.g., `s.id`, `c.id as chapter_id`) to avoid PostgreSQL errors
- `src/lib/supabase/types.ts` is a generated file. Do not edit it. If you need to add additional types, don't put them there

## Environment Variables

Required environment variables:

- `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY` - Database connection
- `GOOGLE_GENERATIVE_AI_API_KEY` - AI model access

Optional configuration:

- `POLL_INTERVAL_MS` (default: 5000) - Job polling frequency
- `MAX_RETRIES` (default: 2) - Job retry attempts
- `WORKER_CONCURRENCY` (default: 2) - Concurrent job processing
- `PORT` (default: 3951) - Health check server port

## Key Database Tables

- `generation_jobs` - Main job queue with status tracking
- `chapters` - Generated story content
- `sequences` - Story collections
- `chapter_sequence_map` - Chapter-to-sequence relationships

## Error Handling Philosophy

- **No Defensive Null Checking**: Don't add null checks or default values to mask missing required data
- **Fail Fast**: If required properties are null/undefined, let the error bubble up - it indicates a real problem that needs to be fixed
- **Data Integrity**: Missing required fields in database objects should cause failures, not be silently handled with defaults
