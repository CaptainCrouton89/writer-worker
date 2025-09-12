# Writing Quirks

## Overview
Generates unique stylistic writing elements for each story sequence to enhance narrative personality and distinguish stories with distinctive narrative techniques.

## User Perspective
Users receive stories with automatically-applied unique writing quirks like "Occasional Flashbacks - 2-3 sentence memories in italics" or "Stream of Consciousness - Internal monologues revealing thoughts". These quirks are consistently applied throughout the entire story, creating a distinctive narrative voice that persists across all chapters and plot points.

## Data Flow
1. User initiates story generation through the job system
2. OutlineProcessor detects new story and triggers writing quirk generation
3. OpenRouter Gemini 2.5 Pro generates 4 unique quirk options using author style and spice level context
4. System randomly selects one quirk from the 4 options
5. Selected quirk is saved to the sequences table in the `writing_quirk` column
6. Quirk is passed through the entire generation pipeline:
   - Outline generation incorporates the quirk into narrative structure
   - Plot point generation applies the quirk to scene-level content
   - Chapter generation maintains quirk consistency
7. Database stores the quirk for regeneration scenarios

## Implementation

### Key Files
- `src/generation/quirks/writingQuirks.ts` - Core quirk generation using OpenRouter Gemini 2.5 Pro
- `src/services/outline-processor.ts` - Orchestrates quirk generation for new stories
- `src/services/sequence-service.ts` - Database operations for quirk storage
- `src/generation/outline/newOutline.ts` - Integrates quirks into outline generation
- `src/generation/outline/regenerateOutline.ts` - Uses existing quirks for outline regeneration
- `src/generation/plot/plotPoint.ts` - Applies quirks to individual plot points
- `src/generation/plot/chapter.ts` - Maintains quirk consistency in chapter generation
- `src/job-processor-v2.ts` - Passes quirks through the generation pipeline

### Database
- Tables: `sequences` - Added `writing_quirk` column to store selected quirk text
- The quirk is stored as a formatted string: "Title - Description"

## Configuration
- Environment variables: `OPENROUTER_API_KEY` - Required for OpenRouter Gemini 2.5 Pro access
- Model: Uses `google/gemini-2.5-pro` through OpenRouter for quirk generation
- Temperature: 0.7 for creative variety in quirk generation
- Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)

## Usage Example
```typescript
// Generate quirks based on author style and spice level
const quirksResponse = await generateWritingQuirks(
  "romantic", // author style
  "mild"      // spice level
);

// Randomly select one from the 4 generated options
const selectedQuirk = selectRandomQuirk(quirksResponse.quirks);
// Result: "Epistolary Elements - Letters or diary entries in narrative"

// Save to database
await sequenceService.updateWritingQuirk(sequenceId, selectedQuirk);
```

## Testing
- Manual test: Create a new story and verify the quirk appears in the database and throughout generated content
- Expected behavior: 
  - New stories should have a unique quirk selected and saved
  - The quirk should be visible in outline, plot points, and chapters
  - Regenerated outlines should maintain the existing quirk
  - Different stories should receive different quirks

## Related Documentation
- Architecture: Database schema changes for sequences table
- API: OpenRouter integration for AI-powered quirk generation