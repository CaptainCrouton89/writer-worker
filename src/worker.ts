import { supabase } from "./lib/supabase.js";
import { GenerationJob, WorkerConfig } from "./lib/types.js";
import { generateCompleteFirstChapter, UserPreferences } from "./lib/generation-service.js";

const config: WorkerConfig = {
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || "5000"),
  maxRetries: parseInt(process.env.MAX_RETRIES || "2"),
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || "2"),
};

let isShuttingDown = false;

export async function startWorker() {
  console.log("🚀 Starting worker with config:", config);

  // Graceful shutdown handling
  process.on("SIGTERM", () => {
    console.log("📡 Received SIGTERM, initiating graceful shutdown...");
    isShuttingDown = true;
  });

  process.on("SIGINT", () => {
    console.log("📡 Received SIGINT, initiating graceful shutdown...");
    isShuttingDown = true;
  });

  // Clean up orphaned chapters on startup
  await cleanupOrphanedChapters();

  // Main worker loop
  while (!isShuttingDown) {
    try {
      await pollAndProcessJobs();
      await sleep(config.pollIntervalMs);
    } catch (error) {
      console.error("❌ Error in worker loop:", error);
      await sleep(config.pollIntervalMs);
    }
  }

  console.log("🛑 Worker shut down gracefully");
}

async function pollAndProcessJobs() {
  try {
    // Query for pending jobs
    const { data: jobs, error } = await supabase
      .from("generation_jobs")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(config.workerConcurrency);

    if (error) {
      console.error("❌ Error fetching jobs:", error);
      return;
    }

    if (!jobs || jobs.length === 0) {
      return;
    }

    console.log(`📋 Found ${jobs.length} pending job(s)`);

    // Process jobs concurrently
    const promises = jobs.map((job) => processGenerationJob(job));
    await Promise.allSettled(promises);
  } catch (error) {
    console.error("❌ Error in pollAndProcessJobs:", error);
  }
}

