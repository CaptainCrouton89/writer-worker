import { Tables } from "./supabase/types.js";

export type GenerationJob = Tables<"generation_jobs">;
export interface Chapter {
  name: string;
  plotPoints: string[];
}

/** Example:
 * [{"tags": ["forbidden lovers", "romance"], "prompt": "user original prompt string", "processed": true, "spice_level": 1, "processed_at": 1750533418000, "story_length": 1, "insertion_chapter_index": 0}]
 */

export interface UserPromptHistory {
  prompt: string;
  tags: string[];
  spice_level: number;
  story_length: number;
  insertion_chapter_index: number;
  processed: boolean;
  processed_at: number;
}
[];

export interface WorkerConfig {
  pollIntervalMs: number;
  maxRetries: number;
  workerConcurrency: number;
}
