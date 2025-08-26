import { openai } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";
import { STORY_LENGTH_CONFIG } from "../../lib/constants/generation.js";

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
    .describe(
      "A list of 0-5 content warnings for potentially sensitive themes"
    ),
});

// Schema for explicit content detection
const ExplicitContentSchema = z.object({
  is_sexually_explicit: z
    .boolean()
    .describe("Whether the story contains R-rated sexual content"),
});

// Schema for target audience
const TargetAudienceSchema = z.object({
  target_audience: z
    .array(
      z.enum([
        "straight-women",
        "straight-men",
        "bi-women",
        "bi-men",
        "gay-men",
        "lesbian",
        "queer",
      ])
    )
    .describe(
      "Array of target audiences who would most likely enjoy this story"
    ),
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
  target_audience: z
    .array(
      z.enum([
        "straight-women",
        "straight-men",
        "bi-women",
        "bi-men",
        "gay-men",
        "lesbian",
        "queer",
      ])
    )
    .describe(
      "Array of target audiences who would most likely enjoy this story"
    ),
});

// Generate title and description only
async function generateTitleDescription(
  outline: string,
  storyLength: number = 0
): Promise<z.infer<typeof TitleDescriptionSchema>> {
  const storyConfig = STORY_LENGTH_CONFIG[storyLength];
  const storyType = storyConfig.type;

  // Create conditional system prompts based on story length
  let titleConventions = "";

  if (storyLength === 0) {
    // Short story - keep existing clickbait style
    titleConventions = `### Title Conventions
- Create clickbait-style titles that grab attention immediately
- Write it to appeal to a female audience
- Be descriptive in the title; the readers are scanning quickly
- Focus on the immediate hook or central situation
- Make it punchy and direct for quick consumption`;
  } else if (storyLength === 1) {
    // Novella - balance between clickbait and literary
    titleConventions = `### Title Conventions
- Create intriguing titles that hint at story complexity
- Write it to appeal to a female audience
- Balance descriptive elements with emotional intrigue
- Suggest character development and relationship evolution
- Make it engaging but not overly clickbait-y`;
  } else {
    // Slow burn/novel - more literary, book-like titles
    titleConventions = `### Title Conventions
- Create literary-style titles appropriate for full-length novels
- Write it to appeal to a female audience
- Focus on emotional themes, character journeys, or symbolic elements
- Use more sophisticated, book-like naming conventions
- Emphasize the emotional arc and relationship depth
- Think like traditional romance novel titles`;
  }

  const systemPrompt = `## Identity
You are a romance and erotic fiction title specialist with expertise in creating compelling, marketable titles and descriptions.

This is a ${storyType} with ${storyConfig.chapterCount} chapters.

${titleConventions}

### Description Best Practices
- Start with a direct statement of what happens in the story
- Clearly identify the main characters and their relationship
- State the central conflict or obstacle plainly
- Mention the setting and time period if relevant
- Be factual and informative about the story's content`;

  const prompt = `Generate a title and description for this story outline:
${outline}`;

  // Debug logging
  console.log(`🔍 Title/Description generation input:`, {
    outlineLength: outline.length,
    outlinePreview: outline.substring(0, 200) + "...",
    storyLength,
    storyType,
  });

  const maxRetries = 3;
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `📝 Generating title/description with OpenRouter Gemini (attempt ${attempt}/${maxRetries})`
      );
      const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
      });
      const { object } = await generateObject({
        model: openrouter("google/gemini-2.5-pro"),
        system: systemPrompt,
        prompt,
        schema: TitleDescriptionSchema,
        temperature: 0.3,
      });
      return object;
    } catch (openrouterError) {
      lastError =
        openrouterError instanceof Error
          ? openrouterError
          : new Error(String(openrouterError));
      console.error(
        `❌ OpenRouter failed (attempt ${attempt}/${maxRetries}):`,
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
"strong heroine", "single parent", "boss", "cowboy", "doctor", "teacher", "artist", "billionaire", "virgin", "experienced", "dominant", "submissive", "bad boy", "nerd", "athlete", "musician", "chef", "lawyer", "firefighter", "police", "military", "royalty"

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
      // Ensure all tags are lower-cased before returning
      return {
        tags: object.tags.map((tag) => tag.toLowerCase()),
      };
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
- 1-2 words maximum
- Age gap warnings for 10+ year differences with power dynamics
- Do not include trigger warnings if they are not present in the story`;

  const prompt = `Review this story outline and identify any content requiring trigger warnings:

${outline}

Only list common, well-known trigger warnings, or none at all if none exist.`;

  const maxRetries = 3;
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `⚠️  Generating trigger warnings with GPT-5-mini (attempt ${attempt}/${maxRetries})`
      );
      const { object } = await generateObject({
        model: openai("gpt-5-mini"),
        system: systemPrompt,
        prompt,
        schema: TriggerWarningsSchema,
        temperature: 1,
      });
      // Ensure all trigger warnings are lower-cased before returning
      return {
        trigger_warnings: object.trigger_warnings.map((warning) =>
          warning.toLowerCase()
        ),
      };
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
  const systemPrompt = `You are a content classifier. Determine if stories contain R-rated, hardcore sexually explicit content.`;

  const prompt = `Determine if this story contains R-rated, hardcore sexually explicit content.

Story Outline:
${outline}`;
  const maxRetries = 3;
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🔞 Detecting explicit content with GPT-5-nano (attempt ${attempt}/${maxRetries})`
      );
      const { object } = await generateObject({
        model: openai("gpt-5-nano"),
        system: systemPrompt,
        prompt,
        schema: ExplicitContentSchema,
        temperature: 1,
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

// Generate target audience
async function generateTargetAudience(
  outline: string
): Promise<z.infer<typeof TargetAudienceSchema>> {
  const systemPrompt = `You are an audience analysis specialist for romance and erotic fiction. Analyze story content to determine target audiences based on character dynamics, relationship types, and appeal factors.

Target Audience Categories:
- "straight-women": Stories featuring heterosexual relationships with female-focused perspectives, strong female characters, and romantic elements that appeal to straight women
- "straight-men": Stories with heterosexual relationships from male perspectives or with themes that appeal to straight men
- "bi-women": Stories with bisexual female characters, multiple gender attraction, or themes that resonate with bisexual women
- "bi-men": Stories with bisexual male characters, multiple gender attraction, or themes that resonate with bisexual men
- "gay-men": Stories featuring male-male relationships, gay male characters, or themes that appeal to gay men
- "lesbian": Stories featuring female-female relationships, lesbian characters, or themes that appeal to lesbian women
- "queer": Stories with non-binary characters, gender-fluid themes, or general LGBTQ+ content that doesn't fit other specific categories

Guidelines:
- Select 1-3 primary target audiences based on the story's main characters, relationships, and themes
- Consider the perspective and focus of the story (whose experience is centered)
- Look for specific relationship dynamics and character types
- Stories can have multiple target audiences if they have broad appeal, but most have just one`;

  const prompt = `Analyze this story outline and determine which target audiences would most likely enjoy this story:

${outline}

Consider the main characters, relationship dynamics, perspective, and themes to select the most appropriate target audiences.`;

  const maxRetries = 3;
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🎯 Generating target audience with GPT-5-nano (attempt ${attempt}/${maxRetries})`
      );
      const { object } = await generateObject({
        model: openai("gpt-5-nano"),
        system: systemPrompt,
        prompt,
        schema: TargetAudienceSchema,
        temperature: 1,
      });
      return object;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `❌ Failed to generate target audience (attempt ${attempt}/${maxRetries}):`,
        lastError.message
      );

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Target audience generation failed: ${lastError.message}`);
}

// Main function that orchestrates parallel calls
export const generateSequenceMetadata = async (
  outline: string,
  storyLength: number = 0
): Promise<z.infer<typeof SequenceMetadataSchema>> => {
  console.log("🏷️ Generating sequence metadata with parallel AI calls");

  try {
    // Execute all five AI calls in parallel
    const [
      titleDescriptionResult,
      tagsResult,
      triggerWarningsResult,
      explicitContentResult,
      targetAudienceResult,
    ] = await Promise.all([
      generateTitleDescription(outline, storyLength),
      generateTags(outline),
      generateTriggerWarnings(outline),
      detectExplicitContent(outline),
      generateTargetAudience(outline),
    ]);

    // Combine results
    const metadata = {
      ...titleDescriptionResult,
      ...tagsResult,
      ...triggerWarningsResult,
      ...explicitContentResult,
      ...targetAudienceResult,
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
