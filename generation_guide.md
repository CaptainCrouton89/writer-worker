# Generation Library Documentation

The `src/lib/generation/` library contains the core AI-powered story generation functionality for the Smut AI worker service. It's organized into three main modules:

## Files Overview

### 1. `bullet.ts` - Bullet Point Content Generation
**Location**: `src/lib/generation/bullet.ts`

**Purpose**: Handles the generation of individual bullet point content within chapters.

**Key Function**:
- `generateBulletContent(bulletPoint, chapterContext, previousContent, nextBullet, job, onProgress)` - Core function that generates detailed prose content for a single bullet point

**Function Parameters**:
- `bulletPoint` - The bullet point object with description and metadata
- `chapterContext` - Chapter-level context including characters, setting, and themes
- `previousContent` - Content from previous bullets for continuity
- `nextBullet` - Next bullet point for narrative flow awareness
- `job` - Database job record for preferences and tracking
- `onProgress` - Callback function for real-time progress updates

**Dependencies**:
- `src/lib/ai/client.js` - `callAI()` for AI text generation
- `src/lib/prompts/bullet.js` - Specialized prompts for content generation
- `src/lib/supabase.ts` - Database operations for saving progress

**Integration Flow**:
1. Called by `generateCompleteFirstChapter()` in chapter.ts for each bullet
2. Uses AI client with bullet-specific prompts and temperature settings
3. Returns generated content that gets accumulated into full chapter text

### 2. `chapter.ts` - Chapter Generation & Management  
**Location**: `src/lib/generation/chapter.ts`

**Purpose**: Main orchestrator for complete chapter generation, including outline creation and content assembly.

**Key Functions**:
- `generateCompleteFirstChapter(job, onProgress)` - Primary orchestrator function
  - Handles full pipeline from outline creation to content generation
  - Manages resume logic for partial chapters
  - Coordinates with outline.ts and bullet.ts modules
- `generateChapterByIndex(chapterIndex, job, onProgress)` - Generate specific chapter from existing outline
  - Used for continuing stories beyond first chapter
  - Assumes outline already exists in database
- `generateFirstChapter(job, onProgress)` - Simplified wrapper for first chapter only
  - Skips outline generation step
  - Used when outline already exists

**Function Parameters**:
- `job` - Complete database job record with user preferences and story context
- `onProgress` - Callback function for real-time UI updates
- `chapterIndex` - Zero-based chapter number for multi-chapter generation

**Dependencies & Integration**:
- `src/lib/generation/outline.ts` - `generateStoryOutline()` for initial outline creation
- `src/lib/generation/bullet.ts` - `generateBulletContent()` for each bullet point
- `src/lib/supabase.ts` - Database operations for progress tracking and content storage
- `src/lib/utils/outline.js` - `parseOutlineToChapters()` for outline processing
- `src/lib/utils/embedding.js` - `generateAndSaveOutlineEmbedding()` for semantic search

**Core Workflow**:
1. **Outline Phase**: Generate or retrieve story outline using outline.ts
2. **Chapter Extraction**: Parse outline to extract target chapter structure
3. **Content Generation Loop**: 
   - For each bullet point in chapter
   - Call `generateBulletContent()` from bullet.ts
   - Save progress to database after each bullet
   - Update UI via onProgress callback
4. **Completion**: Return full chapter content and update job status

**Resume Logic**:
- Checks database for existing partial content
- Continues from last completed bullet point
- Maintains narrative continuity across resume points

### 3. `outline.ts` - Story Outline Generation & Regeneration
**Location**: `src/lib/generation/outline.ts`

**Purpose**: Handles creation and modification of story outlines that define chapter structure and plot points.

**Key Functions**:
- `generateStoryOutline(job, onProgress)` - Creates initial story outline from user preferences
  - Generates complete story structure with chapters and bullet points
  - Creates story title and description metadata
  - Saves outline to database with embedding for search
- `regenerateOutlineWithUserPrompt(job, userPrompt, currentChapterIndex, onProgress)` - Smart outline updates
  - Preserves completed chapters (0 to currentChapterIndex-1)
  - Regenerates remaining chapters with user direction incorporated
  - Maintains story continuity and character consistency

**Function Parameters**:
- `job` - Database job record with user preferences and story context
- `onProgress` - Progress callback for UI updates
- `userPrompt` - User's direction for story changes (regeneration only)
- `currentChapterIndex` - Chapter index to start regeneration from

**Dependencies & Integration**:
- `src/lib/ai/client.js` - `callAI()` for AI outline generation
- `src/lib/prompts/outline.js` - Specialized prompts for outline creation and regeneration
- `src/lib/supabase.ts` - Database operations for outline storage and retrieval
- `src/lib/utils/embedding.js` - `generateAndSaveOutlineEmbedding()` for semantic search
- `src/lib/utils/outline.js` - `parseOutlineToChapters()` for outline processing

**Generation Process**:
1. **Context Building**: Assembles user preferences into coherent story context
2. **AI Generation**: Uses outline-specific prompts to generate structured story plan
3. **Parsing & Validation**: Converts AI output into structured chapter/bullet format
4. **Database Storage**: Saves outline with metadata and generates embeddings
5. **Integration Ready**: Returns structured outline for chapter generation

**Regeneration Logic**:
- **Preservation**: Maintains completed chapters exactly as they are
- **Context Continuity**: Includes completed chapter summaries in regeneration context
- **User Direction**: Incorporates user feedback into remaining chapter planning
- **Consistency**: Ensures character and plot consistency across regenerated sections

## Integration Points & System Architecture

