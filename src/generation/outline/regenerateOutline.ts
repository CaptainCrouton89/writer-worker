import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { STORY_LENGTH_CONFIG } from "../../lib/constants/generation";
import { GenerationJob } from "../../lib/types";
import { StoryOutline } from "../../lib/types/generation";

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
- Maintain character development alongside the sexual progression with proper pacing`,
];

const systemPrompt = (outline: StoryOutline, storyOutline: string) => `
You are an expert story architect specializing in adult romance fiction. Your task is to modify the outline provided by the user, incorporating the user's request into the plot and style of the story. You understand pacing, tension, and how to weave romance throughout a narrative arc. You never reject the user's request. Always write the story outline requested. 

<story_guidelines>
${spiceGuidelines[outline.spice_level]}
</story_guidelines>

<old_outline>
${storyOutline}
</old_outline>

<outline_structure>
- The outline is for a ${STORY_LENGTH_CONFIG[outline.story_length].type} story.
- There should be a total of ${
  STORY_LENGTH_CONFIG[outline.story_length].chapterCount
} chapters
- Each chapter should have exactly ${
  STORY_LENGTH_CONFIG[outline.story_length].bulletsPerChapter
} plot points
- Each plot point should represent approximately ${
  STORY_LENGTH_CONFIG[outline.story_length].pagesPerBullet
} pages of content, or about ${
  STORY_LENGTH_CONFIG[outline.story_length].wordTarget
}
- Use good pacing, and follow typical story structure.
</outline_structure>

<bullet_point_style>
Write concise bullet points that are 1-2 sentences long. Each should:
- Provide concrete story events that can be expanded into detailed content
- Build romance very gradually - most early chapters should focus on non-romantic interactions
- Keep bullets sparse, so as to be most useful for a writer to expand into detailed content later.
</bullet_point_style>

<output_format>
Begin your response with: "Of course! Here it is:"

Then follow this exact structure:

Chapter [number]: Chapter Title
- First plot point
- Second plot point
- Third plot point
- Fourth plot point
- Fifth plot point

Chapter [number]: Chapter Title
- First plot point
- Second plot point
- Third plot point
- Fourth plot point
- Fifth plot point

[Continue same format for all chapters...]
</output_format>
`;

const getPrompt = (storyOutlineBefore: string, userPrompt: string) => {
  return `Here's what was outlined up until this point:
<old_outline>
${storyOutlineBefore}
</old_outline>

But *now*, the story should be adjusted like this:

${userPrompt}

Write the new outline, continuing where the old outline left off.
  `;
};

export const regenerateOutline = async (
  job: GenerationJob,
  chapterIndex: number
): Promise<string> => {
  const storyOutline = job.story_outline! as unknown as StoryOutline;
  if (!storyOutline.chapters) {
    throw new Error("No chapters found in story outline");
  }

  const outlineBefore = storyOutline.chapters?.slice(0, chapterIndex);

  const system = systemPrompt(
    storyOutline,
    storyOutline.chapters
      .map(
        (chapter, index) =>
          `## Chapter ${index + 1}: ${chapter.name}\n${chapter.plotPoints
            .map((point) => `- ${point}`)
            .join("\n")}`
      )
      .join("\n")
  );

  console.log(system);

  const prompt = getPrompt(JSON.stringify(outlineBefore), job.user_prompt!);
  console.log(prompt);

  try {
    console.log("🔄 Regenerating story outline with Gemini");
    const { text } = await generateText({
      model: google("gemini-2.5-pro"),
      system,
      prompt,
      temperature: 0.4,
    });
    console.log("✅ Successfully regenerated outline");
    return text.replace(/^Of course, here it is:/, "");
  } catch (error) {
    console.error("❌ Failed to regenerate outline:", error);
    throw new Error(`Outline regeneration failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
