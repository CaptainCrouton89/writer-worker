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
  tags: z.array(z.string()).describe("A list of 5-8 lowercase string tags that categorize the story's themes, genres, and content"),
  trigger_warnings: z.array(z.string()).describe("A list of content warnings for potentially sensitive themes (e.g., 'violence', 'non-consensual', 'substance abuse', 'mental health', 'death')"),
  is_sexually_explicit: z.boolean().describe("Whether the story contains explicit sexual content (true for graphic sexual descriptions, false for mild romantic content)")
});

// Generate sequence title and description
export const generateSequenceMetadata = async (
  outline: string,
  preferences: { spiceLevel: number; selectedSettings: readonly string[]; selectedPlots: readonly string[]; selectedThemes: readonly string[] },
  temperature: number = 0.7
): Promise<Result<{ title: string; description: string; tags: string[]; trigger_warnings: string[]; is_sexually_explicit: boolean }>> => {
  try {
    const spiceLabels = ["Tease", "Steamy", "Spicy hot"];
    const spiceLevel = spiceLabels[preferences.spiceLevel] || "Steamy";
    
    const settings = preferences.selectedSettings.join(", ") || "contemporary setting";
    const plots = preferences.selectedPlots.join(", ") || "forbidden attraction";  
    const themes = preferences.selectedThemes.join(", ") || "passion and desire";

    const prompt = `Based on this story outline, generate a compelling title, 2-sentence description, relevant tags, trigger warnings, and content rating for a ${spiceLevel.toLowerCase()} romance story set in ${settings}, featuring ${plots} and exploring themes of ${themes}.

Story Outline:
${outline}

**Requirements:**

**Title**: Should be catchy and hint at the romantic/erotic nature without being too explicit.

**Description**: Should entice readers by highlighting the main conflict, romantic tension, and what makes this story unique, while being appropriate for the ${spiceLevel} spice level.

**Tags**: Provide 5-8 lowercase string tags that categorize the story. Use common literature and erotica tags such as:
- Genre tags: "contemporary", "historical", "fantasy", "paranormal", "military", "medical", "billionaire", "small town"
- Relationship tags: "enemies to lovers", "friends to lovers", "second chance", "forbidden love", "age gap", "fake relationship", "marriage of convenience"
- Character tags: "alpha male", "strong heroine", "single parent", "boss", "cowboy", "doctor", "teacher", "artist"
- Theme tags: "slow burn", "instalove", "workplace romance", "holiday romance", "secret baby", "amnesia", "revenge"
- Content tags: "steamy", "explicit", "emotional", "angst", "humor", "suspense", "mystery"
- Setting tags: "office", "ranch", "hospital", "college", "small town", "big city", "vacation", "wedding"

**Trigger Warnings**: Analyze the story content and provide appropriate trigger warnings. Common triggers include:
- "violence", "domestic abuse", "sexual assault", "non-consensual", "dubious consent"
- "substance abuse", "addiction", "mental health", "self-harm", "suicide"
- "death", "grief", "miscarriage", "infertility", "medical trauma"
- "age gap", "power imbalance", "cheating", "infidelity"
- "kidnapping", "stalking", "manipulation", "gaslighting"
- "pregnancy", "childbirth", "parental abandonment"
Only include warnings that are actually relevant to the story content.

**Sexually Explicit Flag**: Determine if this is sexually explicit content:
- TRUE: Contains graphic sexual descriptions, detailed intimate acts, explicit language about body parts/sexual acts
- FALSE: Contains only romantic tension, kissing, fade-to-black scenes, or mild sensual content

Consider the ${spiceLevel} level: "Tease" is typically false, "Steamy" can be either, "Spicy hot" is typically true.`;

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