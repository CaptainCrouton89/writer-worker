/**
 * Refactored job processor that works with the new database schema
 * where outline data is stored on the sequence table
 */

import { generateSequenceMetadata } from "./generation/metadata/metadata.js";
import { generateChapter } from "./generation/plot/chapter.js";
import { generateVideoWithRetry } from "./generation/video/videoGenerator.js";
import {
  fetchChapter,
  getChapterContent,
  getChapterIndex,
} from "./lib/actions/chapter.js";
import {
  JOB_STATUS,
  JOB_STEPS,
  JOB_TYPE,
  VIDEO_STEPS,
} from "./lib/constants/status.js";
import { generateEmbedding } from "./lib/embedding.js";
import { supabase } from "./lib/supabase.js";
import { Tables } from "./lib/supabase/types.js";
import { Chapter, GenerationJob, Sequence } from "./lib/types.js";
import { OutlineProcessor } from "./services/outline-processor.js";
import { SequenceService } from "./services/sequence-service.js";
import { WebhookService } from "./services/webhook-service.js";

export class JobProcessorV2 {
  private sequenceService: SequenceService;
  private outlineProcessor: OutlineProcessor;
  private webhookService: WebhookService;

  constructor() {
    this.sequenceService = new SequenceService();
    this.outlineProcessor = new OutlineProcessor();
    this.webhookService = new WebhookService();
  }

  async processJob(job: GenerationJob): Promise<void> {
    const jobId = job.id;

    if (!job.job_type) {
      throw new Error(`Job ${jobId} is missing job_type`);
    }

    console.log(`🚀 [Job ${jobId}] Starting job processing (type: ${job.job_type})`);

    try {
      // Route to appropriate processor based on job type
      if (job.job_type === JOB_TYPE.VIDEO_GENERATION) {
        await this.processVideoGenerationJob(job);
      } else if (job.job_type === JOB_TYPE.STORY_GENERATION) {
        await this.processStoryGenerationJob(job);
      } else {
        throw new Error(`Job ${jobId} has unsupported job_type: ${job.job_type}`);
      }

      console.log(`✅ [Job ${jobId}] Successfully completed job processing`);
    } catch (error) {
      console.error(`💥 [Job ${jobId}] Job processing failed:`, error);
      await this.handleJobError(jobId, error as Error);
      // Re-throw to ensure caller knows the job failed
      throw error;
    }
  }

