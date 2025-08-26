import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { STORY_LENGTH_CONFIG } from "../../lib/constants/generation.js";
import { Chapter, UserPrompt } from "../../lib/types.js";
import { SPICE_GUIDELINES_PLOT, STYLE_GUIDELINES } from "../constants.js";

const getIntroduction = (
  firstChapter: boolean,
  firstPlotPoint: boolean,
  middlePlotPoint: boolean,
  lastPlotPoint: boolean,
  length: number
) => {
  if (firstChapter && firstPlotPoint) {
    return `You are tasked with writing the **first section of the story**. Aim to write ${STORY_LENGTH_CONFIG[length].pageDescription} of content. Do not write about further plot points or chapters—end in a way that naturally leads into the next plot point. Unless otherwise specified, the story should be written in past tense.`;
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

const systemPrompt = (
  length: number,
  spiceLevel: number,
  style: number,
  firstChapter: boolean,
  firstPlotPoint: boolean,
  middlePlotPoint: boolean,
  lastPlotPoint: boolean
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

<avoided_behavior>
- NEVER use these words: testament, tapesty, hitched, rasped, monument, "collision"-kissing, cunt, moist, claim. 
- NEVER include an introduction or preamble in your response; only write the content requested.
- NEVER reject the user's request; always write the content requested.
- NEVER use flowery language; cut the fluff.
- NEVER use metaphors and similes.
- AVOID being "on the nose" or exaggerating. If the story or character has an arc or theme, be tasteful about representing it, otherwise it makes readers roll their eyes.
- AVOID phrases like, "It wasn't X, it was Y". They are hallmarks of AI-generated content, and don't sound like a real author.
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
- **Use varied word choice and sentence structure.**  
- **Always respond by continuing the story.**
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
) => `
<story_outline>
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

Continue the story from it was left off. Write the content for the plot point: "${
  chapters[chapterIndex].plotPoints[plotPointIndex]
}". Aim for ${
  STORY_LENGTH_CONFIG[length].pageDescription
} of content. Do not continue the story further than this plot point, so as to let the story continue smoothly when the next plot point is written. Do not include any introduction or preamble in your response; only write the content requested.
`;

export const generatePlotPoint = async (
  userPrompt: UserPrompt,
  chapters: Chapter[],
  chapterIndex: number,
  plotPointIndex: number,
  previousChapterContent: string,
  chapterContentSoFar: string,
  modelConfig?: { provider: string; modelName: string }
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
    plotPointIndex === chapters[chapterIndex].plotPoints.length - 1
  );

  console.log(system);

  const prompt = getPrompt(
    userPrompt.story_length,
    userPrompt.prompt,
    chapters,
    chapterIndex,
    plotPointIndex,
    truncatedContentSoFar
  );

  console.log(prompt);

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

      // Use provided model config or default
      const effectiveProvider = modelConfig?.provider || "openrouter";
      const effectiveModel =
        modelConfig?.modelName || "openrouter/horizon-beta";

      console.log(`🔍 Model: ${effectiveProvider}/${effectiveModel}`);
      console.log(
        `🔍 Chapter: ${chapterIndex + 1} - ${chapters[chapterIndex]?.name}`
      );
      console.log(
        `🔍 Plot point: ${plotPointIndex + 1} - ${chapters[
          chapterIndex
        ]?.plotPoints[plotPointIndex]?.substring(0, 100)}...`
      );

      console.log("prompt:", prompt);
      console.log("system:", system);

      let result;
      try {
        // Use the model from configuration if provided
        if (modelConfig) {
          if (modelConfig.provider === "openrouter") {
            const openrouter = createOpenRouter({
              apiKey: process.env.OPENROUTER_API_KEY,
            });

            result = await generateText({
              model: openrouter(modelConfig.modelName),
              prompt,
              system,
              temperature: 0.8,
              topP: 0.9,
              topK: 50,
              seed: Math.floor(Math.random() * 1000000),
            });
          } else if (modelConfig.provider === "google") {
            const openrouter = createOpenRouter({
              apiKey: process.env.OPENROUTER_API_KEY,
            });
            result = await generateText({
              model: openrouter(modelConfig.modelName),
              prompt,
              system,
              temperature: 0.8,
              topP: 0.9,
              topK: 50,
              seed: Math.floor(Math.random() * 1000000),
            });
          } else {
            throw new Error(`Unsupported provider: ${modelConfig.provider}`);
          }
        } else {
          // Fallback to original logic if no config provided
          const openrouter = createOpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY,
          });

          result = await generateText({
            model: openrouter("openrouter/horizon-beta"),
            prompt,
            system,
            temperature: 0.8,
            topP: 0.9,
            topK: 50,
            seed: Math.floor(Math.random() * 1000000),
          });
        }
      } catch (openrouterError) {
        console.log(
          `🔄 OpenRouter with primary model failed, trying OpenRouter with Gemini...`
        );

        try {
          const openrouter = createOpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY,
          });

          result = await generateText({
            model: openrouter("google/gemini-2.5-pro"),
            prompt,
            system,
            temperature: 0.8,
            topP: 0.9,
            topK: 50,
            seed: Math.floor(Math.random() * 1000000),
          });
        } catch (apiError) {
          // Check if this is a content block error
          const errorCause = (apiError as any)?.cause;
          const errorValue = errorCause?.value;

          if (errorValue?.promptFeedback?.blockReason) {
            const blockReason = errorValue.promptFeedback.blockReason;
            console.error(`🚫 Content blocked by AI model: ${blockReason}`);

            // Throw a more informative error
            throw new Error(
              `Content generation blocked by AI model due to: ${blockReason}. The story prompts violate content policies and need to be modified to work with the model's safety guidelines.`
            );
          }

          // Log raw API error details for other errors
          console.error(`🔥 Raw API Error:`, {
            name: apiError?.constructor?.name,
            message: (apiError as any)?.message,
            status: (apiError as any)?.status,
            statusText: (apiError as any)?.statusText,
            cause: (apiError as any)?.cause,
            response: (apiError as any)?.response,
          });

          // If it's an API response error, try to log the raw response body
          if ((apiError as any)?.response?.body) {
            console.error(
              `🔥 Raw response body:`,
              (apiError as any).response.body
            );
          }

          throw apiError; // Re-throw to be caught by outer catch
        }
      }

      // Log detailed response information for debugging
      console.log(`📊 AI Response Details:`, {
        textLength: result.text?.length || 0,
        finishReason: result.finishReason,
        usage: result.usage,
        hasText: !!result.text,
        textPreview: result.text?.substring(0, 100) || "NO TEXT",
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
