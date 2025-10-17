import { generateNewOutline } from "../generation/outline/newOutline.js";
import { regenerateOutline } from "../generation/outline/regenerateOutline.js";
import {
  generateWritingQuirks,
  selectRandomQuirk,
} from "../generation/quirks/writingQuirks.js";
import {
  Chapter,
  GenerationJob,
  Sequence,
  SpiceLevel,
  StoryLength,
  UserPrompt,
} from "../lib/types.js";
import { SequenceService } from "./sequence-service.js";

export class OutlineProcessor {
  private sequenceService = new SequenceService();

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
      const chapters = await this.generateNewOutline(
        currentPrompt,
        sequence.id
      );
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

  private async generateNewOutline(
    prompt: UserPrompt,
    sequenceId: string
  ): Promise<Chapter[]> {
    // Generate writing quirks for new outline
    console.log(`🎨 Generating writing quirks...`);
    const quirksResponse = await generateWritingQuirks(
      prompt.style,
      prompt.spice_level as SpiceLevel,
      prompt.prompt,
      "fc96ce93-b98f-4606-92fc-8fe2c4db1ef6" // Gemini 2.5 Pro - supports structured output
    );

    let selectedQuirk: string | null = null;

    if (quirksResponse && quirksResponse.quirks) {
      selectedQuirk = selectRandomQuirk(quirksResponse.quirks);
      console.log(`✨ Selected writing quirk: ${selectedQuirk}`);

      // Save the quirk to the sequence
      if (selectedQuirk) {
        await this.sequenceService.updateWritingQuirk(
          sequenceId,
          selectedQuirk
        );
      }
    } else {
      console.log(`📝 No writing quirks for this story`);
    }

    const chapters = await generateNewOutline({
      user_prompt: prompt.prompt,
      story_length: prompt.story_length as StoryLength,
      user_tags: prompt.tags,
      spice_level: prompt.spice_level as SpiceLevel,
      author_style: prompt.style,
      writingQuirk: selectedQuirk || undefined,
    });

    return chapters;
  }

  private async regenerateExistingOutline(
    _job: GenerationJob,
    sequence: Sequence,
    prompt: UserPrompt,
    _chapterIndex: number
  ): Promise<Chapter[]> {
    const existingChapters = this.getChapters(sequence);

    // For regeneration, use the existing writing quirk if available
    const existingQuirk = sequence.writing_quirk;
    console.log(
      `🔄 Using existing writing quirk: ${
        existingQuirk ? existingQuirk : "none"
      }`
    );

    const chapters = await regenerateOutline(
      prompt.prompt,
      prompt,
      existingChapters,
      existingQuirk || undefined
    );

    return chapters;
  }
}
