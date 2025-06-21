/**
 * Clean job processing pipeline - replaces the complex worker logic
 * with a clear, maintainable flow
 */

import { generateSequenceMetadata } from "./generation/metadata/metadata.js";
import { generateNewOutline } from "./generation/outline/newOutline.js";
import { regenerateOutline } from "./generation/outline/regenerateOutline.js";
import { generateChapter } from "./generation/plot/chapter.js";
import {
  fetchChapter,
  getChapterContent,
  getChapterIndex,
} from "./lib/actions/chapter.js";
import { generateEmbedding } from "./lib/embedding.js";
import { supabase } from "./lib/supabase.js";
import { Json, Tables } from "./lib/supabase/types.js";
import { GenerationJob } from "./lib/types.js";
import { StoryOutline } from "./lib/types/generation.js";
import { parseOutlineResponse } from "./lib/utils/outline.js";

export class JobProcessor {
  async processJob(job: GenerationJob): Promise<void> {
    try {
      console.log(`🔄 Processing job ${job.id} for chapter ${job.chapter_id}`);

      // Step 1: Lock the job
      await this.lockJob(job.id);

      // Step 2: Fetch the corresponding chapter
      const chapter = await fetchChapter(job.chapter_id);
      const chapterIndex = await getChapterIndex(job.chapter_id);

      // Step 3: Handle outline logic
      await this.updateJobProgress(job.id, 15, "outlining");
      const outline = await this.handleOutline(job, chapterIndex);

      // Step 4: Generate metadata if outline was created/updated
      if (this.shouldGenerateMetadata(job)) {
        await this.updateJobProgress(job.id, 25, "generating_metadata");
        await this.generateStoryMetadata(job, outline);
        await this.updateJobProgress(job.id, 35, "generating_embedding");
        await this.generateEmbedding(job, outline);
      }

      // Step 5: Generate the assigned chapter content
      await this.updateJobProgress(job.id, 40, "generating_chapter_content");
      await this.generateChapterContent(job, chapter, chapterIndex, outline);

      // Step 6: Complete the job
      await this.updateJobProgress(job.id, 100, "completing_job");
      await this.completeJob(job.id, job.chapter_id);
    } catch (error) {
      await this.handleJobError(job.id, error as Error);
    }
  }

