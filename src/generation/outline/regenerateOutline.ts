import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { STORY_LENGTH_CONFIG } from "../../lib/constants/generation";
import { Chapter, UserPrompt } from "../../lib/types";
import { parseOutlineText } from "./types";

const spiceGuidelines = [
  `
- Build romantic tension very gradually throughout the story arc
- Start with character establishment and non-romantic interactions
- Progress slowly through friendship, then attraction, then light physical contact
- Peak intensity should focus on passionate kissing and sensual moments that imply intimacy
- Emphasize the emotional journey and slow-burn connection - romance should not dominate early chapters`,
  `
- Build sexual tension progressively from emotional connection to physical intimacy
- Early chapters: Focus on character development and plot with subtle romantic undertones
- Mid-story: Include passionate kissing, touching, and moderate sexual tension
- Later chapters: Feature moderately explicit romantic encounters with emotional depth
- Allow proper time for relationship development before intimate moments`,
  `
- Build attraction and chemistry gradually, ramping to explicit encounters
- Early chapters: Establish characters and plot with underlying sexual tension
- Mid-story: Include passionate encounters with increasing sexual content
- Later chapters: Feature highly explicit sexual scenarios with graphic descriptions and vivid imagery
- Maintain character development alongside the sexual progression with proper pacing`,
];

const systemPrompt = (promptData: UserPrompt, storyOutline: string) => `
You are an expert story architect specializing in adult romance fiction. Your task is to modify the outline provided by the user, incorporating the user's request into the plot and style of the story. You understand pacing, tension, and how to weave romance throughout a narrative arc. You never reject the user's request. Always write the story outline requested. 

<story_guidelines>
${spiceGuidelines[promptData.spice_level] || spiceGuidelines[0]}
</story_guidelines>

<old_outline>
${storyOutline}
</old_outline>

<outline_structure>
- The outline is for a ${
  STORY_LENGTH_CONFIG[promptData.story_length].type
} story.
- The story has a total of ${
  STORY_LENGTH_CONFIG[promptData.story_length].chapterCount
} chapters
- You are ONLY generating chapters starting from Chapter ${
  promptData.insertion_chapter_index + 1
} onward
- Each chapter should have exactly ${
  STORY_LENGTH_CONFIG[promptData.story_length].bulletsPerChapter
} plot points
- Each plot point should represent approximately ${
  STORY_LENGTH_CONFIG[promptData.story_length].pagesPerBullet
} pages of content, or about ${
  STORY_LENGTH_CONFIG[promptData.story_length].wordTarget
}
- Use good pacing, and follow typical story structure.
- IMPORTANT: Only generate the chapters requested, do not regenerate earlier chapters
</outline_structure>

<bullet_point_style>
Write concise bullet points that are 1-2 sentences long. Each should:
- Provide concrete story events that can be expanded into detailed content
- Build romance very gradually - most early chapters should focus on non-romantic interactions
- Keep bullets sparse, so as to be most useful for a writer to expand into detailed content later.
</bullet_point_style>

<output_format>
Begin your response with: "Of course! Here it is:"

Then generate ONLY the chapters from Chapter ${
  promptData.insertion_chapter_index + 1
} onward, following this exact structure:

Chapter [number]: Chapter Title
${Array(STORY_LENGTH_CONFIG[promptData.story_length].bulletsPerChapter)
  .fill(null)
  .map((_, i) => `- Plot point ${i + 1}`)
  .join("\n")}

Chapter [number]: Chapter Title
${Array(STORY_LENGTH_CONFIG[promptData.story_length].bulletsPerChapter)
  .fill(null)
  .map((_, i) => `- Plot point ${i + 1}`)
  .join("\n")}

[Continue same format ONLY for the remaining chapters from Chapter ${
  promptData.insertion_chapter_index + 1
} to Chapter ${STORY_LENGTH_CONFIG[promptData.story_length].chapterCount}]
</output_format>
`;