  private async processStoryGenerationJob(job: GenerationJob): Promise<void> {
    const jobId = job.id;

    console.log(`📚 [Job ${jobId}] Processing story generation for chapter ${job.chapter_id}`);

    // Step 1: Validate job has sequence_id
    if (!job.sequence_id) {
      throw new Error(`Job ${jobId} is missing sequence_id`);
    }

    console.log(`🔍 [Job ${jobId}] Fetching sequence and chapter data`);

    // Step 2: Fetch the sequence and chapter data
    const sequence = await this.sequenceService.fetchSequence(job.sequence_id);
    const chapter = await fetchChapter(job.chapter_id);
    const chapterIndex = await getChapterIndex(job.chapter_id);

    console.log(`📋 [Job ${jobId}] Loaded chapter ${chapterIndex + 1} for sequence ${job.sequence_id}`);

    // Step 3: Process outline (generate/regenerate if needed)
    console.log(`📝 [Job ${jobId}] Processing outline`);
    await this.updateJobProgress(jobId, 5, JOB_STEPS.PROCESSING_OUTLINE);
    const outlineResult = await this.outlineProcessor.processOutline(
      job,
      sequence,
      chapterIndex
    );

    // Step 4: If outline was generated, save it and generate metadata
    if (outlineResult.wasGenerated) {
      console.log(`💾 [Job ${jobId}] Outline was generated, saving and generating metadata`);

      await this.updateJobProgress(jobId, 20, JOB_STEPS.SAVING_OUTLINE);
      await this.sequenceService.updateChapters(
        job.sequence_id,
        outlineResult.chapters
      );

      await this.updateJobProgress(jobId, 25, JOB_STEPS.GENERATING_METADATA);
      await this.generateAndSaveMetadata(
        jobId,
        job.sequence_id,
        outlineResult.chapters,
        sequence
      );

      await this.updateJobProgress(jobId, 30, JOB_STEPS.GENERATING_EMBEDDING);
      await this.generateAndSaveEmbedding(jobId, sequence);

      // Mark the prompt as processed if applicable
      if (outlineResult.processedPromptIndex !== undefined) {
        console.log(`✅ [Job ${jobId}] Marking prompt ${outlineResult.processedPromptIndex} as processed`);
        await this.sequenceService.markPromptAsProcessed(
          job.sequence_id,
          outlineResult.processedPromptIndex
        );
      }
    } else {
      console.log(`📖 [Job ${jobId}] Using existing outline`);
    }

    // Step 5: Generate the chapter content
    console.log(`✍️ [Job ${jobId}] Generating chapter content`);
    await this.updateJobProgress(
      jobId,
      35,
      JOB_STEPS.GENERATING_CHAPTER_CONTENT
    );
    await this.generateChapterContent(
      job,
      chapter,
      chapterIndex,
      outlineResult.chapters,
      sequence
    );

    // Step 6: Complete the job
    console.log(`🏁 [Job ${jobId}] Completing job`);
    await this.updateJobProgress(jobId, 100, JOB_STEPS.COMPLETING_JOB);
    await this.completeJob(
      jobId,
      job.chapter_id,
      job.sequence_id,
      chapterIndex === 0
    );
  }

  private async processVideoGenerationJob(job: GenerationJob): Promise<void> {
    const jobId = job.id;

    console.log(`🎬 [Job ${jobId}] Processing video generation for quote ${job.quote_id}`);

    // Step 1: Validate required fields for video generation
    if (!job.quote_id) {
      throw new Error(`Video generation job ${jobId} is missing quote_id`);
    }
    if (!job.chapter_id) {
      throw new Error(`Video generation job ${jobId} is missing chapter_id`);
    }
    if (!job.sequence_id) {
      throw new Error(`Video generation job ${jobId} is missing sequence_id`);
    }

    console.log(`✅ [Job ${jobId}] Validated required fields for video generation`);

    // Step 2: Fetch context data
    console.log(`🔍 [Job ${jobId}] Fetching context data`);
    await this.updateJobProgress(jobId, 10, VIDEO_STEPS.FETCHING_CONTEXT);

    const [quote, _chapter, sequence] = await Promise.all([
      this.fetchFeaturedQuote(job.quote_id),
      fetchChapter(job.chapter_id),
      this.sequenceService.fetchSequence(job.sequence_id),
    ]);

    // Step 3: Get chapter content for context
    console.log(`📄 [Job ${jobId}] Loading chapter content`);
    const chapterContent = await getChapterContent(job.chapter_id);

    // Step 4: Generate video
    console.log(`🎥 [Job ${jobId}] Starting video generation`);
    await this.updateJobProgress(jobId, 30, VIDEO_STEPS.ENHANCING_PROMPT);

    const videoUrl = await generateVideoWithRetry({
      quote,
      chapterContent,
      storyOutline: sequence.chapters,
      sequenceTitle: sequence.name || undefined,
    });

    // Step 5: Complete the job
    console.log(`🏁 [Job ${jobId}] Completing video generation job`);
    await this.updateJobProgress(jobId, 100, VIDEO_STEPS.COMPLETED);
    // For video generation, determine if it's first chapter
    const chapterIndex = await getChapterIndex(job.chapter_id);
    await this.completeJob(
      jobId,
      job.chapter_id,
      job.sequence_id,
      chapterIndex === 0
    );

    console.log(`✅ [Job ${jobId}] Video generation completed for quote ${job.quote_id}: ${videoUrl}`);
  }

