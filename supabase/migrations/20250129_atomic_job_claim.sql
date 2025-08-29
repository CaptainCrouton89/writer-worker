-- Create function to atomically claim jobs for processing
CREATE OR REPLACE FUNCTION claim_pending_jobs(worker_count INT DEFAULT 1)
RETURNS TABLE(
  id UUID,
  sequence_id UUID,
  chapter_id UUID,
  user_id UUID,
  status TEXT,
  progress INT,
  current_step TEXT,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  job_type TEXT,
  quote_id UUID,
  model_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE generation_jobs gj
  SET 
    status = 'processing',
    started_at = NOW(),
    current_step = 'initializing',
    updated_at = NOW()
  FROM (
    SELECT gj2.id
    FROM generation_jobs gj2
    WHERE gj2.status = 'pending'
    ORDER BY gj2.created_at ASC
    LIMIT worker_count
    FOR UPDATE SKIP LOCKED
  ) AS pending_jobs
  WHERE gj.id = pending_jobs.id
  RETURNING 
    gj.id,
    gj.sequence_id,
    gj.chapter_id,
    gj.user_id,
    gj.status,
    gj.progress,
    gj.current_step,
    gj.error_message,
    gj.started_at,
    gj.completed_at,
    gj.created_at,
    gj.updated_at,
    gj.job_type,
    gj.quote_id,
    gj.model_id;
END;
$$;

-- Add comment explaining the function
COMMENT ON FUNCTION claim_pending_jobs IS 'Atomically claims pending jobs for processing. Uses FOR UPDATE SKIP LOCKED to prevent race conditions between multiple workers.';