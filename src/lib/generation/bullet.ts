// Bullet content generation functions

import { ChapterBullet, Chapter, Result, UserPreferences } from "../types/generation.js";
import { TEMPERATURE_BY_SPICE, SPICE_LEVELS } from "../constants/generation.js";
import { buildBulletPrompt, buildFictionSystemPrompt } from "../prompts/bullet.js";
import { callAI } from "../ai/client.js";

// Generate content for a specific bullet point
export const generateBulletContent = async (
  bullet: ChapterBullet,
  chapter: Chapter,
  previousContent?: string,
  allPreviousContent?: string,
  preferences?: UserPreferences
): Promise<Result<string>> => {
  const nextBullet =
    bullet.index < chapter.bullets.length - 1
      ? chapter.bullets[bullet.index + 1]
      : undefined;
  const bulletPrompt = buildBulletPrompt(
    bullet,
    chapter,
    previousContent,
    nextBullet,
    allPreviousContent,
    preferences
  );

  console.log(
    `\n✍️ Generating content for bullet ${bullet.index + 1}: "${
      bullet.text
    }"...`
  );

  const temperature = preferences
    ? TEMPERATURE_BY_SPICE[preferences.spiceLevel]
    : 0.7;
  const spiceLevel = preferences
    ? SPICE_LEVELS[preferences.spiceLevel]
    : "Steamy";
  const systemPrompt = buildFictionSystemPrompt(spiceLevel);
  const result = await callAI(bulletPrompt, temperature, systemPrompt);
  if (result.success) {
    console.log(
      `✅ Bullet ${bullet.index + 1} generated successfully (${
        result.data.length
      } characters)`
    );
  } else {
    console.error(
      `❌ Bullet ${bullet.index + 1} generation failed:`,
      result.error
    );
  }

  return result;
};