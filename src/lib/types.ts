import { Tables } from "./supabase/types.js";
import { StoryOutline } from "./types/generation.js";

export type GenerationJob = Tables<"generation_jobs"> & {
  story_outline: StoryOutline;
};

export interface WorkerConfig {
  pollIntervalMs: number;
  maxRetries: number;
  workerConcurrency: number;
}
