import { JobProcessor } from "./job-processor.js";
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

  // Create job processor instance
  const processor = new JobProcessor();

  // Main worker loop
  while (!isShuttingDown) {
    try {
      await pollAndProcessJobs(processor);
      await sleep(config.pollIntervalMs);
    } catch (error) {
      console.error("❌ Error in worker loop:", error);
      await sleep(config.pollIntervalMs);
    }
  }

  console.log("🛑 Worker shut down gracefully");
}

async function pollAndProcessJobs(processor: JobProcessor) {
  try {
    // Query for pending jobs
    const { data: jobs, error } = await supabase
      .from("generation_jobs")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(config.workerConcurrency);

    const generationJobs = jobs as unknown as GenerationJob[];

    if (error) {
      console.error("❌ Error fetching jobs:", error);
      return;
    }

    if (!jobs || jobs.length === 0) {
      return;
    }

    console.log(`📋 Found ${jobs.length} pending job(s)`);

    // Process jobs concurrently using the new JobProcessor
    const promises = generationJobs.map((job) => processor.processJob(job));
    await Promise.allSettled(promises);
  } catch (error) {
    console.error("❌ Error in pollAndProcessJobs:", error);
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
        .select("id, status, story_outline, bullet_progress, current_step")
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
        console.log(
          `⏳ Chapter ${chapter.id} has ${activeJobs.length} active job(s), checking if stuck...`
        );

        // Check if jobs are stuck in processing (likely from worker restart)
        const stuckJobs = activeJobs.filter(
          (job) => job.status === "processing"
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
                status: "pending",
                current_step: stuckJob.story_outline
                  ? "resuming"
                  : "initializing",
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
        .select("id, status, story_outline, bullet_progress, current_step")
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
          lastJob.story_outline ||
          (chapter.content && chapter.content.trim().length > 0);

        const { error: resumeJobError } = await supabase
          .from("generation_jobs")
          .insert({
            sequence_id: chapterWithSequence.sequence_id,
            chapter_id: chapter.id,
            user_id: (chapterWithSequence.sequences as any).created_by,
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
            `🔄 Created ${shouldResume ? "resume" : "new"} job for chapter ${
              chapter.id
            }${lastJob.story_outline ? " with existing outline" : ""}${
              lastJob.bullet_progress
                ? ` from bullet ${lastJob.bullet_progress}`
                : ""
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
