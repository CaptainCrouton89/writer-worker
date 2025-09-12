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
  spiceLevel: SpiceLevel
): Promise<WritingQuirksResponse> => {
  const systemPrompt = `You are a creative writing specialist who understands various narrative techniques and stylistic quirks that make stories unique and engaging.

Your task is to generate exactly 4 creative writing quirks that would enhance a story's narrative style. Each quirk should be formatted as "Title - Description" where:
- Title: A concise name for the writing technique
- Description: A brief explanation of how it's used (1-2 sentences maximum)

Consider the author style (${authorStyle}) and spice level (${spiceLevel}) when selecting appropriate quirks.

Examples of good writing quirks:
- "Occasional Flashbacks - 2-3 sentence memories in italics"
- "Stream of Consciousness - Internal monologues revealing thoughts"
- "Epistolary Elements - Letters or diary entries in narrative"
- "Multiple POVs - Alternating character perspectives"
- "Breaking Fourth Wall - Direct reader addresses"
- "Repetitive Motifs - Recurring phrases with evolving meaning"
- "Fragmented Sentences - Short punchy sentences for intensity"
- "Non-linear Timeline - Time jumps and parallel narratives"

Be creative and come up with fresh, interesting techniques that would add depth and personality to storytelling.`;

  const prompt = `Generate 4 unique and creative writing quirks that would enhance narrative storytelling. Consider author style ${authorStyle} and spice level ${spiceLevel}.

Each quirk should follow the format: "Title - Description"

Make them diverse and interesting - mix different types of narrative techniques like dialogue quirks, structural elements, stylistic choices, and formatting techniques.`;

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