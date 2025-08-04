# Codebase Structure

## Root Level
- `package.json` - Dependencies and npm scripts
- `tsconfig.json` - TypeScript configuration
- `CLAUDE.md` - Project documentation and instructions
- `pnpm-lock.yaml` - Package lock file
- `.gitignore` - Git ignore rules

## Source Code (`src/`)

### Entry Points
- `index.ts` - Main application entry point, starts both server and worker
- `server.ts` - Express.js health check server (port 3951)
- `worker.ts` - Background job processing worker

### Core Services (`src/services/`)
- `sequence-service.ts` - Sequence management
- `outline-processor.ts` - Outline processing logic
- `job-retry-service.ts` - Job retry mechanisms

### Job Processing
- `job-processor-v2.ts` - Main job processing logic with retry and error handling

### AI Generation (`src/generation/`)
- `metadata/metadata.ts` - Story metadata generation
- `outline/` - Story outline creation and regeneration
  - `newOutline.ts` - Create new story outlines
  - `regenerateOutline.ts` - Regenerate existing outlines
  - `types.ts` - Outline-specific types
- `plot/` - Chapter and plot point generation
  - `chapter.ts` - Chapter generation logic
  - `plotPoint.ts` - Individual plot point generation
- `video/` - Video generation capabilities
  - `videoGenerator.ts` - Main video generation
  - `promptEnhancer.ts` - Enhance prompts for video
  - `promptSanitizer.ts` - Sanitize prompts

### Library Code (`src/lib/`)
- `types/` - Type definitions
  - `types.ts` - Core application types
  - `generation.ts` - Generation-specific types
- `constants/` - Configuration constants
  - `generation.ts` - Story length and generation configs
  - `status.ts` - Status constants
- `supabase/` - Database integration
  - `supabase.ts` - Supabase client setup
  - `types.ts` - Generated database types (do not edit manually)
- `actions/` - Database actions
  - `chapter.ts` - Chapter-related database operations
- `utils/` - Utility functions
- `embedding.ts` - Text embedding utilities

## External Directories
- `docs/` - Documentation files
- `supabase/` - Supabase configuration and migrations
- `scripts/` - Utility scripts (e.g., extract-tables.js)
- `.serena/` - Serena configuration
- `.claude/` - Claude Code configuration

## Key Configuration Files
- Story generation configuration in `src/lib/constants/generation.ts`
- Database types auto-generated in `src/lib/supabase/types.ts`
- Worker configuration in `src/worker.ts`