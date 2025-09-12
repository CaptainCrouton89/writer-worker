import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";
import { AuthorStyle, SpiceLevel } from "../../lib/types";

// Schema for writing quirks response
const WritingQuirksSchema = z.object({
  quirks: z
    .array(z.string())
    .length(4)
    .describe("A writing quirk in format 'Title - Description', e.g., 'Occasional Flashbacks - 2-3 sentence memories in italics'"),
});

export type WritingQuirksResponse = z.infer<typeof WritingQuirksSchema>;

/**
 * Generates 4 creative writing quirks using OpenRouter Gemini 2.5 Pro
 */
export const generateWritingQuirks = async (
  authorStyle: AuthorStyle,
  spiceLevel: SpiceLevel,
  storyDescription: string
): Promise<WritingQuirksResponse> => {
  const systemPrompt = `You are an expert creative writing specialist and narrative technique architect specializing in crafting unique stylistic elements that elevate storytelling. You have deep knowledge of literary devices, narrative structures, and innovative writing techniques across all genres.

<context>
Author Style: ${authorStyle}
Spice Level: ${spiceLevel}
</context>

Your expertise enables you to identify and create distinctive writing quirks that:
- Enhance reader engagement through unexpected narrative techniques
- Create memorable stylistic signatures that define a story's voice
- Balance creativity with readability for optimal storytelling impact
- Adapt to different genres, tones, and thematic requirements

You understand that effective writing quirks serve specific narrative purposes: they deepen characterization, control pacing, enhance atmosphere, or provide structural innovation. Each quirk should feel intentional and integrated rather than gimmicky.`;

  const prompt = `<story_context>
${storyDescription}
</story_context>

<task>
Generate exactly 4 creative and purposeful writing quirks for the story described above. These quirks should enhance the narrative's unique voice and complement its themes, setting, and characters.

<format_requirements>
Each quirk must follow this exact format:
"[Technique Name] - [Specific implementation description]"

Requirements for each quirk:
- Technique Name: A memorable, concise label (2-4 words)
- Implementation: A concrete description of how it appears in the text (1-2 sentences, be specific about execution)
</format_requirements>

<quirk_categories>
Select from diverse categories to create variety:
1. Structural Elements (timeline manipulation, chapter formats, narrative framing)
2. Voice Techniques (POV shifts, narrative distance, unreliable narration)
3. Stylistic Choices (sentence patterns, rhythm variations, linguistic quirks)
4. Sensory/Atmospheric (sensory focus, mood techniques, environmental integration)
5. Character-Driven (internal dialogue styles, thought representation, perspective filters)
6. Meta-Textual (reader interaction, genre awareness, narrative commentary)
</quirk_categories>

<quality_criteria>
Each quirk should:
- Feel organic to THIS specific story's needs
- Serve a clear narrative purpose beyond mere decoration
- Be implementable consistently throughout the narrative
- Enhance rather than distract from the story's core elements
- Work harmoniously with the other selected quirks
</quality_criteria>

<examples>
Strong quirks for reference (create NEW ones, don't copy these):
- "Sensory Memory Triggers - Key moments introduced through specific scents or textures that transport characters"
- "Countdown Chapters - Each chapter title shows time remaining until a pivotal event"
- "Dialogue Echo Patterns - Important phrases subtly repeat across different conversations with evolving meanings"
- "Environmental Mirrors - Weather and settings reflect internal emotional states without explicit connection"
- "Nested Perspectives - Stories within stories that parallel the main narrative"
- "Linguistic Evolution - Character speech patterns gradually change to reflect their development"
</examples>

Generate 4 innovative writing quirks that will make this story distinctive and memorable. Focus on techniques that specifically enhance THIS story's unique elements rather than generic stylistic choices.
</task>`;

  const maxRetries = 3;
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `📝 Generating writing quirks with OpenRouter Gemini (attempt ${attempt}/${maxRetries})`
      );
      
      const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
      });
      
      const { object } = await generateObject({
        model: openrouter("google/gemini-2.5-pro"),
        system: systemPrompt,
        prompt,
        schema: WritingQuirksSchema,
        temperature: 0.7,
        seed: Math.floor(Math.random() * 1000000),
      });

      console.log("✅ Successfully generated writing quirks");
      return object;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `❌ Failed to generate writing quirks (attempt ${attempt}/${maxRetries}):`,
        lastError.message
      );

      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.log(`⏳ Retrying in ${backoffMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw new Error(
    `Writing quirks generation failed after ${maxRetries} attempts: ${lastError.message}`
  );
};

/**
 * Selects a random quirk from the quirks array
 */
export const selectRandomQuirk = (quirks: string[]): string => {
  if (quirks.length === 0) {
    throw new Error("No quirks provided to select from");
  }
  
  const randomIndex = Math.floor(Math.random() * quirks.length);
  return quirks[randomIndex];
};