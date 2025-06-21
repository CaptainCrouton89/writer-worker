/**
 * Refactored job processor that works with the new database schema
 * where outline data is stored on the sequence table
 */

import { generateSequenceMetadata } from "./generation/metadata/metadata.js";
import { generateChapter } from "./generation/plot/chapter.js";
import {
  fetchChapter,
  getChapterContent,
  getChapterIndex,
} from "./lib/actions/chapter.js";
import { generateEmbedding } from "./lib/embedding.js";
import { supabase } from "./lib/supabase.js";
import { Tables } from "./lib/supabase/types.js";
import { GenerationJob, Chapter } from "./lib/types.js";
import { SequenceService } from "./services/sequence-service.js";
import { OutlineProcessor } from "./services/outline-processor.js";

export class JobProcessorV2 {
  private sequenceService: SequenceService;
  private outlineProcessor: OutlineProcessor;

  constructor() {
    this.sequenceService = new SequenceService();
    this.outlineProcessor = new OutlineProcessor();
  }

  async processJob(job: GenerationJob): Promise<void> {
    try {
      console.log(`🔄 Processing job ${job.id} for chapter ${job.chapter_id}`);

      // Step 1: Lock the job
      await this.lockJob(job.id);

      // Step 2: Validate job has sequence_id
      if (!job.sequence_id) {
        throw new Error(`Job ${job.id} is missing sequence_id`);
      }

      // Step 3: Fetch the sequence and chapter data
      const sequence = await this.sequenceService.fetchSequence(job.sequence_id);
      const chapter = await fetchChapter(job.chapter_id);
      const chapterIndex = await getChapterIndex(job.chapter_id);

      // Step 4: Process outline (generate/regenerate if needed)
      await this.updateJobProgress(job.id, 15, "processing_outline");
      const outlineResult = await this.outlineProcessor.processOutline(
        job,
        sequence,
        chapterIndex
      );

      // Step 5: If outline was generated, save it and generate metadata
      if (outlineResult.wasGenerated) {
        await this.updateJobProgress(job.id, 25, "saving_outline");
        await this.sequenceService.updateChapters(job.sequence_id, outlineResult.chapters);

        await this.updateJobProgress(job.id, 30, "generating_metadata");
        await this.generateAndSaveMetadata(job.sequence_id, outlineResult.chapters);

        await this.updateJobProgress(job.id, 35, "generating_embedding");
        await this.generateAndSaveEmbedding(job.sequence_id, outlineResult.chapters);

        // Mark the prompt as processed if applicable
        if (outlineResult.processedPromptIndex !== undefined) {
          await this.sequenceService.markPromptAsProcessed(
            job.sequence_id,
            outlineResult.processedPromptIndex
          );
        }
      }

      // Step 6: Generate the chapter content
      await this.updateJobProgress(job.id, 40, "generating_chapter_content");
      await this.generateChapterContent(
        job,
        chapter,
        chapterIndex,
        outlineResult.chapters
      );

      // Step 7: Complete the job
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

  private async generateAndSaveMetadata(
    sequenceId: string,
    chapters: Chapter[]
  ): Promise<void> {
    console.log(`🏷️ Generating metadata for sequence ${sequenceId}`);

    const outlineData = { chapters };
    const metadata = await generateSequenceMetadata(JSON.stringify(outlineData));
    console.log(`✅ Generated metadata:`, metadata);

    await this.sequenceService.updateMetadata(sequenceId, {
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,
      trigger_warnings: metadata.trigger_warnings,
      is_sexually_explicit: metadata.is_sexually_explicit,
    });

    console.log(`✅ Successfully saved metadata for sequence ${sequenceId}`);
  }

  private async generateAndSaveEmbedding(
    sequenceId: string,
    chapters: Chapter[]
  ): Promise<void> {
    console.log(`🔍 Generating outline embedding`);

    const outlineText = JSON.stringify({ chapters });
    const embeddingVector = await generateEmbedding(outlineText);

    await this.sequenceService.updateEmbedding(
      sequenceId,
      embeddingVector.toString()
    );

    console.log(`✅ Successfully saved embedding for sequence ${sequenceId}`);
  }

  private async generateChapterContent(
    job: GenerationJob,
    chapter: Tables<"chapters">,
    chapterIndex: number,
    chapters: Chapter[]
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

    // Build the outline structure expected by generateChapter
    const outlineStructure = {
      chapters,
      user_prompt: "",
      story_length: 0,
      user_tags: [],
      spice_level: 1,
    };

    // Generate the chapter content
    const chapterContent = await generateChapter(
      job,
      chapterIndex,
      outlineStructure,
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

    console.log(`✅ Completed job ${jobId} for chapter ${chapterId}`);
  }

  private async handleJobError(jobId: string, error: Error): Promise<void> {
    console.error(`❌ Job ${jobId} failed:`, error.message);
    console.error("Error details:", error.stack || error);

    const { error: updateError } = await supabase
      .from("generation_jobs")
      .update({
        status: "failed",
        error_message: error.message,
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
    const { error } = await supabase
      .from("generation_jobs")
      .update({
        progress,
        current_step: step,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (error) {
      console.error(`Failed to update job progress for ${jobId}:`, error);
    }
  }
}