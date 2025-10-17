import { JobProcessorV2 } from "./job-processor-v2.js";
import { supabase } from "./lib/supabase.js";
import { GenerationJob, WorkerConfig } from "./lib/types.js";
import { Database } from "./lib/supabase/types.js";
import { JOB_STATUS, CHAPTER_GENERATION_STATUS, JOB_STEPS } from "./lib/constants/status.js";

// Export MAX_CONCURRENT_JOBS for server metrics
export const MAX_CONCURRENT_JOBS = process.env.WORKER_CONCURRENCY ? parseInt(process.env.WORKER_CONCURRENCY) : 2;

const config: WorkerConfig = {
  pollIntervalMs: process.env.POLL_INTERVAL_MS ? parseInt(process.env.POLL_INTERVAL_MS) : 5000,
  maxRetries: process.env.MAX_RETRIES ? parseInt(process.env.MAX_RETRIES) : 2,
  workerConcurrency: MAX_CONCURRENT_JOBS,
};

let isShuttingDown = false;

// Track currently processing jobs with start times and job data
export const activeJobs = new Map<string, { startTime: Date; jobData: GenerationJob }>();

export async function startWorker() {
  console.log("🚀 Starting Smut Writer Worker");
  console.log("⚙️ Worker configuration:", { ...config, maxConcurrentJobs: MAX_CONCURRENT_JOBS });

  // Graceful shutdown handling
  const initiateShutdown = async () => {
    console.log("📡 Initiating graceful shutdown...");
    isShuttingDown = true;

    if (activeJobs.size > 0) {
      console.log(`⏳ Waiting for ${activeJobs.size} active jobs to complete...`);
      // Poll until all jobs complete
      while (activeJobs.size > 0) {
        await sleep(1000); // Wait 1 second
      }
      console.log("✅ All active jobs completed");
    }
  };

  process.on("SIGTERM", initiateShutdown);
  process.on("SIGINT", initiateShutdown);

  // Clean up orphaned chapters on startup
  await cleanupOrphanedChapters();

  // Create job processor instance
  const processor = new JobProcessorV2();

  // Main worker loop - poll more frequently when there are available slots
  while (!isShuttingDown) {
    try {
      const availableSlots = MAX_CONCURRENT_JOBS - activeJobs.size;

      if (availableSlots > 0) {
        await pollAndProcessJobs(processor);
        // Poll more frequently when slots are available (reduced interval)
        await sleep(Math.min(config.pollIntervalMs, 1000));
      } else {
        // When at max capacity, wait longer before checking again
        await sleep(config.pollIntervalMs);
      }
    } catch (error) {
      console.error("❌ Error in worker loop:", error);
      await sleep(config.pollIntervalMs);
    }
  }

  console.log("🛑 Worker shut down gracefully");
}

async function pollAndProcessJobs(processor: JobProcessorV2) {
  try {
    // Calculate available slots
    const availableSlots = MAX_CONCURRENT_JOBS - activeJobs.size;

    if (availableSlots <= 0) {
      return;
    }

    // Atomically claim jobs using the database function - only claim what we can handle
    const { data: jobs, error } = await supabase
      .rpc("claim_pending_jobs", { worker_count: availableSlots });

    const generationJobs = jobs as GenerationJob[];

    if (error) {
      console.error("❌ Error claiming jobs:", error);
      return;
    }

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return;
    }

    console.log(`📋 Claimed ${jobs.length} job(s) for processing (${activeJobs.size} active, ${availableSlots} slots available)`);

    // Start jobs immediately without waiting, tracking job data in activeJobs Map
    const jobPromises: Promise<void>[] = [];
    for (const job of generationJobs) {
      // Track the job as active with start time and job data
      activeJobs.set(job.id, { startTime: new Date(), jobData: job });

      const jobPromise = processJobWithTracking(processor, job);
      jobPromises.push(jobPromise);
    }

    // Wait for all jobs to complete (but don't block polling for new jobs)
    Promise.allSettled(jobPromises).then(() => {
      // All jobs completed, logging is handled in processJobWithTracking
    });
  } catch (error) {
    console.error("❌ Error in pollAndProcessJobs:", error);
  }
}

async function processJobWithTracking(processor: JobProcessorV2, job: GenerationJob): Promise<void> {
  try {
    console.log(`🚀 Starting job ${job.id} (${activeJobs.size}/${MAX_CONCURRENT_JOBS} slots used)`);
    await processor.processJob(job);
    console.log(`✅ Completed job ${job.id}`);
  } catch (error) {
    console.error(`❌ Error processing job ${job.id}:`, error);
  } finally {
    // Always remove job from activeJobs in finally block for safety
    activeJobs.delete(job.id);
    console.log(`🧹 Job ${job.id} removed from active jobs (${activeJobs.size}/${MAX_CONCURRENT_JOBS} slots used)`);
  }
}

