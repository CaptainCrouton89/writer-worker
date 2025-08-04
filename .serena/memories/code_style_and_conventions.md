# Code Style and Conventions

## TypeScript Style
- **Strict Mode**: TypeScript strict mode is enabled
- **Type Safety**: Strong typing is enforced, minimal use of `any`
- **Module System**: CommonJS modules
- **File Extensions**: `.ts` for TypeScript files, imports use `.js` extensions

## Naming Conventions
- **Files**: kebab-case for file names (e.g., `job-processor-v2.ts`, `plot-point.ts`)
- **Functions**: camelCase for function names (e.g., `generatePlotPoint`, `startWorker`)
- **Constants**: SCREAMING_SNAKE_CASE for constants (e.g., `STORY_LENGTH_CONFIG`)
- **Types/Interfaces**: PascalCase (e.g., `UserPrompt`, `GenerationJob`)

## Code Organization
- **Services**: Business logic in `src/services/`
- **Generation Logic**: AI generation modules in `src/generation/`
- **Types**: Type definitions in `src/lib/types/`
- **Constants**: Configuration constants in `src/lib/constants/`
- **Utilities**: Helper functions in `src/lib/utils/`

## Error Handling Philosophy
As documented in CLAUDE.md:
- **No Defensive Null Checking**: Don't add null checks or default values to mask missing required data
- **Fail Fast**: If required properties are null/undefined, let the error bubble up
- **Data Integrity**: Missing required fields should cause failures, not be silently handled

## Logging Style
- Extensive use of emoji in console logs for visual clarity
- Structured logging with context (e.g., attempt numbers, error details)
- Debug information includes model details, prompt lengths, etc.

## Database Guidelines
- **SQL Changes**: Use the SQL tool to execute SQL directly on the database (not migrations)
- Pull types locally after database changes with `npm run db:types`
- Fully qualify column names in complex SQL queries to avoid ambiguity
- Generated types file (`src/lib/supabase/types.ts`) should not be edited manually

## Import Style
- External packages imported first
- Internal imports using relative paths
- Type imports clearly separated when needed