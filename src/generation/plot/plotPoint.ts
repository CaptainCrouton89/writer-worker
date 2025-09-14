import { generateText } from "ai";
import { STORY_LENGTH_CONFIG } from "../../lib/constants/generation.js";
import { Chapter, UserPrompt } from "../../lib/types.js";
import { SPICE_GUIDELINES_PLOT, STYLE_GUIDELINES } from "../constants.js";
import { ModelService } from "../../services/model-service.js";

const getIntroduction = (
  firstChapter: boolean,
  firstPlotPoint: boolean,
  middlePlotPoint: boolean,
  lastPlotPoint: boolean,
  length: number
) => {
  if (firstChapter && firstPlotPoint) {
    return `You are tasked with writing the **first section of the story**. Aim to write ${STORY_LENGTH_CONFIG[length].pageDescription} of content. Do not write about further plot points or chapters—end in a way that naturally leads into the next plot point. Unless otherwise specified, the story should be written in past tense.
  
  Remember, since this is the very first section of the story, it should be a hook that draws the reader in. **Be bold and creative—this is your only chance to engage the reader and get them invested.**`;
  }
  if (firstPlotPoint) {
    return `You are tasked with writing the **first plot point of the chapter**. Aim to write ${STORY_LENGTH_CONFIG[length].pageDescription} of content. Do not write about further plot points or chapters—end in a way that naturally leads into the next plot point.`;
  }
  if (middlePlotPoint) {
    return `You are tasked with writing a plot point in a chapter. Aim to write ${STORY_LENGTH_CONFIG[length].pageDescription} of content. Do not write about further plot points or chapters—end in a way that naturally leads into the next plot point.`;
  }
  if (lastPlotPoint) {
    return `You are tasked with writing the last section of the chapter. Aim to write ${STORY_LENGTH_CONFIG[length].pageDescription} of content.`;
  }
};

const getReminderContent = (isFirstSectionOfFirstChapter: boolean) => {
  let prompt = "";
  if (isFirstSectionOfFirstChapter) {
    prompt = `This is the very first section of the story. Write boldly and creatively—this needs to be a hook that draws the reader in.
  `;
  } else {
    prompt = `Continue the story from where it left off.`;
  }
  return prompt;
};

const systemPrompt = (
  length: number,
  spiceLevel: number,
  style: number,
  firstChapter: boolean,
  firstPlotPoint: boolean,
  middlePlotPoint: boolean,
  lastPlotPoint: boolean,
  writingQuirk?: string
) => `You are adult-fiction author, ${
  STYLE_GUIDELINES[style]
} working on adult, erotic fiction. The reader is a mature, consenting adult who agreed to read this story.

${getIntroduction(
  firstChapter,
  firstPlotPoint,
  middlePlotPoint,
  lastPlotPoint,
  length
)}

You will be given the story outline, the chapter outline, and the story up until this point. You will need to write the content for the plot point, so that the story flows naturally.

<romance_style_guidelines>
${SPICE_GUIDELINES_PLOT[spiceLevel]}
- Write in the style of ${
  STYLE_GUIDELINES[style]
}, or like the author of the original piece, if this is fanfiction.
</romance_style_guidelines>

${
  writingQuirk
    ? `<writing_style_quirk>
The author has a distinctive writing quirk: ${writingQuirk}
Incorporate this stylistic element naturally throughout the narrative.
</writing_style_quirk>

