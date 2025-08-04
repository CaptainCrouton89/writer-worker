# Suggested Commands

## Development Commands
- `npm run dev` - Start development server with hot reload (uses tsx watch)
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run production build from dist/

## Database Commands
- `npm run db:pull` - Pull latest schema from Supabase
- `npm run db:types` - Generate TypeScript types from Supabase schema
- **SQL Changes**: Use the SQL tool to execute SQL directly on the database (not migrations)

## Health & Monitoring
- `npm run health` - Check application health status (curl http://localhost:3951/health)

## Testing
- **Note**: No test framework is currently configured - tests need to be set up if required
- Current test script just returns an error message

## System Commands (macOS/Darwin)
- `ls` - List directory contents
- `find` - Search for files and directories
- `grep` - Search text patterns
- `git` - Version control operations
- `curl` - HTTP requests (used for health checks)

## Environment Variables Required
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google AI API key
- `OPENROUTER_API_KEY` - OpenRouter API key (optional fallback)
- `REPLICATE_API_TOKEN` - Replicate API token (for video generation)

## Optional Configuration
- `POLL_INTERVAL_MS` (default: 5000) - Job polling frequency
- `MAX_RETRIES` (default: 2) - Job retry attempts
- `WORKER_CONCURRENCY` (default: 2) - Concurrent job processing
- `PORT` (default: 3951) - Health check server port
- `NODE_ENV` - Environment (development/production)