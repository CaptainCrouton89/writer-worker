import { supabase } from "../lib/supabase.js";
import { JOB_STATUS, JOB_STEPS, CHAPTER_GENERATION_STATUS } from "../lib/constants/status.js";
import { GenerationJob } from "../lib/types.js";

export interface RetryJobRequest {
  job_id?: string;
  user_id?: string;
  chapter_id?: string;
}

export interface RetryResult {
  success: boolean;
  retriedJobs: string[];
  skippedJobs: string[];
  deletedJobs: string[];
  errors: string[];
}

export class JobRetryService {
  private static readonly MAX_RETRIES_PER_MINUTE = 10;
  private static readonly RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
  private static rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  async retryJobs(request: RetryJobRequest): Promise<RetryResult> {
    const result: RetryResult = {
      success: false,
      retriedJobs: [],
      skippedJobs: [],
      deletedJobs: [],
      errors: [],
    };

    try {
      // Validate request
      if (!request.job_id && !request.user_id && !request.chapter_id) {
        result.errors.push("Must specify job_id, user_id, or chapter_id");
        return result;
      }

      // Rate limiting check
      const rateLimitKey = request.user_id || request.job_id || request.chapter_id || 'anonymous';
      const rateLimitCheck = this.checkRateLimit(rateLimitKey);
      
      if (!rateLimitCheck.allowed) {
        result.errors.push(`Rate limit exceeded. ${rateLimitCheck.remaining} attempts remaining. Reset in ${Math.ceil(rateLimitCheck.resetInSeconds)} seconds.`);
        return result;
      }

      // Get failed jobs based on request type
      const failedJobs = await this.getFailedJobs(request);
      
      if (failedJobs.length === 0) {
        result.errors.push("No failed jobs found for the specified criteria");
        return result;
      }

      console.log(`🔄 Found ${failedJobs.length} failed job(s) to retry`);

      // Process each job
      for (const job of failedJobs) {
        try {
          const validation = await this.validateJobForRetry(job);
          
          if (!validation.isValid) {
            // Determine if we should delete this job or just skip it
            if (validation.shouldDelete) {
              await this.deleteJob(job.id);
              result.deletedJobs.push(job.id);
              console.log(`🗑️ Deleted invalid job ${job.id}: ${validation.reason}`);
            } else {
              result.skippedJobs.push(job.id);
              result.errors.push(`Job ${job.id}: ${validation.reason}`);
            }
            continue;
          }

          await this.resetJobForRetry(job);
          result.retriedJobs.push(job.id);
          
          console.log(`✅ Successfully reset job ${job.id} for retry`);
        } catch (error) {
          result.skippedJobs.push(job.id);
          result.errors.push(`Job ${job.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          console.error(`❌ Failed to retry job ${job.id}:`, error);
        }
      }

      result.success = result.retriedJobs.length > 0;
      return result;
      
    } catch (error) {
      result.errors.push(`System error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error("❌ Error in retryJobs:", error);
      return result;
    }
  }

  private async getFailedJobs(request: RetryJobRequest): Promise<GenerationJob[]> {
    let query = supabase
      .from("generation_jobs")
      .select("*")
      .eq("status", JOB_STATUS.FAILED);

    if (request.job_id) {
      query = query.eq("id", request.job_id);
    } else if (request.user_id) {
      query = query.eq("user_id", request.user_id);
    } else if (request.chapter_id) {
      query = query.eq("chapter_id", request.chapter_id);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch failed jobs: ${error.message}`);
    }

    return (data as GenerationJob[]) || [];
  }

  private async validateJobForRetry(job: GenerationJob): Promise<{ isValid: boolean; reason?: string; shouldDelete?: boolean }> {
    // Check if job has required fields - these should be deleted as they're corrupted
    if (!job.sequence_id) {
      return { isValid: false, reason: "Missing sequence_id", shouldDelete: true };
    }

    if (!job.chapter_id) {
      return { isValid: false, reason: "Missing chapter_id", shouldDelete: true };
    }

    if (!job.user_id) {
      return { isValid: false, reason: "Missing user_id", shouldDelete: true };
    }

    // Check if there are any active jobs for the same chapter - delete duplicates
    const { data: activeJobs, error: activeJobsError } = await supabase
      .from("generation_jobs")
      .select("id")
      .eq("chapter_id", job.chapter_id)
      .in("status", [JOB_STATUS.PENDING, JOB_STATUS.PROCESSING]);

    if (activeJobsError) {
      return { isValid: false, reason: `Failed to check active jobs: ${activeJobsError.message}` };
    }

    if (activeJobs && activeJobs.length > 0) {
      return { isValid: false, reason: "Chapter already has active jobs", shouldDelete: true };
    }

    // Verify chapter still exists - delete jobs for deleted chapters
    const { data: chapter, error: chapterError } = await supabase
      .from("chapters")
      .select("id, generation_status")
      .eq("id", job.chapter_id)
      .single();

    if (chapterError) {
      return { isValid: false, reason: `Chapter not found: ${chapterError.message}`, shouldDelete: true };
    }

    // Verify sequence still exists - delete jobs for deleted sequences
    const { data: sequence, error: sequenceError } = await supabase
      .from("sequences")
      .select("id")
      .eq("id", job.sequence_id)
      .single();

    if (sequenceError) {
      return { isValid: false, reason: `Sequence not found: ${sequenceError.message}`, shouldDelete: true };
    }

    // Verify chapter-sequence mapping exists - delete jobs for broken mappings
    const { data: mapping, error: mappingError } = await supabase
      .from("chapter_sequence_map")
      .select("id")
      .eq("chapter_id", job.chapter_id)
      .eq("sequence_id", job.sequence_id)
      .single();

    if (mappingError) {
      return { isValid: false, reason: `Chapter-sequence mapping not found: ${mappingError.message}`, shouldDelete: true };
    }

    return { isValid: true };
  }

  private async resetJobForRetry(job: GenerationJob): Promise<void> {
    // Use a transaction to ensure atomicity
    const { error: jobUpdateError } = await supabase
      .from("generation_jobs")
      .update({
        status: JOB_STATUS.PENDING,
        error_message: null,
        started_at: null,
        completed_at: null,
        progress: 0,
        current_step: JOB_STEPS.INITIALIZING,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    if (jobUpdateError) {
      throw new Error(`Failed to reset job: ${jobUpdateError.message}`);
    }

    // Reset chapter status if it's stuck in generating
    const { data: chapter, error: chapterFetchError } = await supabase
      .from("chapters")
      .select("generation_status")
      .eq("id", job.chapter_id)
      .single();

    if (chapterFetchError) {
      throw new Error(`Failed to fetch chapter status: ${chapterFetchError.message}`);
    }

    if (chapter?.generation_status === CHAPTER_GENERATION_STATUS.GENERATING) {
      const { error: chapterUpdateError } = await supabase
        .from("chapters")
        .update({
          generation_status: CHAPTER_GENERATION_STATUS.FAILED,
          generation_progress: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.chapter_id);

      if (chapterUpdateError) {
        console.warn(`Failed to reset chapter status for ${job.chapter_id}: ${chapterUpdateError.message}`);
      } else {
        console.log(`🔄 Reset chapter ${job.chapter_id} status from generating to failed`);
      }
    }
  }

  private checkRateLimit(key: string): { allowed: boolean; remaining: number; resetInSeconds: number } {
    const now = Date.now();
    const rateLimitData = JobRetryService.rateLimitMap.get(key);

    // Clean up expired entries
    if (rateLimitData && now > rateLimitData.resetTime) {
      JobRetryService.rateLimitMap.delete(key);
    }

    const currentData = JobRetryService.rateLimitMap.get(key);

    if (!currentData) {
      // First request for this key
      JobRetryService.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + JobRetryService.RATE_LIMIT_WINDOW_MS,
      });
      return {
        allowed: true,
        remaining: JobRetryService.MAX_RETRIES_PER_MINUTE - 1,
        resetInSeconds: JobRetryService.RATE_LIMIT_WINDOW_MS / 1000,
      };
    }

    if (currentData.count >= JobRetryService.MAX_RETRIES_PER_MINUTE) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds: (currentData.resetTime - now) / 1000,
      };
    }

    // Increment count
    currentData.count++;
    JobRetryService.rateLimitMap.set(key, currentData);

    return {
      allowed: true,
      remaining: JobRetryService.MAX_RETRIES_PER_MINUTE - currentData.count,
      resetInSeconds: (currentData.resetTime - now) / 1000,
    };
  }

  private async deleteJob(jobId: string): Promise<void> {
    const { error } = await supabase
      .from("generation_jobs")
      .delete()
      .eq("id", jobId);

    if (error) {
      throw new Error(`Failed to delete job ${jobId}: ${error.message}`);
    }
  }
}