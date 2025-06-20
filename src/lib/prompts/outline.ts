// Prompt building functions for story outline generation

import { UserPreferences } from "../types/generation.js";
import { 
  SPICE_LEVELS, 
  STORY_LENGTHS, 
  STORY_LENGTH_PAGES, 
  STORY_LENGTH_CONFIG 
} from "../constants/generation.js";

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
  const pageCount = STORY_LENGTH_PAGES[preferences.storyLength];
  const spiceLevel = SPICE_LEVELS[preferences.spiceLevel];
  const config =
    STORY_LENGTH_CONFIG[
      preferences.storyLength as keyof typeof STORY_LENGTH_CONFIG
    ];

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

  // Adjust smut descriptors based on spice level
  const smutDescriptors = {
    Tease: "sensual tension and suggestive scenes",
    Steamy: "passionate encounters with moderate explicit content",
    "Spicy hot":
      "highly explicit sexual content with detailed physical descriptions",
  };

  const smutRequirements = {
    Tease:
      "subtle physical attraction, lingering touches, and building sexual tension",
    Steamy:
      "passionate kissing, intimate touching, and moderately explicit sexual scenes",
    "Spicy hot":
      "explicit physical descriptions of sex and the characters' body parts during sex",
  };

  // Story length specific bullet examples
  const bulletExamples = {
    0: "- Sarah enters the coffee shop and immediately locks eyes with the mysterious barista, feeling an unexpected flutter of attraction that makes her stomach tighten with anticipation",
    1: "- During their first dance lesson, Marcus positions himself behind Elena, his hands guiding her hips as she feels the heat of his body pressing against her back, both of them struggling to maintain professional boundaries",
    2: "- After weeks of stolen glances and subtle flirtation, James finally corners Rebecca in the supply closet, their heated argument about the project dissolving into breathless tension as he pins her against the wall, their faces inches apart",
  };

  return `Generate a list of ${
    config.chapterCount
  } chapter names for a ${pageCount} page smut story about ${plots} set in ${settings}, exploring themes of ${themes}. For each chapter list ${
    config.bulletsPerChapter
  } bulleted plot points that must take place in that chapter. The bullet points should include ${
    smutDescriptors[spiceLevel]
  } and require that those scenes focus on ${
    smutRequirements[spiceLevel]
  }. Do not hold back on descriptive detail appropriate to the ${spiceLevel} spice level. Start your response with "Of course! Here is the list:"

<requirements>
- Create exactly ${config.chapterCount} chapters
- Each chapter must have exactly ${config.bulletsPerChapter} bullet points
- Include ${smutDescriptors[spiceLevel]}
- Focus on ${smutRequirements[spiceLevel]}
- Be descriptive and provocative appropriate to the ${spiceLevel} level
- Bullet points should be longer and more detailed than typical plot points
- Each bullet point should be 2-3 sentences that clearly describe a scene, emotional beats, and specific actions
- Make bullet points substantial enough to generate ${
    config.pagesPerBullet
  } pages of content each
</requirements>

<bullet_point_example>
Here's an example of the level of detail expected for bullet points in a ${
    STORY_LENGTHS[preferences.storyLength]
  }:
${bulletExamples[preferences.storyLength as keyof typeof bulletExamples]}
</bullet_point_example>

<output_format>
Your response must follow this EXACT format:

Of course! Here is the list:

Chapter 1: [Chapter Title]
- [First bullet point describing specific scene/event]
- [Second bullet point describing specific scene/event] 
- [Third bullet point describing specific scene/event]
- [Fourth bullet point describing specific scene/event]  
- [Fifth bullet point describing specific scene/event]

Chapter 2: [Chapter Title]
- [First bullet point describing specific scene/event]
- [Second bullet point describing specific scene/event]
- [Third bullet point describing specific scene/event] 
- [Fourth bullet point describing specific scene/event]
- [Fifth bullet point describing specific scene/event]

[Continue for all 5 chapters...]
</output_format>`;
};