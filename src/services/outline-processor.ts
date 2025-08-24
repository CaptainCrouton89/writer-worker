import { generateNewOutline } from "../generation/outline/newOutline.js";
import { regenerateOutline } from "../generation/outline/regenerateOutline.js";
import {
  Chapter,
  GenerationJob,
  Sequence,
  SpiceLevel,
  StoryLength,
  UserPrompt,
} from "../lib/types.js";

export class OutlineProcessor {
  async processOutline(
    job: GenerationJob,
    sequence: Sequence,
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
      console.log(
        `🔄 Regenerating outline with user prompt at chapter ${currentPrompt.insertion_chapter_index}`
      );
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

  private getUnprocessedPrompts(sequence: Sequence): UserPrompt[] {
    if (!sequence.user_prompt_history) {
      return [];
    }
    return sequence.user_prompt_history.filter((prompt) => !prompt.processed);
  }

  private getChapters(sequence: Sequence): Chapter[] {
    return sequence.chapters || [];
  }

  private findPromptIndex(sequence: Sequence, prompt: UserPrompt): number {
    const prompts = sequence.user_prompt_history || [];
    return prompts.findIndex(
      (p) =>
        p.prompt === prompt.prompt &&
        p.insertion_chapter_index === prompt.insertion_chapter_index
    );
  }

  private async generateNewOutline(prompt: UserPrompt): Promise<Chapter[]> {
    const chapters = await generateNewOutline({
      user_prompt: prompt.prompt,
      story_length: prompt.story_length as StoryLength,
      user_tags: prompt.tags,
      spice_level: prompt.spice_level as SpiceLevel,
      author_style: prompt.style,
    });

    return chapters;
  }

  private async regenerateExistingOutline(
    job: GenerationJob,
    sequence: Sequence,
    prompt: UserPrompt,
    chapterIndex: number
  ): Promise<Chapter[]> {
    const existingChapters = this.getChapters(sequence);

    const chapters = await regenerateOutline(
      prompt.prompt,
      prompt,
      existingChapters
    );

    return chapters;
  }
}
