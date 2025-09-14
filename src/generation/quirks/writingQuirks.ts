import { generateObject } from "ai";
import { z } from "zod";
import { AuthorStyle, SpiceLevel } from "../../lib/types";
import { ModelService } from "../../services/model-service.js";
import { STYLE_GUIDELINES } from "../constants";

// Schema for writing quirks response
const WritingQuirksSchema = z.object({
  quirks: z
    .array(z.string())
    .length(8)
    .describe(
      "A writing quirk in format 'Title - Description', e.g., 'Occasional Flashbacks - 2-3 sentence memories in italics'"
    )
    .nullable(),
});

export type WritingQuirksResponse = z.infer<typeof WritingQuirksSchema>;

/**
 * Generates 8 creative writing quirks using OpenRouter Gemini 2.5 Pro
 * Returns null 20% of the time for stories without quirks
 */
export const generateWritingQuirks = async (
  authorStyle: AuthorStyle,
  spiceLevel: SpiceLevel,
  storyDescription: string,
  modelId?: string,
  forceGeneration: boolean = false
): Promise<WritingQuirksResponse | null> => {
  const authorStyleString = STYLE_GUIDELINES[authorStyle];
  const spiceLevelString = ["sweet romance", "moderate heat", "explicit"][
    spiceLevel
  ];
  // 40% chance of no quirks (unless forced for testing)
  if (!forceGeneration && Math.random() < 0.4) {
    console.log("📝 No writing quirks for this story (40% chance)");
    return null;
  }
  const systemPrompt = `You are ${authorStyleString}, a creative writing specialist focused on subtle, effective stylistic techniques that enhance narrative flow without disruption.

<format>
Each quirk MUST follow: "[Name] - [How it appears in text]"
Example: "Italic Memories - Brief flashbacks appear in italics, usually one sentence"
</format>

<types_of_quirks>
**Sentence Structure:**
- One-word sentences for emphasis ("Perfect." "Never." "Finally.")
- Fragment sentences during intense moments ("Just breathing. Waiting.")
- Run-on sentences during overwhelming emotions
- Starting sentences with "And" or "But" for conversational flow

**Memory & Time:**
- Italic flashbacks (1-2 sentences max)
- Present tense for memories
- Time skips marked by extra line breaks
- Sensory triggers for memories (a scent, a sound)

**Emphasis Techniques:**
- Repetition for impact ("She ran. Ran until her lungs burned.")
- Em-dashes for interruptions or sudden thoughts
- Ellipses for trailing thoughts or hesitation
- Parenthetical asides (brief internal commentary)

**Narrative Rhythm:**
- Short paragraphs during action (1-2 sentences)
- Longer paragraphs for description/reflection
- Single-line dialogue without tags in rapid exchanges
- Sentence fragments in emotional peaks

**Internal Voice:**
- Rhetorical questions in narration
- Direct thoughts without italics or tags
- Second-person internal dialogue ("You know better than this")
- Stream of consciousness during stress
</types_of_quirks>

<examples>
- "Italic Flashbacks - Brief memories in italics interrupt the narrative, usually one sentence"
- "One-Word Impact - Single-word sentences for emotional emphasis"
- "Fragment Tension - Incomplete sentences during high-stress moments"
- "Sensory Memories - Specific scents or sounds trigger brief flashback lines"
- "Em-dash Thoughts - Sudden realizations interrupt sentences with em-dashes"
- "Rhetorical Questions - Narrator poses unanswered questions to build tension"
- "And/But Starters - Sentences begin with conjunctions for conversational flow"
</examples>

<requirements>
✓ All quirks must be subtle and unobtrusive
✓ Focus on enhancing emotion and pacing
✓ Avoid anything that feels gimmicky
✓ Keep techniques that readers won't consciously notice
✓ Ensure natural integration with narrative flow
</requirements>

<philosophy>
Writing quirks should be:
- Subtle enhancements that readers may not consciously notice
- Natural extensions of the narrative voice
- Used sparingly to avoid overuse
- Focused on rhythm, emphasis, and emotional impact
</philosophy>`;

  const prompt = `<story_context>
Author Style: ${authorStyleString}
Romance/Erotic Level: ${spiceLevelString}
Story Description: ${storyDescription}
</story_context>

Generate exactly 8 subtle writing quirks that enhance the narrative without disrupting flow. Focus on techniques that feel natural and unobtrusive.`;

  const maxRetries = 3;
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `📝 Generating writing quirks (attempt ${attempt}/${maxRetries})`
      );

      // Get model and provider
      const model = await ModelService.getModel(modelId);
      const modelProvider = ModelService.getModelProvider(model);

      const { object } = await generateObject({
        model: modelProvider,
        system: systemPrompt,
        prompt,
        schema: WritingQuirksSchema,
        temperature: 0.7,
        seed: Math.floor(Math.random() * 1000000),
      });

      console.log("✅ Successfully generated writing quirks");
      return object;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `❌ Failed to generate writing quirks (attempt ${attempt}/${maxRetries}):`,
        lastError.message
      );

      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.log(`⏳ Retrying in ${backoffMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw new Error(
    `Writing quirks generation failed after ${maxRetries} attempts: ${lastError.message}`
  );
};

/**
 * Selects a random quirk from the quirks array
 * Returns null if no quirks provided
 */
export const selectRandomQuirk = (quirks: string[] | null): string | null => {
  if (!quirks || quirks.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * quirks.length);
  return quirks[randomIndex];
};