async function processGenerationJob(job: GenerationJob) {
  console.log(`🔄 Starting job ${job.id} for chapter ${job.chapter_id}`);

  try {
    // Lock the job by updating status to processing
    const { error: lockError } = await supabase
      .from("generation_jobs")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
        current_step: "initializing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id)
      .eq("status", "pending"); // Ensure we only lock pending jobs

    if (lockError) {
      console.error(`❌ Failed to lock job ${job.id}:`, lockError);
      return;
    }

    // Parse user preferences from the job
    const preferences = job.user_preferences as UserPreferences;
    
    // Generate the complete first chapter with streaming updates
    await updateJobProgress(job.id, "generating_content", 10);
    
    const generationResult = await generateCompleteFirstChapter(
      preferences, 
      job.chapter_id,
      async (step: string, progress: number) => {
        await updateJobProgress(job.id, step, progress);
      }
    );
    if (!generationResult.success) {
      throw new Error(generationResult.error);
    }

    await updateJobProgress(job.id, "finalizing", 90);

    // Mark job as completed and update chapter status
    const { error: completeError } = await supabase
      .from("generation_jobs")
      .update({
        status: "completed",
        progress: 100,
        current_step: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    if (completeError) {
      console.error(`❌ Failed to complete job ${job.id}:`, completeError);
      return;
    }

    // Update chapter generation status to completed
    const { error: chapterStatusError } = await supabase
      .from("chapters")
      .update({
        generation_status: "completed",
        generation_progress: 100,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.chapter_id);

    if (chapterStatusError) {
      console.error(`❌ Failed to update chapter status for job ${job.id}:`, chapterStatusError);
      return;
    }

    console.log(`✅ Successfully completed job ${job.id} and updated chapter ${job.chapter_id}`);
  } catch (error) {
    console.error(`❌ Error processing job ${job.id}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await handleJobError(job.id, errorMessage);
  }
}

async function updateJobProgress(jobId: string, step: string, progress: number) {
  try {
    const { error } = await supabase
      .from("generation_jobs")
      .update({
        current_step: step,
        progress,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (error) {
      console.error(`❌ Failed to update progress for job ${jobId}:`, error);
    } else {
      console.log(`📊 Job ${jobId}: ${step} (${progress}%)`);
    }
  } catch (error) {
    console.error(`❌ Error updating job progress ${jobId}:`, error);
  }
}

async function handleJobError(jobId: string, errorMessage: string) {
  try {
    // Get current retry count and chapter_id
    const { data: job, error: fetchError } = await supabase
      .from("generation_jobs")
      .select("error_message, chapter_id")
      .eq("id", jobId)
      .single();

    if (fetchError) {
      console.error(`❌ Failed to fetch job for error handling ${jobId}:`, fetchError);
      return;
    }

    // Parse retry count from error message (simple implementation)
    const currentRetries = job.error_message?.includes("Retry") ? 
      parseInt(job.error_message.match(/Retry (\d+)/)?.[1] || "0") : 0;

    if (currentRetries < config.maxRetries) {
      // Reset to pending for retry
      const { error: retryError } = await supabase
        .from("generation_jobs")
        .update({
          status: "pending",
          error_message: `Retry ${currentRetries + 1}/${config.maxRetries}: ${errorMessage}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      if (retryError) {
        console.error(`❌ Failed to retry job ${jobId}:`, retryError);
      } else {
        console.log(`🔄 Retrying job ${jobId} (attempt ${currentRetries + 1}/${config.maxRetries})`);
      }
    } else {
      // Mark job as failed after max retries
      const { error: failError } = await supabase
        .from("generation_jobs")
        .update({
          status: "failed",
          error_message: `Max retries exceeded: ${errorMessage}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      if (failError) {
        console.error(`❌ Failed to mark job as failed ${jobId}:`, failError);
        return;
      }

      // Update chapter generation status to failed
      const { error: chapterStatusError } = await supabase
        .from("chapters")
        .update({
          generation_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.chapter_id);

      if (chapterStatusError) {
        console.error(`❌ Failed to update chapter status to failed for job ${jobId}:`, chapterStatusError);
      }

      console.log(`💀 Job ${jobId} failed after ${config.maxRetries} retries, chapter ${job.chapter_id} marked as failed`);
    }
  } catch (error) {
    console.error(`❌ Error in handleJobError for job ${jobId}:`, error);
  }
}

async function cleanupOrphanedChapters() {
  try {
    console.log("🔍 Checking for orphaned chapters...");
    
    // Find chapters that are stuck in 'generating' status but have no active jobs
    const { data: orphanedChapters, error: queryError } = await supabase
      .from("chapters")
      .select(`
        id,
        generation_status,
        generation_progress
      `)
      .eq("generation_status", "generating");

    if (queryError) {
      console.error("❌ Error querying orphaned chapters:", queryError);
      return;
    }

    if (!orphanedChapters || orphanedChapters.length === 0) {
      console.log("✅ No orphaned chapters found");
      return;
    }

    for (const chapter of orphanedChapters) {
      // Check if there are any active jobs for this chapter
      const { data: activeJobs, error: jobQueryError } = await supabase
        .from("generation_jobs")
        .select("id, status")
        .eq("chapter_id", chapter.id)
        .in("status", ["pending", "processing"]);

      if (jobQueryError) {
        console.error(`❌ Error checking jobs for chapter ${chapter.id}:`, jobQueryError);
        continue;
      }

      // If no active jobs, mark chapter as failed
      if (!activeJobs || activeJobs.length === 0) {
        const { error: updateError } = await supabase
          .from("chapters")
          .update({
            generation_status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", chapter.id);

        if (updateError) {
          console.error(`❌ Failed to cleanup orphaned chapter ${chapter.id}:`, updateError);
        } else {
          console.log(`🧹 Cleaned up orphaned chapter ${chapter.id} (no active jobs found)`);
        }
      }
    }

    console.log(`✅ Orphaned chapter cleanup completed`);
  } catch (error) {
    console.error("❌ Error in cleanupOrphanedChapters:", error);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}