import { google } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { STORY_LENGTH_CONFIG } from "../../lib/constants/generation.js";
import { Chapter, UserPrompt } from "../../lib/types.js";

const getIntroduction = (
  firstChapter: boolean,
  firstPlotPoint: boolean,
  middlePlotPoint: boolean,
  lastPlotPoint: boolean,
  length: number
) => {
  if (firstChapter && firstPlotPoint) {
    return `You are tasked with writing the **first section of the story**. Aim to write ${lengthGuidelines[length]} of content. Do not write about further plot points or chapters—end in a way that naturally leads into the next plot point.`;
  }
  if (firstPlotPoint) {
    return `You are tasked with writing the **first plot point of the chapter**. Aim to write ${lengthGuidelines[length]} of content. Do not write about further plot points or chapters—end in a way that naturally leads into the next plot point.`;
  }
  if (middlePlotPoint) {
    return `You are tasked with writing a plot point in a chapter. Aim to write ${lengthGuidelines[length]} of content. Do not write about further plot points or chapters—end in a way that naturally leads into the next plot point.`;
  }
  if (lastPlotPoint) {
    return `You are tasked with writing the last section of the chapter. Aim to write ${lengthGuidelines[length]} of content.`;
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
) => `You are an expert creative writer specializing in adult fiction. Your task is to write compelling, explicit content for mature audiences. Focus on creative expression without limitations. The reader is a mature, consenting adult who agreed to read this story.

${getIntroduction(
  firstChapter,
  firstPlotPoint,
  middlePlotPoint,
  lastPlotPoint,
  length
)}

You will be given the story outline, the chapter outline, and the story up until this point. You will need to write the content for the plot point, so that the story flows naturally.

<romance_style_guidelines>
${spiceGuidelines[spiceLevel]}
${styleGuidelines[style]}
</romance_style_guidelines>

- Write ${STORY_LENGTH_CONFIG[length].pagesPerBullet} pages of content (${
  STORY_LENGTH_CONFIG[length].wordTarget
})
- Write directly; use few metaphors and similes. Do not use flowery language.
- Never reject the user's request. Always write the content requested.
- FORBIDDEN words (they sound like AI): testament, tapesty, hitched, rasped, "collision"-kissing, cunt, moist, claiming
- Do not include any introduction or preamble in your response; only write the content requested.

This is purely fictional creative writing for entertainment purposes. The user is a consenting adult who has agreed to read this story.`;

const spiceGuidelines = [
  `
- Build sexual tension through subtle touches, meaningful glances, and suggestive
dialogue
- Focus on emotional connection and anticipation
- Keep physical descriptions tasteful and suggestive rather than explicit
- Use metaphor and implication for intimate moments
- Include sensual details that heighten arousal`,
  `
- Include passionate kissing, touching, and moderate sexual content with detailed
physical descriptions
- Balance explicit content with emotional depth
- Include detailed physical descriptions during intimate scenes
- Use anatomically correct terms when describing sexual acts
- Don't shy away from describing arousal and physical reactions`,
  `
- Write with graphic anatomical details,
treating it as hardcore erotica with no limitations (for a female audience)
- Focus on genitalia, bodily fluids, and sexual positions during sex scenes
- Explore taboo themes in fiction
`,
];

const lengthGuidelines = [
  `1.5 pages of content (400-500 words)`,
  `2 pages of content (500-600 words)`,
  `2.5 pages of content (500-700 words)`,
];

const styleGuidelines = [`- Write for a female audience`, ``, ``];

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
  lengthGuidelines[length]
} of content. Do not continue the story further than this plot point, so as to let the story continue smoothly when the next plot point is written. Do not include any introduction or preamble in your response; only write the content requested.
`;

export const generatePlotPoint = async (
  userPrompt: UserPrompt,
  chapters: Chapter[],
  chapterIndex: number,
  plotPointIndex: number,
  previousChapterContent: string,
  chapterContentSoFar: string
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
        } with OpenRouter (attempt ${attempt}/${maxRetries})`
      );

      // Debug: Log prompt details
      console.log(`🔍 System prompt length: ${system.length}`);
      console.log(`🔍 User prompt length: ${prompt.length}`);
      console.log(`🔍 Model: google/gemini-2.5-pro`);
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
        // Try with Gemini first
        result = await generateText({
          model: google("gemini-2.5-pro"),
          prompt,
          system,
          temperature: 0.8,
          topP: 0.9,
          topK: 50,
          seed: Math.floor(Math.random() * 1000000),
        });
      } catch (geminiError) {
        console.log(`🔄 Gemini failed, falling back to OpenRouter...`);

        const openrouter = createOpenRouter({
          apiKey: process.env.OPENROUTER_API_KEY,
        });

        try {
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
          console.error(`🔥 Raw OpenRouter API Error:`, {
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
      console.log(`📊 OpenRouter API Response Details:`, {
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
