# Test Interface for Story Generation

## Overview
A comprehensive web-based testing interface that allows developers to test story generation features without affecting production data or requiring direct API calls.

## User Perspective
Developers can access a protected web interface at `/test` (authenticated with admin/ILikeSmut) to:
- Generate story outlines with custom parameters (spice level, story length, author style, writing quirks)
- Load existing sequences from the database and test plot point generation
- Generate individual plot points or entire chapters from existing story outlines
- View results in a formatted web interface with syntax highlighting

## Data Flow
1. User navigates to `/test` and authenticates with basic auth (admin/ILikeSmut)
2. For outline testing: User fills form → API call to `/test/api/generate-outline` → TestGenerationService.generateTestOutline() → AI generation → Results displayed
3. For plot point testing: User selects sequence → Load from database → Select chapter/plot point → API call to `/test/api/generate-plot-point` or `/test/api/generate-chapter` → AI generation with context → Results displayed
4. All test operations bypass normal job queue and database persistence

## Implementation

### Key Files
- `src/test-router.ts` - Express router with authentication and API endpoints
- `src/services/test-generation-service.ts` - Service class for test generation without database persistence
- `src/test-interface.html` - Web-based UI for testing story generation features
- `src/server.ts` - Mounts test router at `/test` endpoint

### API Endpoints
- `GET /test` - Serves HTML test interface
- `POST /test/api/generate-outline` - Generate outline from user prompt
- `GET /test/api/sequences` - List available sequences from database  
- `POST /test/api/generate-plot-point` - Generate single plot point for sequence
- `POST /test/api/generate-chapter` - Generate entire chapter for sequence

### Database
- Reads from existing tables: `sequences`, `chapters`, `chapter_sequence_map`
- No writes - all test generation is ephemeral
- Uses TestGenerationService to fetch context without modifying data

## Configuration
- Authentication: Hardcoded basic auth (admin/ILikeSmut)
- API Base URL: Configurable in web interface (defaults to http://localhost:3951)
- Supabase connection: Uses existing environment variables from worker service

## Usage Example
```typescript
// Generate test outline
const result = await testService.generateTestOutline({
  user_prompt: "A romantic story about...",
  story_length: 1, // Novella
  spice_level: 1,  // Moderate heat
  author_style: 2, // Colleen Hoover
  user_tags: ["romance", "contemporary"],
  writingQuirk: "Uses lots of dialogue"
});

// Generate test plot point
const plotPoint = await testService.generateTestPlotPoint(
  "sequence-id", 
  0, // Chapter index
  0  // Plot point index
);
```

## Testing
- Manual test: Navigate to http://localhost:3951/test
- Authentication: Use admin/ILikeSmut credentials
- Test outline generation: Fill form and click "Generate Outline"
- Test plot point generation: Load sequences, select chapter/plot point, generate
- Expected behavior: AI-generated content displayed in results area

## Security Notes
- Basic authentication protects test endpoints
- Test operations do not modify production data
- Hardcoded credentials are acceptable for development testing interface
- Interface should not be exposed in production environments

## Related Documentation
- Generation modules: `src/generation/outline/`, `src/generation/plot/`
- Database schema: `docs/DATABASE_SCHEMA.md`