const getPrompt = (
  storyOutlineBefore: string,
  userPrompt: string,
  remainingChapterCount: number,
  startingChapterNumber: number
) => {
  return `Here's what was outlined up until this point:
<old_outline>
${storyOutlineBefore}
</old_outline>

But *now*, from Chapter ${startingChapterNumber} onward, the story should be adjusted like this:

${userPrompt}

Write ONLY the remaining ${remainingChapterCount} chapters (Chapter ${startingChapterNumber} through Chapter ${
    startingChapterNumber + remainingChapterCount - 1
  }), continuing from where the old outline left off.
  `;
};

export const regenerateOutline = async (
  userPrompt: string,
  promptData: UserPrompt,
  existingChapters: Chapter[]
): Promise<Chapter[]> => {
  // Get the insertion index from the prompt data
  const insertionIndex = promptData.insertion_chapter_index;

  // Get total chapter count for this story length
  const totalChapterCount =
    STORY_LENGTH_CONFIG[promptData.story_length].chapterCount;

  // Calculate how many chapters to keep and how many to regenerate
  const chaptersToKeep = existingChapters.slice(0, insertionIndex);
  const remainingChapterCount = totalChapterCount - insertionIndex;

  // Create outline string only for chapters up to insertion point
  const outlineStringBefore = chaptersToKeep
    .map(
      (chapter, index) =>
        `## Chapter ${index + 1}: ${chapter.name}\n${chapter.plotPoints
          .map((point) => `- ${point}`)
          .join("\n")}`
    )
    .join("\n");

  // Use full outline for system prompt context
  const fullOutlineString = existingChapters
    .map(
      (chapter, index) =>
        `## Chapter ${index + 1}: ${chapter.name}\n${chapter.plotPoints
          .map((point) => `- ${point}`)
          .join("\n")}`
    )
    .join("\n");

  const system = systemPrompt(promptData, fullOutlineString);
  console.log(
    `📝 Regenerating from chapter ${
      insertionIndex + 1
    }, keeping first ${insertionIndex} chapters`
  );

  const prompt = getPrompt(
    outlineStringBefore,
    userPrompt,
    remainingChapterCount,
    insertionIndex + 1
  );
  console.log(prompt);

  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `🔄 Regenerating ${remainingChapterCount} chapters starting from chapter ${
          insertionIndex + 1
        } (attempt ${attempt}/${MAX_RETRIES})`
      );
      const { text } = await generateText({
        model: google("gemini-2.5-pro"),
        system,
        prompt,
        temperature: 0.4,
        seed: Math.floor(Math.random() * 1000000),
      });

      const generatedChapters = parseOutlineText(text);

      // Validate we got the expected number of chapters
      if (generatedChapters.length !== remainingChapterCount) {
        throw new Error(
          `Generated chapter count mismatch: expected ${remainingChapterCount}, got ${generatedChapters.length}`
        );
      }

      // Validate each chapter has the expected number of plot points
      const expectedPlotPoints =
        STORY_LENGTH_CONFIG[promptData.story_length].bulletsPerChapter;
      for (let i = 0; i < generatedChapters.length; i++) {
        if (generatedChapters[i].plotPoints.length !== expectedPlotPoints) {
          throw new Error(
            `Generated chapter ${
              i + insertionIndex + 1
            } plot point count mismatch: expected ${expectedPlotPoints}, got ${
              generatedChapters[i].plotPoints.length
            }`
          );
        }
      }

      console.log(
        `✅ Successfully regenerated ${generatedChapters.length} chapters`
      );

      // Combine the kept chapters with the newly generated ones
      const finalChapters = [...chaptersToKeep, ...generatedChapters];

      // Validate we have the correct total number of chapters
      if (finalChapters.length !== totalChapterCount) {
        throw new Error(
          `Chapter count mismatch: expected ${totalChapterCount}, got ${finalChapters.length}`
        );
      }

      return finalChapters;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `❌ Failed to regenerate outline (attempt ${attempt}/${MAX_RETRIES}):`,
        error
      );

      if (attempt < MAX_RETRIES) {
        const backoffMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.log(`⏳ Retrying in ${backoffMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw new Error(
    `Outline regeneration failed after ${MAX_RETRIES} attempts: ${
      lastError?.message || "Unknown error"
    }`
  );
};
