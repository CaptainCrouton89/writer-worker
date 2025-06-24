import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

// Schema for title and description
const TitleDescriptionSchema = z.object({
  title: z.string().describe("A compelling, concise title for the story"),
  description: z
    .string()
    .describe("A 2-sentence description of the story that entices readers"),
  tags: z
    .array(z.string())
    .describe(
      "A list of 5-8 lowercase string tags that categorize the story's themes, genres, setting, and content"
    ),
});

// Schema for trigger warnings
const TriggerWarningsSchema = z.object({
  trigger_warnings: z
    .array(z.string())
    .describe("A list of content warnings for potentially sensitive themes"),
});

// Schema for explicit content detection
const ExplicitContentSchema = z.object({
  is_sexually_explicit: z
    .boolean()
    .describe("Whether the story contains explicit sexual content"),
});

// Combined schema for backward compatibility
const SequenceMetadataSchema = z.object({
  title: z.string().describe("A compelling, concise title for the story"),
  description: z
    .string()
    .describe("A 2-sentence description of the story that entices readers"),
  tags: z
    .array(z.string())
    .describe(
      "A list of 5-8 lowercase string tags that categorize the story's themes, genres, setting, and content"
    ),
  trigger_warnings: z
    .array(z.string())
    .describe(
      "A list of content warnings for potentially sensitive themes (e.g., 'violence', 'non-consensual', 'substance abuse', 'mental health', 'death')"
    ),
  is_sexually_explicit: z
    .boolean()
    .describe(
      "Whether the story contains explicit sexual content (true for graphic sexual descriptions, false for mild romantic content)"
    ),
});

// Generate title, description, and tags
async function generateTitleDescription(
  outline: string
): Promise<z.infer<typeof TitleDescriptionSchema>> {
  const systemPrompt = `You are a creative writer specializing in compelling titles and descriptions for stories. Focus on creating clickbait titles that hint at the story's content and concise descriptions that entice readers.`;

  const prompt = `Based on this story outline, generate a compelling title, description, and relevant tags.

Story Outline:
${outline}

Requirements:
- Title: Clickbaity and indicative of content
- Description: Plain language, under 30 words
- Tags: 5-8 lowercase tags from common literature/erotica categories (contemporary, romance, fantasy, steamy, etc.)`;

  const maxRetries = 3;
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `📝 Generating title/description with Gemini 2.5 Pro (attempt ${attempt}/${maxRetries})`
      );
      const { object } = await generateObject({
        model: google("gemini-2.5-pro"),
        system: systemPrompt,
        prompt,
        schema: TitleDescriptionSchema,
        temperature: 0.3,
      });
      return object;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `❌ Failed to generate title/description (attempt ${attempt}/${maxRetries}):`,
        lastError.message
      );

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Title/description generation failed: ${lastError.message}`);
}

// Generate trigger warnings
async function generateTriggerWarnings(
  outline: string
): Promise<z.infer<typeof TriggerWarningsSchema>> {
  const systemPrompt = `You are a content safety specialist. Analyze stories for potentially sensitive content that readers should be warned about. Be thorough but only include warnings that are actually present in the content.`;

  const prompt = `Analyze this story outline and identify appropriate trigger warnings.

Story Outline:
${outline}

Common triggers to check for:
- Violence, abuse, assault
- Substance abuse, addiction
- Mental health issues, self-harm
- Death, grief, loss
- Power imbalances, manipulation
- Medical trauma, pregnancy issues

Only include warnings for content actually present in the story.`;

  const maxRetries = 3;
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `⚠️  Generating trigger warnings with GPT-4o-mini (attempt ${attempt}/${maxRetries})`
      );
      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        system: systemPrompt,
        prompt,
        schema: TriggerWarningsSchema,
        temperature: 0.1,
      });
      return object;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `❌ Failed to generate trigger warnings (attempt ${attempt}/${maxRetries}):`,
        lastError.message
      );

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Trigger warnings generation failed: ${lastError.message}`);
}

// Detect explicit content
async function detectExplicitContent(
  outline: string
): Promise<z.infer<typeof ExplicitContentSchema>> {
  const systemPrompt = `You are a content classifier. Determine if stories contain sexually explicit content. Be consistent and accurate in your classification.`;

  const prompt = `Determine if this story contains sexually explicit content.

Story Outline:
${outline}

Classification:
- TRUE: Graphic sexual descriptions, detailed intimate acts, explicit language
- FALSE: Romantic tension, kissing, fade-to-black, mild sensual content`;

  const maxRetries = 3;
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🔞 Detecting explicit content with GPT-4o-mini (attempt ${attempt}/${maxRetries})`
      );
      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        system: systemPrompt,
        prompt,
        schema: ExplicitContentSchema,
        temperature: 0,
      });
      return object;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `❌ Failed to detect explicit content (attempt ${attempt}/${maxRetries}):`,
        lastError.message
      );

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Explicit content detection failed: ${lastError.message}`);
}

// Main function that orchestrates parallel calls
export const generateSequenceMetadata = async (
  outline: string
): Promise<z.infer<typeof SequenceMetadataSchema>> => {
  console.log("🏷️ Generating sequence metadata with parallel AI calls");

  try {
    // Execute all three AI calls in parallel
    const [
      titleDescriptionResult,
      triggerWarningsResult,
      explicitContentResult,
    ] = await Promise.all([
      generateTitleDescription(outline),
      generateTriggerWarnings(outline),
      detectExplicitContent(outline),
    ]);

    // Combine results
    const metadata = {
      ...titleDescriptionResult,
      ...triggerWarningsResult,
      ...explicitContentResult,
    };

    console.log("✅ Successfully generated all metadata");
    return metadata;
  } catch (error) {
    console.error("❌ Failed to generate metadata:", error);
    throw new Error(
      `Metadata generation failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
