// Outline generation and regeneration functions

import { callAI, generateSequenceMetadata } from "../ai/client.js";
import {
  SPICE_LEVELS,
  STORY_LENGTH_CONFIG,
  STORY_LENGTH_PAGES,
  TEMPERATURE_BY_SPICE,
} from "../constants/generation.js";
import {
  buildOutlinePrompt,
  buildOutlineSystemPrompt,
  buildUserContext,
} from "../prompts/outline.js";
import { supabase } from "../supabase.js";
import {
  Chapter,
  Result,
  StoryOutline,
  UserPreferences,
} from "../types/generation.js";
import {
  generateOutlineEmbedding,
  saveOutlineEmbedding,
} from "../utils/embedding.js";
import { outlineToText, parseOutlineResponse } from "../utils/outline.js";

// Generate story outline only
export const generateStoryOutline = async (
  preferences: UserPreferences
): Promise<Result<StoryOutline>> => {
  console.log("🚀 Starting outline generation");
  console.log("📝 User preferences:", buildUserContext(preferences));

  const outlinePrompt = buildOutlinePrompt(preferences);
  const systemPrompt = buildOutlineSystemPrompt(preferences);
  console.log("\n🔮 Requesting story outline from AI...");

  const temperature = TEMPERATURE_BY_SPICE[preferences.spiceLevel];
  const outlineResult = await callAI(outlinePrompt, temperature, systemPrompt);
  if (!outlineResult.success) {
    console.error("❌ Outline generation failed:", outlineResult.error);
    return outlineResult;
  }
  console.log("✅ Outline generated successfully");

  const parseResult = parseOutlineResponse(outlineResult.data);
  if (!parseResult.success) {
    console.error("❌ Outline parsing failed:", parseResult.error);
    return parseResult;
  }
  console.log(`📋 Parsed ${parseResult.data.chapters.length} chapters`);

  // Generate title and description with retry logic
  console.log("🎯 Generating sequence title and description...");
  const outlineText = outlineToText(parseResult.data);

  let metadataResult = await generateSequenceMetadata(outlineText, preferences);

  // Retry once if first attempt fails
  if (!metadataResult.success) {
    console.warn("⚠️ First metadata generation attempt failed, retrying...");
    metadataResult = await generateSequenceMetadata(outlineText, preferences);
  }

  let finalOutline = parseResult.data;
  if (metadataResult.success) {
    console.log("✅ Sequence metadata generated successfully");
    finalOutline = {
      ...parseResult.data,
      title: metadataResult.data.title,
      description: metadataResult.data.description,
      tags: metadataResult.data.tags,
      trigger_warnings: metadataResult.data.trigger_warnings,
      is_sexually_explicit: metadataResult.data.is_sexually_explicit,
    };
  } else {
    console.error(
      "❌ Failed to generate sequence metadata after retry:",
      metadataResult.error
    );
  }

  // Note: For standalone outline generation, embedding will be handled when used in job context

  return { success: true, data: finalOutline };
};

