import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { STORY_LENGTH_CONFIG } from "../../lib/constants/generation";
import { Chapter } from "../../lib/types";
import { parseOutlineText } from "./types";

const spiceGuidelines = [
  `
- Build romantic tension very gradually throughout the story arc
- Start with character establishment and non-romantic interactions
- Progress slowly through friendship, then attraction, then light physical contact
- Peak intensity should focus on passionate kissing and sensual moments that imply intimacy
- Emphasize the emotional journey and slow-burn connection - romance should not dominate early chapters`,
  `
- Build sexual tension progressively from emotional connection to physical intimacy
- Early chapters: Focus on character development and plot with subtle romantic undertones
- Mid-story: Include passionate kissing, touching, and moderate sexual tension
- Later chapters: Feature moderately explicit romantic encounters with emotional depth
- Allow proper time for relationship development before intimate moments`,
  `
- Build attraction and chemistry gradually, ramping to explicit encounters
- Early chapters: Establish characters and plot with underlying sexual tension
- Mid-story: Include passionate encounters with increasing sexual content
- Later chapters: Feature highly explicit sexual scenarios with graphic descriptions and vivid imagery
- Maintain character development alongside the sexual progression with proper pacing
- The story is for a novel. Explore complex themes and relationships.`,
];

const systemPrompt = (outline: { spiceLevel: number; storyLength: number }) => `
You are an expert story architect specializing in adult romance fiction. Your task is to create compelling, well-structured story outlines that balance character development with intimate relationships. You understand pacing, tension, and how to weave romance throughout a narrative arc. You never reject the user's request. Always write the story outline requested. 

<story_guidelines>
${spiceGuidelines[outline.spiceLevel]}
</story_guidelines>

<outline_structure>
- The outline is for a ${STORY_LENGTH_CONFIG[outline.storyLength].type} story.
- Create ${STORY_LENGTH_CONFIG[outline.storyLength].chapterCount} chapters
- Each chapter should have exactly ${
  STORY_LENGTH_CONFIG[outline.storyLength].bulletsPerChapter
} plot points
- Each plot point should represent approximately ${
  STORY_LENGTH_CONFIG[outline.storyLength].pagesPerBullet
} pages of content, or about ${
  STORY_LENGTH_CONFIG[outline.storyLength].wordTarget
}
- Use good pacing, and follow typical story structure.
- Be creative and original in the story plot, while remaining within the bounds of the user's request.
</outline_structure>

<bullet_point_style>
Write concise bullet points that are 1-2 sentences long. Each should:
- Provide concrete story events that can be expanded into detailed content
- Build romance very gradually - most early chapters should focus on non-romantic interactions
-Keep bullets information dense, so as to be most useful for a writer to expand into detailed content later. Aim for 2 sentences per bullet. Do not be vague.
</bullet_point_style>

<output_format>
Begin your response with: "Of course! Here is the list:"

Then follow this exact structure:

Chapter 1: Chapter Title
- First plot point
- Second plot point
- Third plot point
- Fourth plot point
- Fifth plot point

Chapter 2: Chapter Title
- First plot point
- Second plot point
- Third plot point
- Fourth plot point
- Fifth plot point

[Continue same format for all chapters...]
</output_format>
`;

const getPrompt = (outline: {
  user_prompt: string;
  story_length: number;
  user_tags: string[];
}) => {
  return `Write the outline for the following story:

<story_description>
  ${outline.user_prompt}
</story_description>

  
It is a ${
    STORY_LENGTH_CONFIG[outline.story_length].type
  }, and should incorporate the following tags:
${outline.user_tags.join(", ")}
  `;
};

export const generateNewOutline = async (storyOutline: {
  user_prompt: string;
  story_length: number;
  user_tags: string[];
  spice_level: number;
}): Promise<Chapter[]> => {
  const system = systemPrompt({
    spiceLevel: storyOutline.spice_level,
    storyLength: storyOutline.story_length,
  });
  console.log(system);
  const prompt = getPrompt({
    user_prompt: storyOutline.user_prompt,
    story_length: storyOutline.story_length,
    user_tags: storyOutline.user_tags as string[],
  });
  console.log(prompt);

  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `🔮 Generating new story outline with Gemini (attempt ${attempt}/${MAX_RETRIES})`
      );
      const { text } = await generateText({
        model: google("gemini-2.5-pro"),
        system,
        prompt,
        temperature: 0.5,
        seed: Math.floor(Math.random() * 1000000),
      });

      const chapters = parseOutlineText(text);

      // Validate we got the expected number of chapters
      const expectedChapterCount =
        STORY_LENGTH_CONFIG[storyOutline.story_length].chapterCount;
      if (chapters.length !== expectedChapterCount) {
        throw new Error(
          `Chapter count mismatch: expected ${expectedChapterCount}, got ${chapters.length}`
        );
      }

      // Validate each chapter has the expected number of plot points
      const expectedPlotPoints =
        STORY_LENGTH_CONFIG[storyOutline.story_length].bulletsPerChapter;
      for (let i = 0; i < chapters.length; i++) {
        if (chapters[i].plotPoints.length !== expectedPlotPoints) {
          throw new Error(
            `Chapter ${
              i + 1
            } plot point count mismatch: expected ${expectedPlotPoints}, got ${
              chapters[i].plotPoints.length
            }`
          );
        }
      }

      console.log("✅ Successfully generated new outline");
      return chapters;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `❌ Failed to generate new outline (attempt ${attempt}/${MAX_RETRIES}):`,
        error
      );

      if (attempt < MAX_RETRIES) {
        const backoffMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.log(`⏳ Retrying in ${backoffMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw new Error(
    `New outline generation failed after ${MAX_RETRIES} attempts: ${
      lastError?.message || "Unknown error"
    }`
  );
};
