import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { Chapter } from "../../lib/types.js";

interface VideoPromptContext {
  quoteText: string;
  chapterContent?: string;
  storyOutline?: Chapter[];
  sequenceTitle?: string;
  contextSentence?: string;
}

/**
 * Extracts content up to the quote position for better context
 */
function getContentUpToQuote(
  chapterContent: string,
  quoteText: string
): {
  contentBeforeQuote: string;
  quotePosition: "beginning" | "middle" | "end";
} {
  if (!chapterContent || !quoteText) {
    return {
      contentBeforeQuote: chapterContent || "",
      quotePosition: "beginning",
    };
  }

  // Find the quote in the chapter content - try different approaches
  let quoteIndex = chapterContent
    .toLowerCase()
    .indexOf(quoteText.toLowerCase());

  // If not found, try finding a partial match (first 50 characters)
  if (quoteIndex === -1 && quoteText.length > 50) {
    const partialQuote = quoteText.substring(0, 50).toLowerCase();
    quoteIndex = chapterContent.toLowerCase().indexOf(partialQuote);
    console.log(`Trying partial quote match: "${partialQuote}"`);
  }

  if (quoteIndex === -1) {
    // Quote not found, return full content
    console.warn("Quote not found in chapter content, using full chapter");
    console.log("Quote text:", quoteText.substring(0, 100) + "...");
    console.log(
      "Chapter content preview:",
      chapterContent.substring(0, 500) + "..."
    );
    return { contentBeforeQuote: chapterContent, quotePosition: "end" };
  }

  console.log(`✅ Quote found at position ${quoteIndex} in chapter content`);

  // Extract content up to the quote
  const contentBeforeQuote = chapterContent.substring(0, quoteIndex).trim();

  // Determine quote position in the chapter
  const totalLength = chapterContent.length;
  const quotePositionRatio = quoteIndex / totalLength;

  let quotePosition: "beginning" | "middle" | "end";
  if (quotePositionRatio < 0.33) {
    quotePosition = "beginning";
  } else if (quotePositionRatio < 0.66) {
    quotePosition = "middle";
  } else {
    quotePosition = "end";
  }

  return { contentBeforeQuote, quotePosition };
}

/**
 * Enhances a quote into a cinematic video prompt using AI
 * Takes story context and creates a detailed visual description
 */
export async function enhancePromptForVideo(
  context: VideoPromptContext
): Promise<string> {
  const systemPrompt = `You are a professional cinematic prompt engineer creating artistic visual content for consenting adult audiences. Transform story quotes into tasteful, cinematic video prompts that focus on emotional storytelling and artistic expression.

CONTENT APPROACH:
- This is artistic expression for mature, consenting audiences who have chosen to view romantic content
- Focus on emotional connection, facial expressions, and atmospheric storytelling
- Emphasize the artistic and cinematic nature of the content
- Use elegant, sophisticated language that conveys emotion without explicit detail

PROMPT REQUIREMENTS:
- Create 1-2 sentence cinematic prompts (maximum 280 characters)
- Focus on emotional expressions, lighting, and cinematic atmosphere
- Use professional film terminology: [Close-up], [Wide shot], [Soft focus], etc.
- Emphasize artistic storytelling and emotional depth
- Avoid explicit physical descriptions - focus on faces, emotions, and atmosphere

STYLE GUIDELINES:
- Artistic and tasteful visual storytelling
- Focus on facial expressions and emotional states
- Professional cinematography language
- Atmospheric lighting and mood
- Emotional connection and tension

EXAMPLE TRANSFORMATIONS:
Quote: "His eyes met hers across the crowded room"
Video: "Artistic close-up of intense eye contact across elegant ballroom. [Cinematic lighting] Warm golden atmosphere, emotional tension between two figures, sophisticated romantic cinematography."

Quote: "She whispered his name in the darkness"
Video: "Cinematic close-up of emotional expression in soft moonlight. [Artistic focus] Elegant romantic atmosphere, sophisticated lighting, emotional storytelling for mature audience."`;

  // Format the story outline similar to plotPoint.ts
  const formatStoryOutline = (chapters: Chapter[], title?: string) => {
    if (!chapters || chapters.length === 0) return "";

    return `<story_outline>
# Story Description
${title || "A romantic story"}

${chapters
  .map(
    (chapter, index) =>
      `## Chapter ${index + 1}: ${chapter.name}\n${chapter.plotPoints
        .map((plotPoint) => `- ${plotPoint}`)
        .join("\n")}`
  )
  .join("\n")}
</story_outline>`;
  };

  // Get content up to the quote and determine its position
  const { contentBeforeQuote, quotePosition } = context.chapterContent
    ? getContentUpToQuote(context.chapterContent, context.quoteText)
    : { contentBeforeQuote: "", quotePosition: "beginning" as const };

  // Truncate content if too long, keeping the most recent content
  const maxContentLength = 2000;
  const truncatedContent =
    contentBeforeQuote.length > maxContentLength
      ? "..." + contentBeforeQuote.slice(-maxContentLength)
      : contentBeforeQuote;

  const userPrompt = `Transform this story quote into a tasteful, artistic cinematic video prompt for consenting adult viewers:

QUOTE: "${context.quoteText}"

${context.contextSentence ? `CONTEXT: ${context.contextSentence}` : ""}

QUOTE POSITION: This quote appears at the ${quotePosition} of the chapter.

${
  context.storyOutline
    ? formatStoryOutline(context.storyOutline, context.sequenceTitle)
    : ""
}

${
  truncatedContent
    ? `<story_content_leading_to_quote>
