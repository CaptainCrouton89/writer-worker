import { google } from "@ai-sdk/google";
import { generateText } from "ai";

interface SanitizationLevel {
  level: 1 | 2;
  description: string;
}

/**
 * Sanitizes a video prompt to make it less explicit using AI
 * @param prompt The original prompt to sanitize
 * @param level The sanitization level (1 = mild, 2 = strong)
 * @returns A sanitized version of the prompt
 */
export async function sanitizeVideoPrompt(
  prompt: string,
  level: SanitizationLevel
): Promise<string> {
  const levelDescriptions = {
    1: "Make this prompt slightly less explicit while maintaining the emotional and romantic essence. Focus more on emotions and atmosphere rather than physical details.",
    2: "Make this prompt significantly more subtle and artistic. Remove any potentially explicit content and focus entirely on emotional storytelling, facial expressions, and cinematic atmosphere.",
  };

  const systemPrompt = `You are a prompt sanitizer for video generation. Your job is to rewrite prompts to be less explicit while maintaining their artistic and emotional value.

SANITIZATION LEVEL ${level.level}: ${levelDescriptions[level.level]}

GUIDELINES:
- Preserve the emotional core and romantic tension
- Focus on facial expressions, eyes, and emotional states
- Use more metaphorical and artistic language
- Emphasize atmosphere, lighting, and mood
- Remove or soften any physical descriptions that might be too explicit
- Keep the cinematic terminology (e.g., [Close-up], [Wide shot])
- Maintain the same general scene but with more artistic framing
- Ensure the output remains under 500 characters

IMPORTANT: Return ONLY the sanitized prompt without any explanation or prefix.`;

  const userPrompt = `Sanitize this video prompt according to level ${level.level} guidelines:

${prompt}`;

  try {
    console.log(`🧹 Sanitizing prompt at level ${level.level}`);
    
    const result = await generateText({
      model: google("gemini-2.5-pro"),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    let sanitizedPrompt = result.text.trim();
    
    // Remove any quotation marks if present
    sanitizedPrompt = sanitizedPrompt.replace(/^["']|["']$/g, "");
    
    // Ensure it's within character limits
    if (sanitizedPrompt.length > 500) {
      sanitizedPrompt = sanitizedPrompt.slice(0, 497) + "...";
    }

    console.log(`✅ Prompt sanitized successfully`);
    console.log(`Original: ${prompt.substring(0, 100)}...`);
    console.log(`Sanitized: ${sanitizedPrompt.substring(0, 100)}...`);
    
    return sanitizedPrompt;
  } catch (error) {
    console.error(`❌ Error sanitizing prompt: ${error}`);
    throw new Error(`Failed to sanitize prompt: ${error}`);
  }
}

/**
 * Progressively sanitizes a prompt through multiple attempts
 * @param originalPrompt The original enhanced prompt
 * @param attemptNumber Which attempt this is (1-based)
 * @returns A sanitized version appropriate for the attempt number
 */
export async function progressivelySanitizePrompt(
  originalPrompt: string,
  attemptNumber: number
): Promise<string> {
  if (attemptNumber === 1) {
    // First retry: mild sanitization
    return await sanitizeVideoPrompt(originalPrompt, { level: 1, description: "mild" });
  } else if (attemptNumber >= 2) {
    // Second retry and beyond: strong sanitization
    return await sanitizeVideoPrompt(originalPrompt, { level: 2, description: "strong" });
  }
  
  // Should not reach here, but return original if somehow we do
  return originalPrompt;
}