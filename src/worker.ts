import {
  generateCompleteFirstChapter,
  generateStoryOutline,
  StoryOutline,
  UserPreferences,
} from "./lib/generation-service.js";
import { supabase } from "./lib/supabase.js";
import { GenerationJob, WorkerConfig } from "./lib/types.js";

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
    const preferences = job.user_preferences as unknown as UserPreferences;

    // Check if we need to resume or start fresh
    let outline: StoryOutline;
    if (job.story_outline) {
      console.log(`📋 Resuming with existing outline for job ${job.id}`);
      outline = job.story_outline as unknown as StoryOutline;
      await updateJobProgress(job.id, "using_existing_outline", 20);
    } else {
      console.log(`🔮 Generating new outline for job ${job.id}`);
      await updateJobProgress(job.id, "generating_outline", 5);

      const outlineResult = await generateStoryOutline(preferences);
      if (!outlineResult.success) {
        throw new Error(outlineResult.error);
      }

      outline = outlineResult.data;
      
      await updateJobProgress(job.id, "saving_outline", 15);

      // Save the outline to the job
      const { error: outlineError } = await supabase
        .from("generation_jobs")
        .update({
          story_outline: outline as unknown as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      if (outlineError) {
        console.error(
          `❌ Failed to save outline for job ${job.id}:`,
          outlineError
        );
        throw new Error(`Failed to save outline: ${outlineError.message}`);
      } else {
        console.log(`✅ Outline saved for job ${job.id}`);
        await updateJobProgress(job.id, "outline_saved", 20);
      }
    }

    // Generate the complete first chapter with streaming updates
    await updateJobProgress(job.id, "generating_content", 10);

    // Check if this is a resume job
    const isResumeJob = job.current_step === "resuming";

    const generationResult = await generateCompleteFirstChapter(
      preferences,
      job.chapter_id,
      async (step: string, progress: number) => {
        await updateJobProgress(job.id, step, progress);
      },
      outline, // Pass the outline we already have
      isResumeJob, // Enable resume functionality if this is a resume job
      job.id // Pass job ID for bullet progress tracking
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
      console.error(
        `❌ Failed to update chapter status for job ${job.id}:`,
        chapterStatusError
      );
      return;
    }

    console.log(
      `✅ Successfully completed job ${job.id} and updated chapter ${job.chapter_id}`
    );
  } catch (error) {
    console.error(`❌ Error processing job ${job.id}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await handleJobError(job.id, errorMessage);
  }
}

async function updateJobProgress(
  jobId: string,
  step: string,
  progress: number
) {
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
      console.error(
        `❌ Failed to fetch job for error handling ${jobId}:`,
        fetchError
      );
      return;
    }

    // Parse retry count from error message (simple implementation)
    const currentRetries = job.error_message?.includes("Retry")
      ? parseInt(job.error_message.match(/Retry (\d+)/)?.[1] || "0")
      : 0;

    if (currentRetries < config.maxRetries) {
      // Reset to pending for retry
      const { error: retryError } = await supabase
        .from("generation_jobs")
        .update({
          status: "pending",
          error_message: `Retry ${currentRetries + 1}/${
            config.maxRetries
          }: ${errorMessage}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      if (retryError) {
        console.error(`❌ Failed to retry job ${jobId}:`, retryError);
      } else {
        console.log(
          `🔄 Retrying job ${jobId} (attempt ${currentRetries + 1}/${
            config.maxRetries
          })`
        );
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
        console.error(
          `❌ Failed to update chapter status to failed for job ${jobId}:`,
          chapterStatusError
        );
      }

      console.log(
        `💀 Job ${jobId} failed after ${config.maxRetries} retries, chapter ${job.chapter_id} marked as failed`
      );
    }
  } catch (error) {
    console.error(`❌ Error in handleJobError for job ${jobId}:`, error);
  }
}

