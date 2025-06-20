-- Add bullet progress tracking to generation_jobs table
ALTER TABLE generation_jobs 
ADD COLUMN bullet_progress INTEGER DEFAULT 0;

-- Add comment explaining the field
COMMENT ON COLUMN generation_jobs.bullet_progress IS 'Track which bullet index (0-based) was last completed for resume functionality';