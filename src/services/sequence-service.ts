import { supabase } from "../lib/supabase.js";
import { Json, Tables } from "../lib/supabase/types.js";
import { Chapter, Sequence, UserPrompt } from "../lib/types.js";

export class SequenceService {
  async fetchSequence(sequenceId: string): Promise<Sequence> {
    const { data, error } = await supabase
      .from("sequences")
      .select("*")
      .eq("id", sequenceId)
      .single();

    if (error) {
      throw new Error(
        `Failed to fetch sequence ${sequenceId}: ${error.message}`
      );
    }

    if (!data) {
      throw new Error(`Sequence ${sequenceId} not found`);
    }

    return data as Sequence;
  }

  async updateSequence(
    sequenceId: string,
    updates: Partial<Tables<"sequences">>
  ): Promise<void> {
    const { error } = await supabase
      .from("sequences")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sequenceId);

    if (error) {
      throw new Error(
        `Failed to update sequence ${sequenceId}: ${error.message}`
      );
    }
  }

  getUnprocessedPrompts(sequence: Sequence): UserPrompt[] {
    if (!sequence.user_prompt_history) {
      return [];
    }

    return sequence.user_prompt_history.filter((prompt) => !prompt.processed);
  }

  async markPromptAsProcessed(
    sequenceId: string,
    promptIndex: number
  ): Promise<void> {
    const sequence = await this.fetchSequence(sequenceId);
    const prompts = sequence.user_prompt_history || [];

    if (promptIndex < 0 || promptIndex >= prompts.length) {
      throw new Error(`Invalid prompt index ${promptIndex}`);
    }

    const currentPrompt = prompts[promptIndex];
    const updatedPrompt: UserPrompt = {
      prompt: currentPrompt.prompt,
      tags: currentPrompt.tags,
      spice_level: currentPrompt.spice_level,
      story_length: currentPrompt.story_length,
      insertion_chapter_index: currentPrompt.insertion_chapter_index,
      style: currentPrompt.style,
      processed: true,
      processed_at: Date.now(),
    };
    prompts[promptIndex] = updatedPrompt;

    await this.updateSequence(sequenceId, {
      user_prompt_history: prompts as unknown as Json,
    });
  }

  async updateChapters(sequenceId: string, chapters: Chapter[]): Promise<void> {
    await this.updateSequence(sequenceId, {
      chapters: chapters as unknown as Json,
    });
  }

  getChapters(sequence: Sequence): Chapter[] {
    return sequence.chapters || [];
  }

  async updateMetadata(
    sequenceId: string,
    metadata: {
      title?: string;
      description?: string;
      tags?: string[];
      trigger_warnings?: string[];
      is_sexually_explicit?: boolean;
      target_audience?: string[];
    }
  ): Promise<void> {
    const updates: Partial<Tables<"sequences">> = {};

    if (metadata.title !== undefined) {
      updates.name = metadata.title;
    }
    if (metadata.description !== undefined) {
      updates.description = metadata.description;
    }
    if (metadata.tags !== undefined) {
      updates.tags = metadata.tags;
    }
    if (metadata.trigger_warnings !== undefined) {
      updates.trigger_warnings = metadata.trigger_warnings;
    }
    if (metadata.is_sexually_explicit !== undefined) {
      updates.is_sexually_explicit = metadata.is_sexually_explicit;
    }
    if (metadata.target_audience !== undefined) {
      updates.target_audience = metadata.target_audience;
    }

    await this.updateSequence(sequenceId, updates);
  }

  async updateEmbedding(sequenceId: string, embedding: string): Promise<void> {
    await this.updateSequence(sequenceId, { embedding });
  }
}
