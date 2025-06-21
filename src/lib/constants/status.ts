/**
 * Status constants for consistent database status values
 */

// Generation job statuses
export const JOB_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

// Chapter generation statuses (must match database constraint)
export const CHAPTER_GENERATION_STATUS = {
  GENERATING: "generating",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

// Job processing steps
export const JOB_STEPS = {
  INITIALIZING: "initializing",
  PROCESSING_OUTLINE: "processing_outline",
  SAVING_OUTLINE: "saving_outline",
  GENERATING_METADATA: "generating_metadata",
  GENERATING_EMBEDDING: "generating_embedding",
  GENERATING_CHAPTER_CONTENT: "generating_chapter_content",
  COMPLETING_JOB: "completing_job",
  COMPLETED: "completed",
  RESUMING: "resuming",
} as const;

// Health check statuses
export const HEALTH_STATUS = {
  HEALTHY: "healthy",
  UNHEALTHY: "unhealthy",
} as const;

// TypeScript types for better type safety
export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];
export type ChapterGenerationStatus =
  (typeof CHAPTER_GENERATION_STATUS)[keyof typeof CHAPTER_GENERATION_STATUS];
export type JobStep = (typeof JOB_STEPS)[keyof typeof JOB_STEPS];
export type HealthStatus = (typeof HEALTH_STATUS)[keyof typeof HEALTH_STATUS];