  private async fetchFeaturedQuote(
    quoteId: string
  ): Promise<Tables<"featured_quotes">> {
    const { data, error } = await supabase
      .from("featured_quotes")
      .select("*")
      .eq("id", quoteId)
      .single();

    if (error) {
      throw new Error(
        `Failed to fetch featured quote ${quoteId}: ${error.message}`
      );
    }

    if (!data) {
      throw new Error(`Featured quote ${quoteId} not found`);
    }

    return data;
  }

  private async generateAndSaveMetadata(
    jobId: string,
    sequenceId: string,
    chapters: Chapter[],
    sequence: Sequence
  ): Promise<void> {
    console.log(`🏷️ [Job ${jobId}] Generating metadata for sequence ${sequenceId}`);

    // Extract story length from the latest user prompt
    const storyLength =
      sequence.user_prompt_history && sequence.user_prompt_history.length > 0
        ? sequence.user_prompt_history[sequence.user_prompt_history.length - 1]
            .story_length
        : 0;

    const outlineData = { chapters };

    // Debug logging to understand what's being passed
    console.log(`📊 [Job ${jobId}] Outline data for metadata generation:`, {
      chaptersCount: chapters.length,
      firstChapter: chapters[0]
        ? {
            name: chapters[0].name,
            plotPointsCount: chapters[0].plotPoints?.length || 0,
          }
        : null,
      storyLength,
      outlineLength: JSON.stringify(outlineData).length,
    });

    // Check if chapters are empty or malformed
    if (!chapters || chapters.length === 0) {
      console.error(`❌ [Job ${jobId}] Cannot generate metadata: No chapters in outline`);
      throw new Error(
        `Cannot generate metadata for sequence ${sequenceId}: No chapters in outline`
      );
    }

    const metadata = await generateSequenceMetadata(
      JSON.stringify(outlineData),
      storyLength,
      "fc96ce93-b98f-4606-92fc-8fe2c4db1ef6" // Gemini 2.5 Pro - always use for metadata
    );
    console.log(`✅ [Job ${jobId}] Generated metadata:`, metadata);

    await this.sequenceService.updateMetadata(sequenceId, {
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,
      trigger_warnings: metadata.trigger_warnings,
      is_sexually_explicit: metadata.is_sexually_explicit,
      target_audience: metadata.target_audience,
    });

    console.log(`✅ [Job ${jobId}] Successfully saved metadata for sequence ${sequenceId}`);
  }

  private async generateAndSaveEmbedding(jobId: string, sequence: Sequence): Promise<void> {
    console.log(`🔍 [Job ${jobId}] Generating outline embedding`);

    if (
      !sequence.user_prompt_history ||
      sequence.user_prompt_history.length === 0
    ) {
      throw new Error(`Sequence ${sequence.id} has no user prompt history`);
    }

    const latestPrompt =
      sequence.user_prompt_history[sequence.user_prompt_history.length - 1];

    const outlineText = `
    ${sequence.name}
    ${sequence.description}
    Tags: ${sequence.tags.join(", ")}
    Trigger Warnings${sequence.trigger_warnings.join(", ")}
    Sexually Explicit: ${sequence.is_sexually_explicit}
    Eroticism: ${["Low", "Medium", "High"][latestPrompt.spice_level]}
    Story Length: ${
      ["Short Story", "Novella", "Novel/Slow Burn"][latestPrompt.story_length]
    }`;
    const embeddingVector = await generateEmbedding(outlineText);

    await this.sequenceService.updateEmbedding(
      sequence.id,
      JSON.stringify(embeddingVector)
    );

    console.log(`✅ [Job ${jobId}] Successfully saved embedding for sequence ${sequence.id}`);
  }