${truncatedContent}
</story_content_leading_to_quote>`
    : ""
}

Create an artistic, sophisticated cinematic video prompt that captures the emotional essence of this moment through professional cinematography. Focus on facial expressions, lighting, and atmosphere rather than physical details. This is artistic content for mature audiences who have consented to romantic storytelling.`;

  try {
    console.log("🤖 Sending prompt to AI for enhancement...");
    console.log("User prompt length:", userPrompt.length);
    console.log("Quote text:", context.quoteText);

    const result = await generateText({
      model: google("gemini-2.5-pro"),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxTokens: 200,
    });

    console.log("🤖 AI response received:", result.text);

    // Extract and clean the enhanced prompt
    let enhancedPrompt = result.text.trim();

    // Remove any quotation marks if present
    enhancedPrompt = enhancedPrompt.replace(/^["']|["']$/g, "");

    // Ensure it's within character limits for video generation
    if (enhancedPrompt.length > 280) {
      enhancedPrompt = enhancedPrompt.slice(0, 277) + "...";
    }

    // If prompt is still empty, create a fallback
    if (!enhancedPrompt) {
      console.warn("🚨 AI returned empty prompt, creating fallback");
      enhancedPrompt = `Artistic close-up of emotional expression. [Cinematic lighting] Sophisticated romantic atmosphere, elegant storytelling for mature audience.`;
    }

    console.log(`📝 Enhanced prompt: ${enhancedPrompt}`);
    return enhancedPrompt;
  } catch (error) {
    console.error("Error enhancing video prompt:", error);
    console.error("Full error details:", JSON.stringify(error, null, 2));

    // Create a fallback prompt if AI fails
    const fallbackPrompt = `Artistic cinematic scene. [Close-up] Elegant emotional expression with sophisticated lighting and professional cinematography.`;
    console.log(`🔄 Using fallback prompt: ${fallbackPrompt}`);
    return fallbackPrompt;
  }
}

/**
 * Retry wrapper for prompt enhancement with exponential backoff
 */
export async function enhancePromptWithRetry(
  context: VideoPromptContext,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🔄 Enhancing video prompt (attempt ${attempt}/${maxRetries})`
      );
      return await enhancePromptForVideo(context);
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Prompt enhancement attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏱️ Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed to enhance video prompt after ${maxRetries} attempts: ${
      lastError?.message || "Unknown error"
    }`
  );
}