### Database Integration (`src/lib/supabase.ts`):
**Key Functions Used by Generation Library**:
- `updateGenerationJobStatus()` - Updates job progress and status
- `saveChapterContent()` - Stores generated chapter text progressively
- `getPartialChapterContent()` - Retrieves existing content for resume capability
- `updateSequenceMetadata()` - Saves story title, description, and outline
- `saveChapterSequenceMapping()` - Links chapters to their story sequences

**Data Flow**:
1. outline.ts → saves outline and metadata to sequences table
2. chapter.ts → updates job status and saves progress incrementally
3. bullet.ts → called by chapter.ts but doesn't directly access database

### AI Client (`src/lib/ai/client.js`):
**Core Function**: `callAI(prompt, temperature, systemPrompt)`
- **Used by outline.ts**: Lower temperature (0.7) for structured outline generation
- **Used by bullet.ts**: Variable temperature based on spice level for creative content
- **System Prompts**: Different prompts for outline vs content generation contexts
- **Error Handling**: Includes retry logic and response validation

### Prompt System (`src/lib/prompts/`):
**File Structure & Usage**:
- `outline.js` - Contains prompts for:
  - `buildOutlinePrompt()` - Initial story outline generation
  - `buildRegenerationPrompt()` - Outline updates with user direction
- `bullet.js` - Contains prompts for:
  - `buildContentPrompt()` - Individual bullet point content generation
  - Context-aware prompts that include previous content and next bullet hints

### Utilities (`src/lib/utils/`):
**Supporting Functions**:
- `outline.js`:
  - `parseOutlineToChapters(outlineText)` - Converts AI-generated text to structured chapters
  - `convertChaptersToText(chapters)` - Formats chapters back to readable text
- `embedding.js`:
  - `generateAndSaveOutlineEmbedding(sequenceId, outlineText)` - Creates vector embeddings for story search
  - Used by outline.ts after successful outline generation

## Function Call Flow & Data Dependencies

### Complete Story Generation Flow:
```
Worker Process (src/worker.ts)
  ↓
Generation Service (src/lib/generation-service.ts)
  ↓ calls generateCompleteFirstChapter()
chapter.ts: generateCompleteFirstChapter()
  ↓ calls generateStoryOutline()
outline.ts: generateStoryOutline()
  ↓ uses callAI() with outline prompts
AI Client + Outline Prompts
  ↓ returns to outline.ts
outline.ts: saves to database via supabase.ts
  ↓ returns outline to chapter.ts
chapter.ts: parseOutlineToChapters()
  ↓ for each bullet in first chapter
chapter.ts: calls generateBulletContent()
  ↓
bullet.ts: generateBulletContent()
  ↓ uses callAI() with content prompts
AI Client + Bullet Prompts
  ↓ returns content to bullet.ts
bullet.ts: returns to chapter.ts
  ↓ chapter.ts saves progress via supabase.ts
chapter.ts: accumulates content, updates job
```

### Outline Regeneration Flow:
```
User Request for Story Changes
  ↓
outline.ts: regenerateOutlineWithUserPrompt()
  ↓ preserves completed chapters (0 to currentChapterIndex-1)
  ↓ uses callAI() with regeneration prompts + user direction
AI Client + Outline Prompts
  ↓ returns updated outline
outline.ts: merges preserved + new chapters
  ↓ saves updated outline via supabase.ts
outline.ts: returns complete updated outline
```

### Resume Generation Flow:
```
chapter.ts: generateCompleteFirstChapter()
  ↓ checks for existing partial content
supabase.ts: getPartialChapterContent()
  ↓ if partial content exists
chapter.ts: resumes from last completed bullet
  ↓ continues normal bullet generation loop
bullet.ts: generateBulletContent() (for remaining bullets)
```

## Usage Patterns & Entry Points

### Entry Points from Generation Service (`src/lib/generation-service.ts`):
The generation service acts as the main coordinator and calls into the generation library:

**For New Stories**:
```javascript
// Called from generation-service.ts
await generateCompleteFirstChapter(job, onProgress)
```
1. Automatically generates outline via `generateStoryOutline()`
2. Processes first chapter content via bullet-by-bullet generation
3. Saves progress incrementally for resume capability
4. Returns complete chapter content

**For Continuing Stories**:
```javascript
// Called from generation-service.ts for subsequent chapters
await generateChapterByIndex(chapterIndex, job, onProgress)
```
1. Uses existing outline from database
2. Extracts specific chapter structure
3. Generates content for that chapter only
4. Ideal for multi-chapter story continuation

**For Story Direction Changes**:
```javascript
// Called from generation-service.ts when user wants changes
await regenerateOutlineWithUserPrompt(job, userPrompt, currentChapterIndex, onProgress)
```
1. Preserves completed chapters (0 to currentChapterIndex-1)
2. Regenerates remaining chapters with user direction
3. Maintains story continuity while incorporating new direction
4. Updates metadata and outline embeddings

### Integration with Worker System:
The worker process (`src/worker.ts`) orchestrates the entire flow:
1. **Job Polling**: Continuously polls for new generation jobs
2. **Service Delegation**: Calls generation-service.ts with job details
3. **Progress Tracking**: Receives progress updates via callbacks
4. **Error Handling**: Manages retries and failure states
5. **Cleanup**: Handles job completion and status updates

### Database State Management:
The system maintains several key states:
- **Job Status**: pending → processing → completed/failed
- **Chapter Progress**: Bullet-level progress tracking for resumes
- **Outline Storage**: Persistent story structure with embeddings
- **Content Accumulation**: Incremental chapter content building

This architecture provides a robust, resumable, and flexible story generation system that can handle both complete automation and user-directed story development with full observability and error recovery.