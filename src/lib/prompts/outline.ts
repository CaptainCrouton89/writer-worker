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
    Tease: `- Focus on emotional tension, longing glances, and suggestive situations
- Build anticipation through subtle physical contact and romantic chemistry
- Include sensual moments that imply intimacy without explicit details
- Emphasize the emotional journey and connection between characters`,
    Steamy: `- Include passionate romantic encounters with moderate sexual content
- Balance emotional depth with physical attraction and intimate scenes
- Feature kissing, touching, and sexual tension that leads to moderately explicit encounters
- Show both the emotional and physical aspects of the relationship`,
    "Spicy hot": `- Create highly explicit sexual scenarios with graphic physical descriptions
- Focus extensively on sexual encounters, desires, and physical intimacy
- Include detailed sexual content throughout the story progression
- Emphasize raw passion, lust, and uninhibited sexual exploration`,
  };

  const bulletExamples = {
    Tease: {
      0: `- Sarah enters the coffee shop and immediately locks eyes with the mysterious barista, feeling an unexpected flutter of attraction that makes her stomach tighten with anticipation`,
      1: `- During their first dance lesson, Marcus positions himself behind Elena, his hands guiding her hips as she feels the heat of his body pressing against her back, both of them struggling to maintain professional boundaries`,
      2: `- After weeks of stolen glances and subtle flirtation, James finally corners Rebecca in the supply closet, their heated argument about the project dissolving into breathless tension as he pins her against the wall, their faces inches apart`,
    },
    Steamy: {
      0: `- When the elevator breaks down, trapped alone with her rival colleague, Emma finds herself pressed against him in the darkness, their professional animosity giving way to undeniable chemistry as his breath tickles her ear`,
      1: `- The cooking class becomes intensely intimate when Chef Rodriguez stands behind Maya, his strong hands covering hers as he guides the knife, his proximity making her pulse race as she feels every muscle in his chest against her back`,
      2: `- During the midnight thunderstorm, when the power goes out in the cabin, Alex and Jordan finally give in to months of sexual tension, their first kiss becoming a passionate encounter that leads them to the bedroom`,
    },
    "Spicy hot": {
      0: `- The high-stakes poker game turns into a seduction when Veronica deliberately brushes her hand against the mysterious stranger's thigh, leading to an explosive encounter in the private VIP room where boundaries are completely abandoned`,
      1: `- What starts as an argument between rivals in the empty office building escalates into raw, primal passion as they tear at each other's clothes, their hate-fueled desire culminating in an intense sexual encounter on the conference table`,
      2: `- The exclusive underground club's private room becomes the setting for an uninhibited threesome, where inhibitions are shed along with clothes and every fantasy becomes reality in explicit, graphic detail`,
    },
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
- Build romantic/sexual tension progressively throughout the story
- Include both character development and relationship progression
</story_structure>

<bullet_point_style>
Write detailed, scene-specific bullet points that are 2-3 sentences long. Each should:
- Describe a specific scene, location, or event
- Include emotional beats and character motivations  
- Specify the romantic/sexual content level appropriate for ${spiceDescriptor}
- Provide enough detail to generate substantial content

Example for ${spiceDescriptor} stories at ${spiceDescriptor} level:
${
  bulletExamples[spiceLevel][
    preferences.storyLength as keyof (typeof bulletExamples)[typeof spiceLevel]
  ]
}
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