  private async lockJob(jobId: string): Promise<void> {
    console.log(`🔒 Locking job ${jobId}`);

    const { error } = await supabase
      .from("generation_jobs")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
        current_step: "initializing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (error) {
      throw new Error(`Failed to lock job ${jobId}: ${error.message}`);
    }
  }

  private async handleOutline(
    job: GenerationJob,
    chapterIndex: number
  ): Promise<StoryOutline> {
    console.log(job);
    const hasUserPrompt = !!job.user_prompt;
    const hasOutline =
      !!job.story_outline &&
      !!job.story_outline.chapters &&
      job.story_outline.chapters.length > 0;

    if (!hasOutline) {
      // Case 1: No outline exists - generate new one
      console.log(`🔮 No outline exists, generating new outline`);
      return await this.generateNewOutline(job);
    } else if (hasUserPrompt) {
      // Case 2: Outline exists + user prompt - regenerate outline
      console.log(`🔄 User prompt provided, regenerating outline`);
      return await this.regenerateOutline(job, chapterIndex);
    } else {
      // Case 3: Outline exists, no prompt - use existing
      console.log(`📋 Using existing outline`);
      return job.story_outline as unknown as StoryOutline;
    }
  }

  private async generateNewOutline(job: GenerationJob): Promise<StoryOutline> {
    console.log(`🔮 Generating new story outline`);

    const outlineString = await generateNewOutline({
      user_prompt: job.story_outline.user_prompt,
      story_length: job.story_outline.story_length,
      user_tags: job.story_outline.user_tags as string[],
      spice_level: (job.story_outline.spice_level as number) || 1,
    });

    console.log(outlineString);

    const chapters = parseOutlineResponse(outlineString);

    const newOutline = {
      ...(job.story_outline as unknown as StoryOutline),
      chapters,
    };

    const { error } = await supabase
      .from("generation_jobs")
      .update({
        story_outline: newOutline as unknown as Json,
        current_step: "outline_generated",
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    if (error) {
      throw new Error(
        `Failed to save outline for job ${job.id}: ${error.message}`
      );
    }

    return newOutline;
  }

  private async regenerateOutline(
    job: GenerationJob,
    chapterIndex: number
  ): Promise<StoryOutline> {
    console.log(`🔄 Regenerating outline with user prompt`);

    const newOutlineString = await regenerateOutline(job, chapterIndex);

    const newChapters = parseOutlineResponse(newOutlineString);

    const newOutline = {
      ...(job.story_outline as unknown as StoryOutline),
      chapters: newChapters,
    } as unknown as StoryOutline;

    const { error } = await supabase
      .from("generation_jobs")
      .update({
        story_outline: newOutline as unknown as Json,
        user_prompt: null,
        current_step: "outline_regenerated",
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    if (error) {
      throw new Error(
        `Failed to save regenerated outline for job ${job.id}: ${error.message}`
      );
    }

    return newOutline;
  }

  private shouldGenerateMetadata(job: GenerationJob): boolean {
    // Generate metadata if outline was just created (no existing outline)
    // OR if outline was regenerated (user prompt provided)
    const hadNoOutline =
      !job.story_outline ||
      !job.story_outline.chapters ||
      job.story_outline.chapters.length === 0;
    const hasUserPrompt = !!job.user_prompt;

    console.log(
      `🤔 Should generate metadata? hadNoOutline: ${hadNoOutline}, hasUserPrompt: ${hasUserPrompt}`
    );

    return hadNoOutline || hasUserPrompt;
  }

  private async generateStoryMetadata(
    job: GenerationJob,
    outline: StoryOutline
  ): Promise<void> {
    console.log(`🏷️ Generating metadata for sequence ${job.sequence_id}`);

    const metadata = await generateSequenceMetadata(JSON.stringify(outline));
    console.log(`✅ Generated metadata:`, metadata);

    const { error } = await supabase
      .from("sequences")
      .update({
        name: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        trigger_warnings: metadata.trigger_warnings,
        is_sexually_explicit: metadata.is_sexually_explicit,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.sequence_id!);

    if (error) {
      throw new Error(
        `Failed to update sequence metadata for ${job.sequence_id}: ${error.message}`
      );
    }

    console.log(
      `✅ Successfully saved metadata for sequence ${job.sequence_id}`
    );
  }

  private async generateEmbedding(
    job: GenerationJob,
    outline: StoryOutline
  ): Promise<void> {
    console.log(`🔍 Generating outline embedding`);

    const outlineText = JSON.stringify(outline);
    const embeddingVector = await generateEmbedding(outlineText);

    const { error } = await supabase
      .from("sequences")
      .update({
        embedding: embeddingVector.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.sequence_id!);

    if (error) {
      throw new Error(
        `Failed to save embedding for sequence ${job.sequence_id}: ${error.message}`
      );
    }
  }

  private async generateChapterContent(
    job: GenerationJob,
    chapter: Tables<"chapters">,
    chapterIndex: number,
    outline: StoryOutline
  ): Promise<void> {
    console.log(`✍️ Generating content for chapter ${chapterIndex + 1}`);

    // Get previous chapter content for context
    const previousChapterContent = chapter.parent_id
      ? await getChapterContent(chapter.parent_id)
      : "";

    if (previousChapterContent.length === 0 && chapterIndex > 0) {
      throw new Error(
        `Failed to fetch parent chapter content with id ${chapter.parent_id}`
      );
    }

    // Generate the chapter content using the plot point generator
    const chapterContent = await generateChapter(
      job,
      chapterIndex,
      outline,
      previousChapterContent
    );

    console.log(
      `✅ Generated ${chapterContent.length} characters for chapter ${
        chapterIndex + 1
      }`
    );
  }

  private async completeJob(jobId: string, chapterId: string): Promise<void> {
    const { error } = await supabase
      .from("generation_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        progress: 100,
        current_step: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (error) {
      throw new Error(`Failed to complete job ${jobId}: ${error.message}`);
    }

    console.log(`✅ Completing job ${jobId} and chapter ${chapterId}`);
  }

  private async handleJobError(jobId: string, error: Error): Promise<void> {
    console.error(`❌ Job ${jobId} failed:`, error.message);
    console.error("Error details:", error.stack || error);

    const { error: updateError } = await supabase
      .from("generation_jobs")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (updateError) {
      console.error(`Failed to update failed job status for ${jobId}:`, updateError);
      throw new Error(`Failed to update job ${jobId}: ${updateError.message}`);
    }
  }

  private async updateJobProgress(
    jobId: string,
    progress: number,
    step: string
  ): Promise<void> {
    await supabase
      .from("generation_jobs")
      .update({
        progress,
        updated_at: new Date().toISOString(),
        current_step: step,
      })
      .eq("id", jobId);
  }
}

/**
 * Usage in worker:
 *
 * const processor = new JobProcessor();
 * for (const job of pendingJobs) {
 *   await processor.processJob(job);
 * }
 */