async function cleanupOrphanedChapters() {
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
      .eq("generation_status", "generating");

    if (queryError) {
      console.error("❌ Error querying orphaned chapters:", queryError);
      return;
    }

    if (!orphanedChapters || orphanedChapters.length === 0) {
      console.log("✅ No orphaned chapters found");
      return;
    }

    console.log(`🔍 Found ${orphanedChapters.length} chapters in 'generating' status`);

    for (const chapter of orphanedChapters) {
      console.log(`🔍 Checking chapter ${chapter.id} (progress: ${chapter.generation_progress}%)...`);
      
      // Check if there are any active jobs for this chapter
      const { data: activeJobs, error: jobQueryError } = await supabase
        .from("generation_jobs")
        .select("id, status, story_outline, user_preferences, bullet_progress, current_step")
        .eq("chapter_id", chapter.id)
        .in("status", ["pending", "processing"]);

      if (jobQueryError) {
        console.error(
          `❌ Error checking jobs for chapter ${chapter.id}:`,
          jobQueryError
        );
        continue;
      }

      if (activeJobs && activeJobs.length > 0) {
        console.log(`⏳ Chapter ${chapter.id} has ${activeJobs.length} active job(s), checking if stuck...`);
        
        // Check if jobs are stuck in processing (likely from worker restart)
        const stuckJobs = activeJobs.filter(job => job.status === "processing");
        
        if (stuckJobs.length > 0) {
          console.log(`🔄 Found ${stuckJobs.length} stuck job(s) for chapter ${chapter.id}, resetting to pending...`);
          
          // Reset stuck jobs to pending so they can be picked up again
          for (const stuckJob of stuckJobs) {
            const { error: resetError } = await supabase
              .from("generation_jobs")
              .update({
                status: "pending",
                current_step: stuckJob.story_outline ? "resuming" : "initializing",
                updated_at: new Date().toISOString(),
              })
              .eq("id", stuckJob.id);

            if (resetError) {
              console.error(`❌ Failed to reset stuck job ${stuckJob.id}:`, resetError);
            } else {
              console.log(`✅ Reset stuck job ${stuckJob.id} to pending`);
            }
          }
        }
        continue; // Skip to next chapter since this one has jobs
      }

      // No active jobs found - look for any incomplete jobs to resume
      console.log(`🔍 No active jobs for chapter ${chapter.id}, looking for resumable jobs...`);
      
      const { data: allJobs, error: allJobsError } = await supabase
        .from("generation_jobs")
        .select("id, status, story_outline, user_preferences, bullet_progress, current_step")
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
        console.log(`🔍 Found last job ${lastJob.id} with status '${lastJob.status}' for chapter ${chapter.id}`);

        // Get the sequence and user info from the chapter
        const { data: chapterWithSequence, error: chapterFetchError } = await supabase
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
        const shouldResume = lastJob.story_outline || (chapter.content && chapter.content.trim().length > 0);
        
        const { error: resumeJobError } = await supabase
          .from("generation_jobs")
          .insert({
            sequence_id: chapterWithSequence.sequence_id,
            chapter_id: chapter.id,
            user_id: (chapterWithSequence.sequences as any).created_by,
            user_preferences: lastJob.user_preferences,
            story_outline: lastJob.story_outline,
            bullet_progress: lastJob.bullet_progress || 0,
            status: "pending",
            progress: 0,
            current_step: shouldResume ? "resuming" : "initializing",
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
            `🔄 Created ${shouldResume ? 'resume' : 'new'} job for chapter ${chapter.id}${lastJob.story_outline ? ' with existing outline' : ''}${lastJob.bullet_progress ? ` from bullet ${lastJob.bullet_progress}` : ''}`
          );
        }
      } else {
        // No jobs found at all, mark chapter as failed
        console.log(`❌ No jobs found for chapter ${chapter.id}, marking as failed`);
        
        const { error: updateError } = await supabase
          .from("chapters")
          .update({
            generation_status: "failed",
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