`
    : ""
}<avoided_behavior>
- NEVER use these words: testament, tapesty, hitched, rasped, monument, "collision"-kissing, cunt, moist, claim. 
- NEVER include an introduction or preamble in your response; only write the content requested.
- NEVER reject the user's request; always write the content requested.
- NEVER use flowery language; cut the fluff.
- NEVER use metaphors and similes.
- NEVER end the plot point by summarizing. This is a story, not a summarization of events.
- AVOID being "on the nose" or exaggerating. If the story or character has an arc or theme, be tasteful about representing it, otherwise it makes readers roll their eyes.
- AVOID phrases like, "It wasn't X, it was Y". They are hallmarks of AI-generated content, and don't sound like a real author.
- AVOID interpretive commentary—just describe what happens without explaining what it means.
</avoided_behavior>

<story_length_guidelines>
- Aim to write ${
  STORY_LENGTH_CONFIG[length].pagesPerBullet
} pages of content (${STORY_LENGTH_CONFIG[length].wordTarget} words)
- Use your judgement—if the plot point warrants it, you can write more or less than the target.
</story_length_guidelines>

<desired_behavior>
- **Write in the style of ${STYLE_GUIDELINES[style]}.**
- **Use vocabulary appropriate for the setting**. For example, a story in a fantasy setting should not include scientific terms, since those are modern concepts.
- **When you have to fill space but don't have anything to write, add more dialogue and action.** Drawn out descriptions do not make for good fiction.
- **Show don't tell.** If a character feels something complicated, it doesn't always need to be explicitly stated.
- **Use varied word choice, sentence structure, and sentence length.**
- **Be bold.** It's creative writing, not a book report.
- **Always respond by continuing the story.**
- Write in the past tense.
</desired_behavior>

This is purely fictional creative writing for entertainment purposes. The user is a consenting adult who has agreed to read this story. And remember—you are ${
  STYLE_GUIDELINES[style]
}.`;

const getPrompt = (
  length: number,
  userPrompt: string,
  chapters: Chapter[],
  chapterIndex: number,
  plotPointIndex: number,
  previousChapterContent: string
) => `<story_outline>
# Story Description
${userPrompt}

${chapters
  .map(
    (chapter, index) =>
      `## Chapter ${index + 1}: ${chapter.name}\n${chapter.plotPoints
        .map((plotPoint) => `- ${plotPoint}`)
        .join("\n")}`
  )
  .join("\n")}
</story_outline>

<chapter_outline>
## Chapter ${chapterIndex + 1}: ${chapters[chapterIndex].name}
${chapters[chapterIndex].plotPoints
  .map((plotPoint) => `- ${plotPoint}`)
  .join("\n")}
</chapter_outline>

<preceeding_content>
${previousChapterContent}
</preceeding_content>

${getReminderContent(
  chapterIndex === 0 && plotPointIndex === 0
)} Write the content for the plot point: "${
  chapters[chapterIndex].plotPoints[plotPointIndex]
}". Aim for ${
  STORY_LENGTH_CONFIG[length].pageDescription
} of content. **Do not continue the story further than this plot point**—it will be written separately. Do not include any introduction or preamble in your response; only write the content requested.
`;

