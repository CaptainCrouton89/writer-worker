// AI client wrapper for generation

import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { Result } from "../types/generation.js";

// AI interaction function
export const callAI = async (
  prompt: string,
  temperature: number = 0.7
): Promise<Result<string>> => {
  try {
    const { text } = await generateText({
      model: google("gemini-2.5-pro"),
      prompt,
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