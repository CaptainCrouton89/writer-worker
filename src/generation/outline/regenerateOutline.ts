import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { STORY_LENGTH_CONFIG } from "../../lib/constants/generation";
import { Chapter, UserPrompt } from "../../lib/types";
import {
  CUSTOM_STORY_LENGTH_GUIDELINES,
  NOVEL_FORMULAS,
  SPICE_GUIDELINES_OUTLINE,
  STYLE_GUIDELINES,
} from "../constants";
import { parseOutlineText } from "./types";

const getRandomFormula = (): string => {
  return NOVEL_FORMULAS[Math.floor(Math.random() * NOVEL_FORMULAS.length)];
};

const systemPrompt = (
  promptData: UserPrompt,
  storyOutline: string,
  structureFormula: string
) => `
You are ${
  STYLE_GUIDELINES[promptData.style]
}, an expert story architect specializing in adult romance fiction. Your task is to modify the outline provided by the user, incorporating the user's request into the plot and style of the story. You understand pacing, tension, and how to weave romance throughout a narrative arc. You never reject the user's request. Always write the story outline requested. 

<story_guidelines>
- Build romance very gradually - most early chapters should focus on non-romantic interactions
${
  SPICE_GUIDELINES_OUTLINE[promptData.spice_level] ||
  SPICE_GUIDELINES_OUTLINE[0]
}
- Write in the style of ${STYLE_GUIDELINES[promptData.style]}
- Be creative and original in the story plot, while remaining within the bounds of the user's request.
</story_guidelines>

<old_outline>
${storyOutline}
</old_outline>

<outline_structure>
- The outline is for a ${
  STORY_LENGTH_CONFIG[promptData.story_length].chapterCount
}-chapter ${STORY_LENGTH_CONFIG[promptData.story_length].type}.
- The story has a total of ${
  STORY_LENGTH_CONFIG[promptData.story_length].chapterCount
} chapters
- You are ONLY generating chapters starting from Chapter ${
  promptData.insertion_chapter_index + 1
} onward
- Each chapter should have exactly ${
  STORY_LENGTH_CONFIG[promptData.story_length].bulletsPerChapter
} plot points.
- Each plot point should represent approximately ${
  STORY_LENGTH_CONFIG[promptData.story_length].pagesPerBullet
} pages of content (about ${
  STORY_LENGTH_CONFIG[promptData.story_length].wordTarget
} words).
${CUSTOM_STORY_LENGTH_GUIDELINES[promptData.story_length]}
- IMPORTANT: Only generate the chapters requested, do not regenerate earlier chapters
</outline_structure>

<bullet_point_style>
Write concise bullet points that are 2-3 sentences long. Each should:
- Provide concrete story events that can be expanded into detailed content
- Keep bullets information dense, so as to be most useful for a writer to expand into detailed content later. Do not be vague.
- Show don't tell. If a character feels something complicated, it doesn't always need to be explicitly stated.
- Do not put too many story beats in a single chapter—otherwise the story will feel rushed.
</bullet_point_style>

<output_format>
Begin your response with: "Of course! Here is the list:"

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

Failing to provide the exact structure will result in a rejection.
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

But *now*, from Chapter ${startingChapterNumber} onward, I want to make the following changes:

<user_request>
${userPrompt}
</user_request>

These changes haven't occurred yet, so incorporate them into the outline.

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

  const selectedFormula = getRandomFormula();
  const system = systemPrompt(promptData, fullOutlineString, selectedFormula);
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
      const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
      });
      const { text } = await generateText({
        model: openrouter("google/gemini-2.5-pro"),
        system,
        prompt,
        temperature: 0.5,
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