// Regenerate outline with user prompt, preserving completed chapters
export const regenerateOutlineWithUserPrompt = async (
  existingOutline: StoryOutline,
  userPrompt: string,
  preferences: UserPreferences,
  currentChapterIndex: number,
  jobId?: string
): Promise<Result<StoryOutline>> => {
  console.log(
    `🔄 Regenerating outline with user prompt starting from chapter ${
      currentChapterIndex + 1
    } (index ${currentChapterIndex})`
  );
  console.log(`📝 User prompt: ${userPrompt}`);

  const config =
    STORY_LENGTH_CONFIG[
      preferences.storyLength as keyof typeof STORY_LENGTH_CONFIG
    ];
  const spiceLevel = SPICE_LEVELS[preferences.spiceLevel];
  const pageCount = STORY_LENGTH_PAGES[preferences.storyLength];

  // Build context from completed chapters (excluding current chapter being worked on)
  const completedChapters = existingOutline.chapters.slice(
    0,
    currentChapterIndex
  );
  const completedContext = completedChapters
    .map(
      (ch, i) =>
        `Chapter ${i + 1}: ${ch.name}\n${ch.bullets
          .map((b) => `- ${b.text}`)
          .join("\n")}`
    )
    .join("\n\n");

  console.log(
    `📋 Completed chapters: ${completedChapters.length} (indices 0-${
      currentChapterIndex - 1
    })`
  );
  console.log(
    `📋 Current chapter index: ${currentChapterIndex} (Chapter ${
      currentChapterIndex + 1
    })`
  );

  // Calculate remaining chapters (including current chapter being worked on)
  const remainingChapterCount = config.chapterCount - currentChapterIndex;
  console.log(
    `📋 Remaining chapters to regenerate: ${remainingChapterCount} (from Chapter ${
      currentChapterIndex + 1
    })`
  );

  if (remainingChapterCount <= 0) {
    console.log("✅ No remaining chapters to regenerate");
    return { success: true, data: existingOutline };
  }

  // Build settings context
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

  const regeneratePrompt = `You are updating a story outline based on new user direction. The story is a ${pageCount} page smut story about ${plots} set in ${settings}, exploring themes of ${themes}.

<completed_chapters>
${completedContext}
</completed_chapters>

<user_direction>
${userPrompt}
</user_direction>

Generate ${remainingChapterCount} new chapter names and plot points that continue from where the completed chapters left off, incorporating the user's new direction. For each chapter list ${
    config.bulletsPerChapter
  } bulleted plot points. The bullet points should include ${
    smutDescriptors[spiceLevel]
  } and require that those scenes focus on ${smutRequirements[spiceLevel]}.

<requirements>
- Create exactly ${remainingChapterCount} chapters (starting from Chapter ${
    currentChapterIndex + 1
  })
- Each chapter must have exactly ${config.bulletsPerChapter} bullet points
- Include ${smutDescriptors[spiceLevel]}
- Focus on ${smutRequirements[spiceLevel]}
- Be descriptive and provocative appropriate to the ${spiceLevel} level
- Bullet points should be longer and more detailed than typical plot points
- Each bullet point should be 2-3 sentences that clearly describe a scene, emotional beats, and specific actions
- Make bullet points substantial enough to generate ${
    config.pagesPerBullet
  } pages of content each
- Ensure continuity from the completed chapters
- Incorporate the user's new direction naturally into the story progression
</requirements>

<output_format>
Your response must follow this EXACT format:

Chapter ${currentChapterIndex + 1}: [Chapter Title]
- [First bullet point describing specific scene/event]
- [Second bullet point describing specific scene/event] 
- [Third bullet point describing specific scene/event]
- [Fourth bullet point describing specific scene/event]  
- [Fifth bullet point describing specific scene/event]

Chapter ${currentChapterIndex + 2}: [Chapter Title]
- [First bullet point describing specific scene/event]
- [Second bullet point describing specific scene/event]
- [Third bullet point describing specific scene/event] 
- [Fourth bullet point describing specific scene/event]
- [Fifth bullet point describing specific scene/event]

[Continue for all remaining chapters...]
</output_format>`;

  const temperature = TEMPERATURE_BY_SPICE[preferences.spiceLevel];
  const systemPrompt = buildOutlineSystemPrompt(preferences);
  const outlineResult = await callAI(
    regeneratePrompt,
    temperature,
    systemPrompt
  );
  if (!outlineResult.success) {
    console.error("❌ Outline regeneration failed:", outlineResult.error);
    return outlineResult;
  }
  console.log("✅ New outline generated successfully");

  // Parse the new chapters
  const parseResult = parseOutlineResponse(outlineResult.data);
  if (!parseResult.success) {
    console.error("❌ New outline parsing failed:", parseResult.error);
    return parseResult;
  }

  // Combine completed chapters with new ones
  const newChapters = parseResult.data.chapters;
  const combinedChapters = [...completedChapters, ...newChapters];

  console.log(
    `📋 Combined ${completedChapters.length} existing + ${newChapters.length} new = ${combinedChapters.length} total chapters`
  );
  console.log(
    `📋 Combined chapter titles: ${combinedChapters
      .map((ch, i) => `${i + 1}. ${ch.name}`)
      .join(", ")}`
  );

  let finalOutline: StoryOutline = {
    chapters: combinedChapters as readonly Chapter[],
  };

  // Generate title and description for the updated outline with retry logic
  console.log("🎯 Generating updated sequence title and description...");
  const outlineText = outlineToText(finalOutline);

  let metadataResult = await generateSequenceMetadata(outlineText, preferences);

  // Retry once if first attempt fails
  if (!metadataResult.success) {
    console.warn(
      "⚠️ First updated metadata generation attempt failed, retrying..."
    );
    metadataResult = await generateSequenceMetadata(outlineText, preferences);
  }

  if (metadataResult.success) {
    console.log("✅ Updated sequence metadata generated successfully");
    finalOutline = {
      ...finalOutline,
      title: metadataResult.data.title,
      description: metadataResult.data.description,
      tags: metadataResult.data.tags,
      trigger_warnings: metadataResult.data.trigger_warnings,
      is_sexually_explicit: metadataResult.data.is_sexually_explicit,
    };
  } else {
    console.error(
      "❌ Failed to generate updated sequence metadata after retry:",
      metadataResult.error
    );
  }

  // Generate and save outline embedding to sequence if jobId provided
  if (jobId) {
    try {
      const { data: jobData, error: jobError } = await supabase
        .from("generation_jobs")
        .select("sequence_id")
        .eq("id", jobId)
        .single();

      if (jobError) {
        console.error(`❌ Failed to fetch job sequence_id:`, jobError);
      } else if (jobData?.sequence_id) {
        const embeddingResult = await generateOutlineEmbedding(finalOutline);
        if (embeddingResult) {
          await saveOutlineEmbedding(jobData.sequence_id, embeddingResult);
        }
      }
    } catch (error) {
      console.error("❌ Error generating outline embedding:", error);
    }
  }

  return {
    success: true,
    data: finalOutline,
  };
};