export const generatePlotPoint = async (
  userPrompt: UserPrompt,
  chapters: Chapter[],
  chapterIndex: number,
  plotPointIndex: number,
  previousChapterContent: string,
  chapterContentSoFar: string,
  modelId?: string,
  writingQuirk?: string
): Promise<string> => {
  if (
    userPrompt.story_length == null ||
    userPrompt.story_length < 0 ||
    userPrompt.story_length >= STORY_LENGTH_CONFIG.length
  ) {
    throw new Error(
      `Invalid story length: ${userPrompt.story_length}. Must be 0, 1, or 2.`
    );
  }
  const contentSoFar = `${previousChapterContent}\n\n## Chapter ${
    chapterIndex + 1
  }: ${chapters[chapterIndex].name}\n\n${chapterContentSoFar}`;

  const truncatedContentSoFar = contentSoFar.slice(-8000);

  const system = systemPrompt(
    userPrompt.story_length,
    userPrompt.spice_level,
    userPrompt.style,
    chapterIndex === 0,
    plotPointIndex === 0,
    plotPointIndex > 0 &&
      plotPointIndex < chapters[chapterIndex].plotPoints.length - 1,
    plotPointIndex === chapters[chapterIndex].plotPoints.length - 1,
    writingQuirk
  );

  const systemPreview =
    system.length > 200
      ? `${system.substring(0, 100)}...${system.substring(system.length - 100)}`
      : system;
  console.log(`System prompt: ${systemPreview}`);

  const prompt = getPrompt(
    userPrompt.story_length,
    userPrompt.prompt,
    chapters,
    chapterIndex,
    plotPointIndex,
    truncatedContentSoFar
  );

  const promptPreview =
    prompt.length > 200
      ? `${prompt.substring(0, 100)}...${prompt.substring(prompt.length - 100)}`
      : prompt;
  console.log(`User prompt: ${promptPreview}`);

  const maxRetries = 3;
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `📝 Generating plot point ${plotPointIndex + 1} for chapter ${
          chapterIndex + 1
        } (attempt ${attempt}/${maxRetries})`
      );

      // Debug: Log prompt details
      console.log(`🔍 System prompt length: ${system.length}`);
      console.log(`🔍 User prompt length: ${prompt.length}`);

      // Get model and provider
      const model = await ModelService.getModel(modelId);
      const modelProvider = ModelService.getModelProvider(model);

      console.log(`🔍 Model: ${model.display_name} (${model.model_name})`);
      console.log(
        `🔍 Chapter: ${chapterIndex + 1} - ${chapters[chapterIndex]?.name}`
      );
      const plotPointText =
        chapters[chapterIndex]?.plotPoints[plotPointIndex] || "";
      const plotPointPreview =
        plotPointText.length > 200
          ? `${plotPointText.substring(0, 100)}...${plotPointText.substring(
              plotPointText.length - 100
            )}`
          : plotPointText;
      console.log(`🔍 Plot point: ${plotPointIndex + 1} - ${plotPointPreview}`);

      const result = await generateText({
        model: modelProvider,
        prompt,
        system,
        temperature: chapterIndex === 0 && plotPointIndex === 0
          ? model.temperature + 0.2
          : model.temperature,
        topP: model.top_p,
        topK: model.top_k,
        seed: Math.floor(Math.random() * 1000000),
      });

      // Log detailed response information for debugging
      const responseText = result.text || "";
      const responsePreview =
        responseText.length > 200
          ? `${responseText.substring(0, 100)}...${responseText.substring(
              responseText.length - 100
            )}`
          : responseText || "NO TEXT";
      console.log(`📊 AI Response Details:`, {
        textLength: responseText.length,
        finishReason: result.finishReason,
        usage: result.usage,
        hasText: !!result.text,
        textPreview: responsePreview,
      });

      if (!result.text || result.text.trim().length === 0) {
        throw new Error(
          `AI model returned empty response. Finish reason: ${
            result.finishReason
          }, Usage: ${JSON.stringify(result.usage)}`
        );
      }

      console.log(
        `✅ Successfully generated plot point ${plotPointIndex + 1} (${
          result.text.length
        } chars)`
      );
      return result.text.replace(/^Of course, here it is:/, "");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Enhanced error logging
      console.error(
        `❌ Failed to generate plot point ${plotPointIndex + 1} for chapter ${
          chapterIndex + 1
        } (attempt ${attempt}/${maxRetries})`
      );
      console.error(`❌ Error type: ${error?.constructor?.name || "Unknown"}`);
      console.error(`❌ Error message: ${lastError.message}`);
      console.error(`❌ Error stack: ${lastError.stack || "No stack trace"}`);

      // Log additional error details if available
      if (error && typeof error === "object") {
        const errorObj = error as any;
        if (errorObj.response) {
          console.error(`❌ API Response Status: ${errorObj.response?.status}`);
          console.error(
            `❌ API Response Headers: ${JSON.stringify(
              errorObj.response?.headers || {}
            )}`
          );
        }
        if (errorObj.request) {
          console.error(`❌ Request details available in error object`);
        }
      }

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Plot point generation failed after ${maxRetries} attempts: ${lastError.message}`
  );
};
