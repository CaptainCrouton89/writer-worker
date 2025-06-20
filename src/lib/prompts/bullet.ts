// Prompt building functions for bullet and chapter content generation

import { ChapterBullet, Chapter, StoryOutline, UserPreferences } from "../types/generation.js";
import { SPICE_LEVELS, STORY_LENGTH_CONFIG } from "../constants/generation.js";

export const buildBulletPrompt = (
  bullet: ChapterBullet,
  chapter: Chapter,
  previousContent?: string,
  nextBullet?: ChapterBullet,
  allPreviousContent?: string,
  preferences?: UserPreferences
): string => {
  const isFirstBullet = bullet.index === 0;
  const isLastBullet = bullet.index === chapter.bullets.length - 1;
  const spiceLevel = preferences
    ? SPICE_LEVELS[preferences.spiceLevel]
    : "Steamy";
  const config = preferences
    ? STORY_LENGTH_CONFIG[
        preferences.storyLength as keyof typeof STORY_LENGTH_CONFIG
      ]
    : STORY_LENGTH_CONFIG[1];

  // Build chapter outline context
  const chapterOutline = `Chapter: "${chapter.name}"
Plot points:
${chapter.bullets.map((b, i) => `${i + 1}. ${b.text}`).join("\n")}`;

  let prompt = "";

  if (isFirstBullet && !previousContent) {
    // First bullet of the chapter
    prompt = `Write a ${config.pagesPerBullet}-page narrative for the bullet: "${bullet.text}". This is the first bullet point in Chapter: "${chapter.name}". Create an engaging opening that sets up the story and covers the contents of this bullet point.`;
  } else if (previousContent && !isLastBullet && nextBullet) {
    // Middle bullets with context
    prompt = `Continue from the last response to write the narrative for the following bullet. "${bullet.text}". Cover the contents of "${bullet.text}". Do not exceed the plot point described by the bullet. Instead, end the response in a position where the next bullet can pick up seamlessly. In this case, end right before "${nextBullet.text}".`;

    // Include context of the story so far if we have substantial previous content
    if (allPreviousContent && allPreviousContent.length > 500) {
      prompt = `<story_context>
${allPreviousContent}
</story_context>

${prompt}`;
    }
  } else if (isLastBullet) {
    // Last bullet of the chapter
    prompt = `Continue from the last response to write the narrative for the following bullet: "${bullet.text}". This is the final bullet point in the chapter.`;
  } else {
    // Standalone bullet (shouldn't normally happen)
    prompt = `Write a ${config.pagesPerBullet}-page narrative for the bullet: "${bullet.text}". Cover the contents of this bullet point with detailed descriptions.`;
  }

  // Add chapter outline context to all prompts
  prompt = `<chapter_outline>
${chapterOutline}
</chapter_outline>

${prompt}`;

  // Adjust requirements based on spice level
  const smutRequirements = {
    Tease: `- Build sexual tension through subtle touches, meaningful glances, and suggestive dialogue
- Focus on emotional connection and anticipation
- Keep physical descriptions tasteful and suggestive rather than explicit
- Use metaphor and implication for intimate moments`,
    Steamy: `- Include passionate kissing, touching, and moderate sexual content
- Describe physical sensations and emotional responses
- Balance explicit content with emotional depth
- Include some detailed physical descriptions during intimate scenes`,
    "Spicy hot": `- Include explicit sexual content with detailed physical descriptions where indicated
- Focus on body parts, sensations, and intimate actions during sexual scenes
- Be descriptive and provocative in the smut scenes
- Do not hold back on explicit detail`,
  };

  prompt += `\n\nRequirements:
- Write approximately ${config.pagesPerBullet} pages of content (${config.wordTarget})
${smutRequirements[spiceLevel]}
- Ensure smooth narrative flow from previous content
- Stay true to the characters and story established so far
- End at a natural transition point for the next scene`;

  return prompt;
};

export const buildChapterPrompt = (
  chapter: Chapter,
  preferences?: UserPreferences
): string => {
  if (chapter.bullets.length === 0) {
    return `Write a 2-page narrative for Chapter: "${chapter.name}". Create an engaging opening chapter that sets up the story.`;
  }

  // For now, generate first bullet only - we'll expand this later for full chapter generation
  return buildBulletPrompt(
    chapter.bullets[0],
    chapter,
    undefined,
    chapter.bullets[1],
    undefined,
    preferences
  );
};

// Build an isolated bullet prompt (for non-sequential generation)
export const buildIsolatedBulletPrompt = (
  previousBullet: ChapterBullet | undefined,
  currentBullet: ChapterBullet,
  nextBullet: ChapterBullet | undefined,
  storyOutline: StoryOutline,
  preferences: UserPreferences
): string => {
  const spiceLevel = SPICE_LEVELS[preferences.spiceLevel];
  const config =
    STORY_LENGTH_CONFIG[
      preferences.storyLength as keyof typeof STORY_LENGTH_CONFIG
    ];

  let prompt = "";

  if (previousBullet) {
    prompt = `Write a ${config.pagesPerBullet}-page narrative for the bullet after, "${previousBullet.text}". Cover the contents of "${currentBullet.text}".`;
  } else {
    prompt = `Write a ${config.pagesPerBullet}-page narrative for the bullet: "${currentBullet.text}".`;
  }

  if (nextBullet) {
    prompt += ` Do not exceed the plot point described by the next bullet. Instead, end the response in a position where the next bullet can pick up seamlessly. In this case, end right before "${nextBullet.text}".`;
  }

  // Include the full outline for context
  const outlineContext = storyOutline.chapters
    .map(
      (ch, i) =>
        `Chapter ${i + 1}: ${ch.name}\n${ch.bullets
          .map((b) => `- ${b.text}`)
          .join("\n")}`
    )
    .join("\n\n");

  prompt = `<story_outline>
${outlineContext}
</story_outline>

${prompt}`;

  // Add spice-level specific requirements
  const smutRequirements = {
    Tease: `- Build sexual tension through subtle touches, meaningful glances, and suggestive dialogue
- Focus on emotional connection and anticipation
- Keep physical descriptions tasteful and suggestive rather than explicit`,
    Steamy: `- Include passionate kissing, touching, and moderate sexual content
- Describe physical sensations and emotional responses
- Balance explicit content with emotional depth`,
    "Spicy hot": `- Include explicit sexual content with detailed physical descriptions
- Focus on body parts, sensations, and intimate actions during sexual scenes
- Be descriptive and provocative in the smut scenes`,
  };

  prompt += `\n\nRequirements:
- Write approximately ${config.pagesPerBullet} pages of content (${config.wordTarget})
${smutRequirements[spiceLevel]}
- Create vivid scenes that bring the story to life
- Ensure narrative coherence with the overall story arc`;

  return prompt;
};