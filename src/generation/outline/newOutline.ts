import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { STORY_LENGTH_CONFIG } from "../../lib/constants/generation";
import { AuthorStyle, Chapter, SpiceLevel, StoryLength } from "../../lib/types";
import { STYLE_GUIDELINES, SPICE_GUIDELINES_OUTLINE, NOVEL_FORMULAS, CUSTOM_STORY_LENGTH_GUIDELINES } from "../constants";
import { parseOutlineText } from "./types";


const getRandomFormula = (): string => {
  return NOVEL_FORMULAS[Math.floor(Math.random() * NOVEL_FORMULAS.length)];
};


const systemPrompt = (outline: {
  spiceLevel: SpiceLevel;
  story_length: StoryLength;
  structureFormula: string;
  author_style: AuthorStyle;
}) => `
You are an expert story architect specializing in adult romance fiction. Your task is to create compelling, well-structured story outlines that balance character development with intimate relationships. You understand pacing, tension, and how to weave romance throughout a narrative arc. You never reject the user's request. Always write the story outline requested. 

<story_guidelines>
${SPICE_GUIDELINES_OUTLINE[outline.spiceLevel] || SPICE_GUIDELINES_OUTLINE[0]}
- Write in the style of ${STYLE_GUIDELINES[outline.author_style]}
</story_guidelines>

<structure_formula>
Use the following narrative structure as an approximate guide for pacing and story beats:
${outline.structureFormula}

Adapt this structure to fit the story content and chapter count, using it as inspiration for overall pacing and narrative flow.
</structure_formula>

<outline_structure>
- The outline is for a ${STORY_LENGTH_CONFIG[outline.story_length].type} story.
- Create ${STORY_LENGTH_CONFIG[outline.story_length].chapterCount} chapters
- Each chapter should have exactly ${
  STORY_LENGTH_CONFIG[outline.story_length].bulletsPerChapter
} plot points
- Each plot point should represent approximately ${
  STORY_LENGTH_CONFIG[outline.story_length].pagesPerBullet
} pages of content, or about ${
  STORY_LENGTH_CONFIG[outline.story_length].wordTarget
}
- Be creative and original in the story plot, while remaining within the bounds of the user's request.
${CUSTOM_STORY_LENGTH_GUIDELINES[outline.story_length]}
</outline_structure>

<bullet_point_style>
Write concise bullet points that are 2-3 sentences long. Each should:
- Provide concrete story events that can be expanded into detailed content
- Build romance very gradually - most early chapters should focus on non-romantic interactions
- Keep bullets information dense, so as to be most useful for a writer to expand into detailed content later. Aim for 2 sentences per bullet. Do not be vague.
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

Failing to provide the exact structure will result in a rejection.
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

There should be ${
    STORY_LENGTH_CONFIG[outline.story_length].chapterCount
  } chapters, with ${
    STORY_LENGTH_CONFIG[outline.story_length].bulletsPerChapter
  } plot points per chapter.

Respond with only the outline.
  `;
};

export const generateNewOutline = async (storyOutline: {
  user_prompt: string;
  story_length: StoryLength;
  user_tags: string[];
  spice_level: SpiceLevel;
  author_style: AuthorStyle;
}): Promise<Chapter[]> => {
  // Validate story_length
  if (
    storyOutline.story_length == null ||
    storyOutline.story_length < 0 ||
    storyOutline.story_length >= STORY_LENGTH_CONFIG.length
  ) {
    throw new Error(
      `Invalid story length: ${storyOutline.story_length}. Must be 0, 1, or 2.`
    );
  }

  // Validate spice_level
  if (
    storyOutline.spice_level == null ||
    storyOutline.spice_level < 0 ||
    storyOutline.spice_level > 2
  ) {
    throw new Error(
      `Invalid spice level: ${storyOutline.spice_level}. Must be 0, 1, or 2.`
    );
  }

  const selectedFormula = getRandomFormula();
  const system = systemPrompt({
    spiceLevel: storyOutline.spice_level,
    story_length: storyOutline.story_length,
    structureFormula: selectedFormula,
    author_style: storyOutline.author_style,
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