export async function cleanupOrphanedChapters() {
  try {
    console.log("🔍 Checking for orphaned chapters...");

    // Find chapters that are stuck in 'generating' status
    const { data: orphanedChapters, error: queryError } = await supabase
      .from("chapters")
      .select(
        `
        id,
        generation_status,
        generation_progress,
        content
      `
      )
      .eq("generation_status", CHAPTER_GENERATION_STATUS.GENERATING);

    if (queryError) {
      console.error("❌ Error querying orphaned chapters:", queryError);
      return;
    }

    if (!orphanedChapters || orphanedChapters.length === 0) {
      console.log("✅ No orphaned chapters found");
      return;
    }

    console.log(
      `🔍 Found ${orphanedChapters.length} chapters in 'generating' status`
    );

    for (const chapter of orphanedChapters) {
      console.log(
        `🔍 Checking chapter ${chapter.id} (progress: ${chapter.generation_progress}%)...`
      );

      // Check if there are any active jobs for this chapter
      const { data: activeJobs, error: jobQueryError } = await supabase
        .from("generation_jobs")
        .select("id, status, current_step")
        .eq("chapter_id", chapter.id)
        .in("status", [JOB_STATUS.PENDING, JOB_STATUS.PROCESSING]);

      if (jobQueryError) {
        console.error(
          `❌ Error checking jobs for chapter ${chapter.id}:`,
          jobQueryError
        );
        continue;
      }

      if (activeJobs && activeJobs.length > 0) {
        console.log(
          `⏳ Chapter ${chapter.id} has ${activeJobs.length} active job(s), checking if stuck...`
        );

        // Check if jobs are stuck in processing (likely from worker restart)
        const stuckJobs = activeJobs.filter(
          (job) => job.status === JOB_STATUS.PROCESSING
        );

        if (stuckJobs.length > 0) {
          console.log(
            `🔄 Found ${stuckJobs.length} stuck job(s) for chapter ${chapter.id}, resetting to pending...`
          );

          // Reset stuck jobs to pending so they can be picked up again
          for (const stuckJob of stuckJobs) {
            const { error: resetError } = await supabase
              .from("generation_jobs")
              .update({
                status: JOB_STATUS.PENDING,
                current_step: JOB_STEPS.INITIALIZING,
                updated_at: new Date().toISOString(),
              })
              .eq("id", stuckJob.id);

            if (resetError) {
              console.error(
                `❌ Failed to reset stuck job ${stuckJob.id}:`,
                resetError
              );
            } else {
              console.log(`✅ Reset stuck job ${stuckJob.id} to pending`);
            }
          }
        }
        continue; // Skip to next chapter since this one has jobs
      }

      // No active jobs found - look for any incomplete jobs to resume
      console.log(
        `🔍 No active jobs for chapter ${chapter.id}, looking for resumable jobs...`
      );

      const { data: allJobs, error: allJobsError } = await supabase
        .from("generation_jobs")
        .select("id, status, current_step")
        .eq("chapter_id", chapter.id)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (allJobsError) {
        console.error(
          `❌ Error checking all jobs for chapter ${chapter.id}:`,
          allJobsError
        );
        continue;
      }

      if (allJobs && allJobs.length > 0) {
        const lastJob = allJobs[0];
        console.log(
          `🔍 Found last job ${lastJob.id} with status '${lastJob.status}' for chapter ${chapter.id}`
        );

        // Get the sequence and user info from the chapter
        const { data: chapterWithSequence, error: chapterFetchError } =
          await supabase
            .from("chapter_sequence_map")
            .select(
              `
            sequence_id,
            sequences!inner (
              created_by
            )
          `
            )
            .eq("chapter_id", chapter.id)
            .single();

        if (chapterFetchError) {
          console.error(
            `❌ Failed to fetch chapter sequence info for ${chapter.id}:`,
            chapterFetchError
          );
          continue;
        }

        // Create a resume job based on the last job's progress
        const shouldResume =
          chapter.content && chapter.content.trim().length > 0;

        const { error: resumeJobError } = await supabase
          .from("generation_jobs")
          .insert({
            sequence_id: chapterWithSequence.sequence_id,
            chapter_id: chapter.id,
            user_id: (chapterWithSequence.sequences as any).created_by,
            status: JOB_STATUS.PENDING,
            progress: 0,
            current_step: shouldResume ? JOB_STEPS.RESUMING : JOB_STEPS.INITIALIZING,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (resumeJobError) {
          console.error(
            `❌ Failed to create resume job for chapter ${chapter.id}:`,
            resumeJobError
          );
        } else {
          console.log(
            `🔄 Created ${shouldResume ? "resume" : "new"} job for chapter ${
              chapter.id
            }`
          );
        }
      } else {
        // No jobs found at all, mark chapter as failed
        console.log(
          `❌ No jobs found for chapter ${chapter.id}, marking as failed`
        );

        const { error: updateError } = await supabase
          .from("chapters")
          .update({
            generation_status: CHAPTER_GENERATION_STATUS.FAILED,
            updated_at: new Date().toISOString(),
          })
          .eq("id", chapter.id);

        if (updateError) {
          console.error(
            `❌ Failed to cleanup orphaned chapter ${chapter.id}:`,
            updateError
          );
        } else {
          console.log(
            `🧹 Marked orphaned chapter ${chapter.id} as failed (no jobs found)`
          );
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
