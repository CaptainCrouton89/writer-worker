import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

// Schema for title and description only
const TitleDescriptionSchema = z.object({
  title: z
    .string()
    .describe("A compelling, concise, clickbaity title for the story"),
  description: z
    .string()
    .describe(
      "A 2-sentence description of the story that entices readers and directly describes the content"
    ),
});

// Schema for tags
const TagsSchema = z.object({
  tags: z
    .array(z.string())
    .describe(
      "A list of 5-8 lowercase string tags that categorize the story's themes, genres, and content"
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
      "A list of 5-8 lowercase string tags that categorize the story's themes, genres, and content"
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

// Generate title and description only
async function generateTitleDescription(
  outline: string
): Promise<z.infer<typeof TitleDescriptionSchema>> {
  const systemPrompt = `## Identity
You are a romance and erotic fiction title specialist with expertise in creating compelling, marketable titles and descriptions.

### Title Conventions
- Create clickbait-style titles that grab attention immediately
- Make readers feel they'll miss out if they don't click
- Be descriptive in the title; the readers are scanning quickly

### Description Best Practices
- Start with a direct statement of what happens in the story
- Clearly identify the main characters and their relationship
- State the central conflict or obstacle plainly
- Mention the setting and time period if relevant
- Be factual and informative about the story's content`;

  const prompt = `Generate a title and description for this story outline:
${outline}`;

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

// Generate tags
async function generateTags(
  outline: string
): Promise<z.infer<typeof TagsSchema>> {
  const systemPrompt = `## Identity
You are a content categorization specialist for romance and erotic fiction with deep knowledge of reader search patterns and genre conventions.

## Capabilities
- Analyze story content to identify key themes, tropes, and elements
- Select the most relevant and searchable tags from established categories
- Balance broad appeal tags with specific niche identifiers
- Understand reader search behavior and tag popularity

## Domain Knowledge - Tag Taxonomy
### Genre Tags
"contemporary", "historical", "fantasy", "paranormal", "military", "medical", "billionaire", "small town", "regency", "victorian", "medieval", "western", "sci-fi", "dystopian", "post-apocalyptic"

### Relationship Tags
"enemies to lovers", "friends to lovers", "second chance", "forbidden love", "age gap", "fake relationship", "marriage of convenience", "arranged marriage", "office romance", "opposites attract", "love triangle", "polyamory", "soulmates"

### Character Tags
"alpha male", "strong heroine", "single parent", "boss", "cowboy", "doctor", "teacher", "artist", "billionaire", "virgin", "experienced", "dominant", "submissive", "bad boy", "nerd", "athlete", "musician", "chef", "lawyer", "firefighter", "police", "military", "royalty"

### Theme Tags
"slow burn", "instalove", "workplace romance", "holiday romance", "secret baby", "amnesia", "revenge", "redemption", "healing", "found family", "coming of age", "mistaken identity", "secret identity", "forced proximity"

### Content Tags
"steamy", "explicit", "emotional", "angst", "humor", "suspense", "mystery", "dark", "sweet", "fluffy", "drama", "action", "adventure", "thriller", "tear-jerker"

### Fanfic Tags
"harry potter", "lord of the rings", "star wars", "marvel", "divergent", "game of thrones", "twilight", "percy jackson", "hunger games", "supernatural", "sherlock", "pride and prejudice"

## Guidelines
- Select 5-8 tags that best represent the story's core elements
- Prioritize tags that readers are most likely to search for
- Include a mix of broad genre tags and specific trope/theme tags
- Always use lowercase for consistency
- Choose tags that accurately reflect the story content
- Consider both mainstream and niche audiences`;

  const prompt = `Analyze this story outline and select 5-8 relevant tags from the established categories:

${outline}`;

  const maxRetries = 3;
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🏷️  Generating tags with GPT-4.1-mini (attempt ${attempt}/${maxRetries})`
      );
      const { object } = await generateObject({
        model: openai("gpt-4.1-mini"),
        system: systemPrompt,
        prompt,
        schema: TagsSchema,
        temperature: 0.2,
      });
      return object;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `❌ Failed to generate tags (attempt ${attempt}/${maxRetries}):`,
        lastError.message
      );

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Tags generation failed: ${lastError.message}`);
}

// Generate trigger warnings
async function generateTriggerWarnings(
  outline: string
): Promise<z.infer<typeof TriggerWarningsSchema>> {
  const systemPrompt = `You are a content safety specialist identifying potentially triggering content in romance fiction.

Key trigger categories: violence, abuse, non-consensual content, substance abuse, mental health issues, death/grief, medical trauma, toxic relationships, stalking/harassment, child-related trauma, etc.

Guidelines:
- Only warn for content explicitly present in the story
- Use specific terms, not vague warnings
- Consensual BDSM is not abuse
- Age gap warnings for 10+ year differences with power dynamics`;

  const prompt = `Review this story outline and identify any content requiring trigger warnings:

${outline}`;

  const maxRetries = 3;
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `⚠️  Generating trigger warnings with GPT-4.1-mini (attempt ${attempt}/${maxRetries})`
      );
      const { object } = await generateObject({
        model: openai("gpt-4.1-mini"),
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

**Sexually Explicit Flag**: Determine if this is sexually explicit content:
- TRUE: Contains graphic sexual descriptions, detailed intimate acts, explicit language about body parts/sexual acts
- FALSE: Contains only romantic tension, kissing, fade-to-black scenes, or mild sensual content`;

  const maxRetries = 3;
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🔞 Detecting explicit content with GPT-4.1-mini (attempt ${attempt}/${maxRetries})`
      );
      const { object } = await generateObject({
        model: openai("gpt-4.1-mini"),
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
    // Execute all four AI calls in parallel
    const [
      titleDescriptionResult,
      tagsResult,
      triggerWarningsResult,
      explicitContentResult,
    ] = await Promise.all([
      generateTitleDescription(outline),
      generateTags(outline),
      generateTriggerWarnings(outline),
      detectExplicitContent(outline),
    ]);

    // Combine results
    const metadata = {
      ...titleDescriptionResult,
      ...tagsResult,
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
