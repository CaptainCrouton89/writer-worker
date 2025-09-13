# AI Model Service

## Overview
Centralized AI model service that provides database-driven model selection with caching, supporting multiple AI providers through a unified interface for dynamic model switching based on job requirements.

## User Perspective
Developers can now specify which AI model to use for generation tasks through job configuration. The test interface allows selection of different AI models to compare output quality and performance across providers.

## Data Flow
1. Job is created with optional `model_id` parameter specifying the AI model to use
2. ModelService fetches model configuration from `ai_models` database table
3. Model configuration is cached in memory for subsequent requests
4. Generation services receive model ID and use ModelService to get the appropriate AI provider
5. AI provider instance is created and used for text/content generation
6. Results are returned through the existing generation pipeline

## Implementation

### Key Files
- `src/services/model-service.ts` - Core ModelService class with caching and provider management
- `src/generation/metadata/metadata.ts` - Updated to use ModelService for title/description generation
- `src/generation/outline/newOutline.ts` - Integrated ModelService for outline generation
- `src/generation/plot/chapter.ts` - Uses ModelService for chapter content generation
- `src/generation/plot/plotPoint.ts` - Updated for plot point generation with model selection
- `src/generation/quirks/writingQuirks.ts` - Enhanced with ModelService and contextual generation
- `src/job-processor-v2.ts` - Passes model_id through generation pipeline
- `src/services/test-generation-service.ts` - Enhanced test interface with model selection

### Database
- Tables: `ai_models` - Stores model configurations with provider, model_name, display_name, and is_active status
- Model caching: In-memory cache using Map for frequently accessed model configurations

## Configuration
- Environment variables: `OPENROUTER_API_KEY` - Required for OpenRouter provider access
- Default model: Gemini 2.5 Pro (UUID: fc96ce93-b98f-4606-92fc-8fe2c4db1ef6) used when no model_id specified

## Usage Example
```typescript
// Get default model (Gemini 2.5 Pro)
const defaultModel = await ModelService.getModel();

// Get specific model by ID
const customModel = await ModelService.getModel('model-uuid');

// Get AI provider instance
const provider = ModelService.getModelProvider(defaultModel);

// Use in generation
const result = await generateText({
  model: provider,
  prompt: 'Generate content...',
});
```

## Testing
- Manual test: Use enhanced test interface at `/test-interface.html` to select different AI models
- Model selection: Dropdown allows testing with different providers and models
- Expected behavior: Content generation should use the selected model and produce results consistent with that model's capabilities

## Related Documentation
- Architecture: Database schema for ai_models table
- API: Generation endpoints now accept optional model_id parameter