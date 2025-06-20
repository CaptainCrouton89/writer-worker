// AI client wrapper for generation

import { google } from "@ai-sdk/google";
import { generateText, generateObject } from "ai";
import { z } from "zod";
import { Result } from "../types/generation.js";

// AI interaction function
export const callAI = async (
  prompt: string,
  temperature: number = 0.7,
  system?: string
): Promise<Result<string>> => {
  try {
    const { text } = await generateText({
      model: google("gemini-2.5-pro"),
      prompt,
      system,
      temperature,
    });

    return { success: true, data: text };
  } catch (error) {
    return {
      success: false,
      error: `AI generation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};

// Schema for sequence metadata
const SequenceMetadataSchema = z.object({
  title: z.string().describe("A compelling, concise title for the story"),
  description: z.string().describe("A 2-sentence description of the story that entices readers"),
  tags: z.array(z.string()).describe("A list of 5-8 lowercase string tags that categorize the story's themes, genres, and content")
});

// Generate sequence title and description
export const generateSequenceMetadata = async (
  outline: string,
  preferences: { spiceLevel: number; selectedSettings: readonly string[]; selectedPlots: readonly string[]; selectedThemes: readonly string[] },
  temperature: number = 0.7
): Promise<Result<{ title: string; description: string; tags: string[] }>> => {
  try {
    const spiceLabels = ["Tease", "Steamy", "Spicy hot"];
    const spiceLevel = spiceLabels[preferences.spiceLevel] || "Steamy";
    
    const settings = preferences.selectedSettings.join(", ") || "contemporary setting";
    const plots = preferences.selectedPlots.join(", ") || "forbidden attraction";  
    const themes = preferences.selectedThemes.join(", ") || "passion and desire";

    const prompt = `Based on this story outline, generate a compelling title, 2-sentence description, and relevant tags for a ${spiceLevel.toLowerCase()} romance story set in ${settings}, featuring ${plots} and exploring themes of ${themes}.

Story Outline:
${outline}

The title should be catchy and hint at the romantic/erotic nature without being too explicit. The description should entice readers by highlighting the main conflict, romantic tension, and what makes this story unique, while being appropriate for the ${spiceLevel} spice level.

For tags, provide 5-8 lowercase string tags that categorize the story. Use common literature and erotica tags such as:
- Genre tags: "contemporary", "historical", "fantasy", "paranormal", "military", "medical", "billionaire", "small town"
- Relationship tags: "enemies to lovers", "friends to lovers", "second chance", "forbidden love", "age gap", "fake relationship", "marriage of convenience"
- Character tags: "alpha male", "strong heroine", "single parent", "boss", "cowboy", "doctor", "teacher", "artist"
- Theme tags: "slow burn", "instalove", "workplace romance", "holiday romance", "secret baby", "amnesia", "revenge"
- Content tags: "steamy", "explicit", "emotional", "angst", "humor", "suspense", "mystery"
- Setting tags: "office", "ranch", "hospital", "college", "small town", "big city", "vacation", "wedding"

Choose tags that accurately reflect the story content, setting, character dynamics, and spice level.`;

    const { object } = await generateObject({
      model: google("gemini-2.5-pro"),
      prompt,
      schema: SequenceMetadataSchema,
      temperature,
    });

    return { success: true, data: object };
  } catch (error) {
    return {
      success: false,
      error: `Sequence metadata generation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};