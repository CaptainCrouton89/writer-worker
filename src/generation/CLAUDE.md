# Generation Directory

This directory contains AI-powered story generation modules that work with multiple AI models through the centralized ModelService to create adult fiction content. The generation system is organized into three main areas: metadata extraction, story outlining, and plot/chapter content generation.

## Architecture Overview

The generation system follows a progressive content creation pipeline:

1. **Outline Processing** - Creates or regenerates story outlines based on user prompts
2. **Metadata Generation** - Extracts story metadata (title, description, tags, warnings)
3. **Chapter Generation** - Creates detailed chapter content from outline plot points
4. **Plot Point Generation** - Generates individual sections within chapters

## Directory Structure

```
generation/
├── metadata/
│   └── metadata.ts          # Story metadata extraction
├── outline/
│   ├── types.ts            # Outline data schemas
│   ├── newOutline.ts       # Initial outline generation
│   └── regenerateOutline.ts # Outline modification/regeneration
└── plot/
    ├── chapter.ts          # Chapter-level content generation
    └── plotPoint.ts        # Individual plot point generation
```

## Core Modules

### Metadata Generation (`metadata/metadata.ts`)

Generates story metadata from completed outlines using structured AI extraction:

- **Purpose**: Extract title, description, tags, trigger warnings, and content ratings
- **Input**: JSON string representation of story outline and optional model ID
- **Output**: Structured metadata object with validation
- **Model**: Database-driven model selection via ModelService (defaults to Gemini 2.5 Pro)
- **Schema**: Zod-validated `SequenceMetadataSchema`

Key features:
- Generates compelling titles and 2-sentence descriptions
- Extracts 5-8 categorized tags (genre, relationship, character, theme, content, setting)
- Identifies relevant trigger warnings based on story content
- Determines explicit content rating based on sexual content level

### Outline Management (`outline/`)

Handles story structure creation and modification:

#### Types (`types.ts`)
- Defines `StoryOutlineSchema` with chapters containing names and plot points
- Validates outline structure using Zod schemas

#### New Outline Generation (`newOutline.ts`)
- **Purpose**: Create initial story outlines from user prompts
- **Input**: User prompt, story length, tags, spice level, optional model ID
- **Output**: Array of chapters with plot points
- **Model**: Database-driven model selection via ModelService

Features:
- Three spice levels with progressive intimacy guidelines
- Story length configuration (short story, novella, novel/slow burn)
- Configurable chapters and plot points per story type
- Structured system prompts with pacing guidelines

#### Outline Regeneration (`regenerateOutline.ts`)
- **Purpose**: Modify existing outlines based on new user requests
- **Input**: New user prompt, existing chapters, prompt metadata
- **Output**: Updated chapter array
- **Model**: Gemini 2.5 Pro with temperature 0.4 for controlled modification

Features:
- Incorporates existing outline context
- Applies user modifications while maintaining story consistency
- Preserves established pacing and structure

### Plot Generation (`plot/`)

Handles detailed content creation from outlines:

#### Chapter Generation (`chapter.ts`)
- **Purpose**: Orchestrate plot point generation for complete chapters
- **Process**: Iterates through chapter plot points, generating content incrementally
- **Features**: 
  - Real-time progress tracking in database
  - Incremental content updates
  - Chapter completion status management

#### Plot Point Generation (`plotPoint.ts`)
- **Purpose**: Generate detailed prose for individual plot points
- **Input**: User prompt, story context, chapter/plot point indexes, previous content, optional model ID
- **Output**: Detailed prose section (400-700 words depending on story length)
- **Model**: Database-driven model selection via ModelService

Key features:
- Three spice level guidelines (subtle/moderate/explicit)
- Length targeting based on story configuration
- Context-aware generation using previous content
- Position-aware prompting (first/middle/last plot points)
- Content truncation to manage context windows (8000 characters)

## Generation Configuration

The system uses configurable parameters for different story types:

- **Story Length**: Short story, novella, novel (0-2 index)
- **Spice Level**: Low, medium, high (0-2 index)
- **Chapter Count**: Varies by story length
- **Plot Points per Chapter**: Typically 5 plot points
- **Word Target**: 400-700 words per plot point

## AI Model Service Integration

All generation modules now use the centralized **ModelService** (`src/services/model-service.ts`) for AI model management:

- **Database-driven model selection**: Models configured in `ai_models` table
- **Caching**: In-memory model configuration caching for performance
- **Multi-provider support**: Currently supports OpenRouter, extensible for other providers
- **Dynamic switching**: Jobs can specify different models via `model_id` parameter
- **Default model**: Uses Gemini 2.5 Pro when no model_id specified in job configuration

## Integration Points

The generation modules integrate with:

- **JobProcessorV2**: Main orchestration for generation jobs with model ID support
- **ModelService**: Centralized AI model management and provider instantiation
- **OutlineProcessor**: Manages outline processing logic
- **SequenceService**: Database operations for sequences/stories
- **Supabase**: Real-time progress tracking and content storage

## Error Handling

All generation modules implement consistent error handling:
- Structured error messages with context
- Failed generation attempts bubble up to job processor
- Database transaction safety for partial generation failures
- Retry logic handled at the job processing level

## Content Guidelines

The system includes comprehensive content guidelines:
- Progressive spice levels with appropriate content restrictions
- Trigger warning identification for sensitive content
- Age-appropriate content validation
- Explicit content flagging and categorization

## Development Notes

- All generation functions are async and return promises
- Content is generated progressively to provide real-time updates
- Database updates occur incrementally during generation
- Context windows are managed through content truncation
- Temperature settings are optimized per generation type (metadata: 0.2, outline: 0.4-0.5, content: 0.8)