  private async generateChapterContent(
    job: GenerationJob,
    chapter: Tables<"chapters">,
    chapterIndex: number,
    chapters: Chapter[],
    sequence: Sequence
  ): Promise<void> {
    const jobId = job.id;

    console.log(`✍️ [Job ${jobId}] Generating content for chapter ${chapterIndex + 1}`);

    // Log model ID if available
    if (job.model_id) {
      const { data: aiModel } = await supabase
        .from("ai_models")
        .select("provider, model_name")
        .eq("id", job.model_id)
        .single();

      if (aiModel) {
        console.log(
          `🤖 [Job ${jobId}] Using AI model: ${aiModel.provider}/${aiModel.model_name}`
        );
      }
    }

    // Get previous chapter content for context
    console.log(`📖 [Job ${jobId}] Loading previous chapter content for context`);
    const previousChapterContent = chapter.parent_id
      ? await getChapterContent(chapter.parent_id)
      : "";

    if (previousChapterContent.length === 0 && chapterIndex > 0) {
      throw new Error(
        `Failed to fetch parent chapter content with id ${chapter.parent_id}`
      );
    }

    if (
      !sequence.user_prompt_history ||
      sequence.user_prompt_history.length === 0
    ) {
      throw new Error(`Sequence ${sequence.id} has no user prompt history`);
    }

    const latestPrompt =
      sequence.user_prompt_history[sequence.user_prompt_history.length - 1];

    console.log(`🎯 [Job ${jobId}] Starting chapter content generation`);

    // Generate the chapter content
    const chapterContent = await generateChapter(
      job,
      chapterIndex,
      latestPrompt,
      chapters,
      previousChapterContent,
      job.model_id || undefined,
      sequence.writing_quirk
    );

    console.log(
      `✅ [Job ${jobId}] Generated ${chapterContent.length} characters for chapter ${
        chapterIndex + 1
      }`
    );
  }

  private async completeJob(
    jobId: string,
    chapterId: string,
    sequenceId: string,
    isFirstChapter: boolean
  ): Promise<void> {
    const { error } = await supabase
      .from("generation_jobs")
      .update({
        status: JOB_STATUS.COMPLETED,
        completed_at: new Date().toISOString(),
        progress: 100,
        current_step: JOB_STEPS.COMPLETED,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (error) {
      throw new Error(`Failed to complete job ${jobId}: ${error.message}`);
    }

    console.log(`✅ [Job ${jobId}] Completed job for chapter ${chapterId}`);

    // Send webhook notification
    console.log(`🔗 [Job ${jobId}] Sending webhook notification`);
    await this.webhookService.notifyJobCompletion({
      jobId,
      sequenceId,
      chapterId,
      isFirstChapter,
    });

    console.log(`📡 [Job ${jobId}] Webhook notification sent successfully`);
  }

  private async handleJobError(jobId: string, error: Error): Promise<void> {
    console.error(`❌ [Job ${jobId}] Job failed with error: ${error.message}`);
    console.error(`💀 [Job ${jobId}] Error stack:`, error.stack || error);

    console.log(`📝 [Job ${jobId}] Updating job status to failed`);

    try {
      const { error: updateError } = await supabase
        .from("generation_jobs")
        .update({
          status: JOB_STATUS.FAILED,
          error_message: error.message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      if (updateError) {
        console.error(`💥 [Job ${jobId}] Failed to update job status to failed:`, updateError);
        throw new Error(`Failed to update job ${jobId}: ${updateError.message}`);
      }

      console.log(`✅ [Job ${jobId}] Successfully marked job as failed in database`);
    } catch (dbError) {
      console.error(`🚨 [Job ${jobId}] Critical error updating job status:`, dbError);
      throw dbError;
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
      console.error(`⚠️ [Job ${jobId}] Failed to update job progress (${progress}%, ${step}):`, error);
      // Don't throw here as progress updates are not critical for job completion
    } else {
      console.log(`📊 [Job ${jobId}] Progress updated: ${progress}% - ${step}`);
    }
  }
}
