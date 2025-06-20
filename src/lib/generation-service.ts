// Main generation service - re-exports all public functions for backwards compatibility

// Re-export types
export type {
  UserPreferences,
  ChapterBullet,
  Chapter,
  StoryOutline,
  Result
} from "./types/generation.js";

// Re-export constants
export {
  SPICE_LEVELS,
  STORY_LENGTHS,
  STORY_LENGTH_PAGES,
  STORY_LENGTH_CONFIG,
  TEMPERATURE_BY_SPICE
} from "./constants/generation.js";

// Re-export utility functions
export {
  outlineToText,
  parseOutlineResponse,
  extractChapterByIndex,
  extractFirstChapter
} from "./utils/outline.js";

export {
  generateOutlineEmbedding,
  saveOutlineEmbedding
} from "./utils/embedding.js";

// Re-export prompt building functions
export {
  buildUserContext,
  buildOutlinePrompt
} from "./prompts/outline.js";

export {
  buildBulletPrompt,
  buildChapterPrompt,
  buildIsolatedBulletPrompt
} from "./prompts/bullet.js";

// Re-export generation functions
export {
  generateStoryOutline,
  regenerateOutlineWithUserPrompt
} from "./generation/outline.js";

export {
  generateCompleteFirstChapter,
  generateChapterByIndex,
  generateFirstChapter
} from "./generation/chapter.js";

export {
  generateBulletContent
} from "./generation/bullet.js";