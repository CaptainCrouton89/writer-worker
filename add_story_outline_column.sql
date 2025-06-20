-- Migration: Add story_outline column to generation_jobs table
-- This migration adds a JSONB column to store the story outline for resume functionality

ALTER TABLE generation_jobs 
ADD COLUMN story_outline JSONB;

-- Add comment for documentation
COMMENT ON COLUMN generation_jobs.story_outline IS 'Stores the story outline generated for this job to enable resume functionality';