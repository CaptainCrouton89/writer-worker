// Prompt building functions for story outline generation

import {
  SPICE_DESCRIPTOR,
  SPICE_LEVELS,
  STORY_LENGTHS,
  STORY_LENGTH_CONFIG,
  STORY_LENGTH_PAGES,
} from "../constants/generation.js";
import { UserPreferences } from "../types/generation.js";

// System prompt for outline generation
export const buildOutlineSystemPrompt = (
  preferences: UserPreferences
): string => {
  const spiceLevel = SPICE_LEVELS[preferences.spiceLevel];
  const spiceDescriptor = SPICE_DESCRIPTOR[spiceLevel];
  const storyLength = STORY_LENGTHS[preferences.storyLength];
  const config =
    STORY_LENGTH_CONFIG[
      preferences.storyLength as keyof typeof STORY_LENGTH_CONFIG
    ];

  const spiceGuidelines = {
    Tease: `- Build romantic tension very gradually throughout the story arc
- Start with character establishment and non-romantic interactions
- Progress slowly through friendship, then attraction, then light physical contact
- Peak intensity should focus on passionate kissing and sensual moments that imply intimacy
- Emphasize the emotional journey and slow-burn connection - romance should not dominate early chapters`,
    Steamy: `- Build sexual tension progressively from emotional connection to physical intimacy
- Early chapters: Focus on character development and plot with subtle romantic undertones
- Mid-story: Include passionate kissing, touching, and moderate sexual tension
- Later chapters: Feature moderately explicit romantic encounters with emotional depth
- Allow proper time for relationship development before intimate moments`,
    "Spicy hot": `- Build attraction and chemistry gradually, ramping to explicit encounters
- Early chapters: Establish characters and plot with underlying sexual tension
- Mid-story: Include passionate encounters with increasing sexual content
- Later chapters: Feature highly explicit sexual scenarios with graphic descriptions and vivid imagery
- Maintain character development alongside the sexual progression with proper pacing`,
  };

  const bulletExamples = {
    Tease: `Early story chapter example: Sarah and Marcus walk to her car after their coffee date. They discuss work projects. Marcus offers to help with her presentation.`,
    Steamy: `Middle of the story chapter example: Emma and Chef Rodriguez find themselves alone after cooking class, their professional dynamic shifting as he guides her technique from behind, the physical proximity building tension until their first passionate kiss ignites against the kitchen counter.`,
    "Spicy hot": `Late story chapter example: After months of building attraction, Veronica and her business rival finally confront their desire during a late office meeting, their professional argument dissolving into passionate intimacy as they give in to the explosive chemistry they've been fighting.`,
  };

  return `You are an expert story architect specializing in adult romance fiction. Your task is to create compelling, well-structured story outlines that balance character development with intimate relationships. You understand pacing, tension, and how to weave romance throughout a narrative arc.

<content_focus>
${spiceGuidelines[spiceLevel]}
</content_focus>

<story_structure>
- Create ${config.chapterCount} chapters for a ${
    STORY_LENGTH_PAGES[preferences.storyLength]
  } page story
- Each chapter should have exactly ${config.bulletsPerChapter} plot points
- Each plot point should generate approximately ${
    config.pagesPerBullet
  } pages of content
- Build romantic/sexual tension very gradually throughout the story - start with non-romantic interactions
- Early chapters should focus primarily on character establishment and plot setup with minimal romance
- Romance should develop slowly over multiple chapters before any intimate moments
- Later chapters should contain the peak intensity for the chosen spice level
- Include both character development and relationship progression
</story_structure>

<bullet_point_style>
Write concise bullet points that are 1-2 sentences long. Each should:
- Build romance very gradually - most early chapters should focus on non-romantic interactions
- Provide concrete story events that can be expanded into detailed content

Keep bullets sparse, so as to be most useful for a writer to expand into detailed content later. Example style for ${spiceDescriptor} stories:
${bulletExamples[spiceLevel]}
</bullet_point_style>

<output_format>
Begin your response with: "Of course! Here is the list:"

Then follow this exact structure:

Chapter 1: [Chapter Title]
- [First detailed plot point]
- [Second detailed plot point]
- [Third detailed plot point]
- [Fourth detailed plot point]
- [Fifth detailed plot point]

Chapter 2: [Chapter Title]
[Continue same format for all chapters...]
</output_format>`;
};

export const buildUserContext = (preferences: UserPreferences): string => {
  const settings =
    preferences.selectedSettings.length > 0
      ? preferences.selectedSettings.join(", ")
      : "Not specified";

  const plots =
    preferences.selectedPlots.length > 0
      ? preferences.selectedPlots.join(", ")
      : "Not specified";

  const themes =
    preferences.selectedThemes.length > 0
      ? preferences.selectedThemes.join(", ")
      : "Not specified";

  const customParts = [
    preferences.customSetting && `Custom Setting: ${preferences.customSetting}`,
    preferences.customPlot && `Custom Plot: ${preferences.customPlot}`,
    preferences.customThemes && `Custom Themes: ${preferences.customThemes}`,
  ].filter(Boolean);

  return [
    `Settings: ${settings}`,
    ...customParts,
    `Plot: ${plots}`,
    `Themes: ${themes}`,
    `Spice Level: ${SPICE_LEVELS[preferences.spiceLevel]}`,
    `Story Length: ${STORY_LENGTHS[preferences.storyLength]}`,
  ].join("\n");
};

export const buildOutlinePrompt = (preferences: UserPreferences): string => {
  // Build a more contextual story premise based on preferences
  const settings =
    preferences.customSetting ||
    preferences.selectedSettings.join(", ") ||
    "a contemporary setting";
  const plots =
    preferences.customPlot ||
    preferences.selectedPlots.join(", ") ||
    "forbidden attraction";
  const themes =
    preferences.customThemes ||
    preferences.selectedThemes.join(", ") ||
    "passion and desire";

  return `<story_premise>
Create a story about ${plots} set in ${settings}, exploring themes of ${themes}.
</story_premise>`;
};
