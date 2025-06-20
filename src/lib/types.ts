import { Tables } from "./supabase/types.js";

export type GenerationJob = Tables<"generation_jobs">

export interface WorkerConfig {
  pollIntervalMs: number
  maxRetries: number
  workerConcurrency: number
}