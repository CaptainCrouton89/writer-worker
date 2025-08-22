import { Tables } from "./supabase/types.js";

export type GenerationJob = Tables<"generation_jobs">;
export interface Chapter {
  name: string;
  plotPoints: string[];
}

/** Example:
 * [{"tags": ["forbidden lovers", "romance"], "style": 0, "prompt": "user original prompt string", "processed": true, "spice_level": 1, "processed_at": 1750533418000, "story_length": 1, "insertion_chapter_index": 0}]
 */

export interface UserPrompt {
  prompt: string;
  tags: string[];
  style: AuthorStyle;
  spice_level: SpiceLevel;
  story_length: StoryLength;
  insertion_chapter_index: number;
  processed: boolean;
  processed_at: number;
}

export type UserPromptHistory = UserPrompt[];

export type Sequence = Tables<"sequences"> & {
  user_prompt_history: UserPromptHistory; // overwrites the jsonb field
  chapters: Chapter[]; // overwrites the jsonb field
};

export interface WorkerConfig {
  pollIntervalMs: number;
  maxRetries: number;
  workerConcurrency: number;
}

export type SpiceLevel = 0 | 1 | 2;
export type StoryLength = 0 | 1 | 2;

export type AuthorStyle = 0 | 1 | 2 | 3 | 4;
