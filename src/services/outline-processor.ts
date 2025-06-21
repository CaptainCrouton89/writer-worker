import { Tables } from "../lib/supabase/types.js";
import { UserPromptHistory, Chapter } from "../lib/types.js";
import { generateNewOutline } from "../generation/outline/newOutline.js";
import { regenerateOutline } from "../generation/outline/regenerateOutline.js";
import { GenerationJob } from "../lib/types.js";

export class OutlineProcessor {
  async processOutline(
    job: GenerationJob,
    sequence: Tables<"sequences">,
    chapterIndex: number
  ): Promise<{
    chapters: Chapter[];
    wasGenerated: boolean;
    processedPromptIndex?: number;
  }> {
    const unprocessedPrompts = this.getUnprocessedPrompts(sequence);
    const existingChapters = this.getChapters(sequence);

    if (unprocessedPrompts.length === 0) {
      console.log(`📋 No unprocessed prompts, using existing outline`);
      return {
        chapters: existingChapters,
        wasGenerated: false,
      };
    }

    const currentPrompt = unprocessedPrompts[0];
    const promptIndex = this.findPromptIndex(sequence, currentPrompt);

    if (existingChapters.length === 0) {
      console.log(`🔮 No outline exists, generating new outline`);
      const chapters = await this.generateNewOutline(currentPrompt);
      return {
        chapters,
        wasGenerated: true,
        processedPromptIndex: promptIndex,
      };
    } else {
      console.log(`🔄 Regenerating outline with user prompt at chapter ${currentPrompt.insertion_chapter_index}`);
      const chapters = await this.regenerateExistingOutline(
        job,
        sequence,
        currentPrompt,
        chapterIndex
      );
      return {
        chapters,
        wasGenerated: true,
        processedPromptIndex: promptIndex,
      };
    }
  }

  private getUnprocessedPrompts(sequence: Tables<"sequences">): UserPromptHistory[] {
    if (!sequence.user_prompt_history) {
      return [];
    }
    const prompts = sequence.user_prompt_history as UserPromptHistory[];
    return prompts.filter(prompt => !prompt.processed);
  }

  private getChapters(sequence: Tables<"sequences">): Chapter[] {
    if (!sequence.chapters) {
      return [];
    }
    return sequence.chapters as Chapter[];
  }

  private findPromptIndex(
    sequence: Tables<"sequences">,
    prompt: UserPromptHistory
  ): number {
    const prompts = (sequence.user_prompt_history || []) as UserPromptHistory[];
    return prompts.findIndex(p => 
      p.prompt === prompt.prompt && 
      p.insertion_chapter_index === prompt.insertion_chapter_index
    );
  }

  private async generateNewOutline(prompt: UserPromptHistory): Promise<Chapter[]> {
    const chapters = await generateNewOutline({
      user_prompt: prompt.prompt,
      story_length: prompt.story_length,
      user_tags: prompt.tags,
      spice_level: prompt.spice_level,
    });

    return chapters;
  }

  private async regenerateExistingOutline(
    job: GenerationJob,
    sequence: Tables<"sequences">,
    prompt: UserPromptHistory,
    chapterIndex: number
  ): Promise<Chapter[]> {

    const existingChapters = this.getChapters(sequence);
    
    const chapters = await regenerateOutline(
      prompt.prompt,
      prompt,
      existingChapters,
      chapterIndex
    );
    
    return chapters;
  }
}