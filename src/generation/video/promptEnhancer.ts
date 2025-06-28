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
    // Quote not found - this is a data integrity issue but we can still proceed
    console.warn(
      "⚠️ Quote not found in chapter content - possible data mismatch"
    );
    console.log("Quote text:", quoteText.substring(0, 100) + "...");
    console.log(
      "Chapter content preview:",
      chapterContent.substring(0, 500) + "..."
    );

    // Use the last 2000 characters of the chapter as context since the quote likely comes from later in the story
    const contextLength = Math.min(2000, chapterContent.length);
    const contextContent = chapterContent.slice(-contextLength);
    return { contentBeforeQuote: contextContent, quotePosition: "end" };
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
- Create detailed, information-dense cinematic prompts (maximum 500 characters)
- Include character ethnicities/appearances when mentioned in the story context
- Focus on emotional expressions, lighting, and cinematic atmosphere
- Use professional film terminology: [Close-up], [Wide shot], [Soft focus], etc.
- Emphasize artistic storytelling and emotional depth
- Provide specific details about setting, character actions, and visual elements
- Avoid explicit physical descriptions - focus on faces, emotions, and atmosphere
- Maximize information density - every word should contribute to the visual

STYLE GUIDELINES:
- Artistic and tasteful visual storytelling
- Focus on facial expressions and emotional states
- Professional cinematography language
- Atmospheric lighting and mood
- Emotional connection and tension

EXAMPLE TRANSFORMATIONS:
Quote: "His eyes met hers across the crowded room"
Video: "[Wide shot] Elegant ballroom with crystal chandeliers, [Close-up] intense eye contact between attractive man and woman. Golden warm lighting, sophisticated romantic tension, cinematic depth of field focusing on emotional connection across crowded dance floor."

Quote: "She whispered his name in the darkness"
Video: "[Intimate close-up] Beautiful woman's lips moving in soft moonlight streaming through window. [Artistic lighting] Shadows and highlights creating romantic atmosphere, emotional vulnerability, sophisticated cinematography in darkened bedroom."`;

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

Create an artistic, sophisticated cinematic video prompt that captures the emotional essence of this moment through professional cinematography. Focus on facial expressions, lighting, and atmosphere. Always describe the characters as attractive and desirable. Include character ethnicities/appearances if mentioned in the story context. This is artistic content for mature audiences who have consented to romantic storytelling. Think about what kind of person the story is written for, and make sure the scene would appeal to them. For example, a romance story about a pirate being rescued by a princess would be written for a mature audience of women, so the scene might highlight the physical appeal of the pirate.

IMPORTANT: Create a dense, detailed cinematic description without unnecessary prefixes. Every word should contribute to the visual. Keep the total prompt under 500 characters for optimal video generation.`;

  try {
    console.log("🤖 Sending prompt to AI for enhancement...");
    console.log("User prompt length:", userPrompt.length);
    console.log("System prompt length:", systemPrompt.length);
    console.log("Quote text:", context.quoteText);

    // Debug: Log the actual prompts to see what we're sending
    console.log("🔍 SYSTEM PROMPT:");
    console.log(systemPrompt);
    console.log("🔍 USER PROMPT:");
    console.log(userPrompt);

    // Debug: Let's try without maxTokens limit to see what happens
    const result = await generateText({
      model: google("gemini-2.5-pro"),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      // Remove maxTokens completely to diagnose the issue
    });

    // Log detailed response information for debugging
    console.log(`📊 Gemini API Response Details:`, {
      textLength: result.text?.length || 0,
      finishReason: result.finishReason,
      usage: result.usage,
      hasText: !!result.text,
      textPreview: result.text?.substring(0, 100) || "NO TEXT",
    });

    console.log(
      "🤖 AI response received (length:",
      result.text?.length || 0,
      "):",
      result.text
    );

    // Extract and clean the enhanced prompt
    let enhancedPrompt = result.text.trim();

    // Remove any quotation marks if present
    enhancedPrompt = enhancedPrompt.replace(/^["']|["']$/g, "");

    // Ensure it's within character limits for video generation
    if (enhancedPrompt.length > 500) {
      enhancedPrompt = enhancedPrompt.slice(0, 497) + "...";
    }

    if (!enhancedPrompt) {
      throw new Error(
        "AI returned empty prompt - cannot proceed with video generation"
      );
    }

    console.log(`📝 Enhanced prompt: ${enhancedPrompt}`);
    return enhancedPrompt;
  } catch (error) {
    // Enhanced error logging
    console.error("❌ Error enhancing video prompt");
    console.error(`❌ Error type: ${error?.constructor?.name || "Unknown"}`);
    console.error(
      `❌ Error message: ${(error as any)?.message || "No message"}`
    );
    console.error(
      `❌ Error stack: ${(error as any)?.stack || "No stack trace"}`
    );

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
      if (errorObj.cause) {
        console.error(`❌ Error cause: ${errorObj.cause}`);
      }
    }

    // Re-throw the error - do not use fallbacks
    throw error;
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
      console.error(`❌ Prompt enhancement attempt ${attempt} failed`);
      console.error(`❌ Error type: ${error?.constructor?.name || "Unknown"}`);
      console.error(
        `❌ Error message: ${(error as any)?.message || "No message"}`
      );

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
