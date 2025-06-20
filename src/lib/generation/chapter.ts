// Chapter generation functions

import { supabase } from "../supabase.js";
import { UserPreferences, StoryOutline, Result } from "../types/generation.js";
import { TEMPERATURE_BY_SPICE, SPICE_LEVELS } from "../constants/generation.js";
import { buildUserContext, buildOutlinePrompt, buildOutlineSystemPrompt } from "../prompts/outline.js";
import { buildBulletPrompt, buildFictionSystemPrompt } from "../prompts/bullet.js";
import { parseOutlineResponse, extractChapterByIndex } from "../utils/outline.js";
import { generateOutlineEmbedding, saveOutlineEmbedding } from "../utils/embedding.js";
import { callAI } from "../ai/client.js";

// Generate complete chapter by combining all bullets
export const generateCompleteFirstChapter = async (
  preferences: UserPreferences,
  chapterId?: string,
  progressCallback?: (step: string, progress: number) => Promise<void>,
  existingOutline?: StoryOutline,
  resumeFromPartialContent?: boolean,
  jobId?: string,
  chapterIndex: number = 0
): Promise<Result<string>> => {
  console.log("🚀 Starting story generation");
  console.log("📝 User preferences:", buildUserContext(preferences));

  let outline: StoryOutline;
  
  // Use existing outline if provided, otherwise generate new one
  if (existingOutline) {
    console.log("📋 Using existing outline");
    outline = existingOutline;
    if (progressCallback) {
      await progressCallback("using_existing_outline", 20);
    }
  } else {
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

    if (progressCallback) {
      await progressCallback("outline_generated", 20);
    }

    const parseResult = parseOutlineResponse(outlineResult.data);
    if (!parseResult.success) {
      console.error("❌ Outline parsing failed:", parseResult.error);
      return parseResult;
    }
    console.log(`📋 Parsed ${parseResult.data.chapters.length} chapters`);
    outline = parseResult.data;

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
          const embeddingResult = await generateOutlineEmbedding(outline);
          if (embeddingResult) {
            await saveOutlineEmbedding(jobData.sequence_id, embeddingResult);
          }
        }
      } catch (error) {
        console.error('❌ Error generating outline embedding:', error);
      }
    }
  }

  const chapterResult = extractChapterByIndex(outline, chapterIndex);
  if (!chapterResult.success) {
    console.error("❌ Chapter extraction failed:", chapterResult.error);
    return chapterResult;
  }
  console.log(
    `📖 Chapter ${chapterIndex + 1}: "${chapterResult.data.name}" (${chapterResult.data.bullets.length} plot points)`
  );

  if (progressCallback) {
    await progressCallback("starting_content_generation", 30);
  }

  // Check if we're resuming from partial content
  let fullChapterContent = "";
  let startFromBulletIndex = 0;
  
  if (resumeFromPartialContent && chapterId && jobId) {
    console.log(`🔄 Checking for existing content and bullet progress to resume from...`);
    
    // Get existing chapter content
    const { data: existingChapter, error: chapterError } = await supabase
      .from("chapters")
      .select("content")
      .eq("id", chapterId)
      .single();
      
    if (chapterError) {
      console.error(`❌ Failed to fetch existing chapter content:`, chapterError);
    } else if (existingChapter?.content) {
      fullChapterContent = existingChapter.content;
    }
    
    // Get bullet progress from the job
    const { data: jobData, error: jobError } = await supabase
      .from("generation_jobs")
      .select("bullet_progress")
      .eq("id", jobId)
      .single();
      
    if (jobError) {
      console.error(`❌ Failed to fetch job bullet progress:`, jobError);
    } else if (jobData?.bullet_progress !== undefined && jobData.bullet_progress !== null) {
      // Resume from the next bullet after the last completed one
      startFromBulletIndex = Math.min(jobData.bullet_progress + 1, chapterResult.data.bullets.length - 1);
      console.log(`📄 Found existing content (${fullChapterContent.length} chars) and bullet progress (${jobData.bullet_progress}), resuming from bullet ${startFromBulletIndex + 1}`);
    } else if (fullChapterContent.length > 0) {
      // Fallback to content-based estimation if no bullet progress is saved
      const averageBulletLength = 500;
      const estimatedBulletsCompleted = Math.floor(fullChapterContent.length / averageBulletLength);
      startFromBulletIndex = Math.min(estimatedBulletsCompleted, chapterResult.data.bullets.length - 1);
      console.log(`📄 Found existing content (${fullChapterContent.length} chars), estimating resume from bullet ${startFromBulletIndex + 1}`);
    }
    
    // Skip if we're already at or past the end
    if (startFromBulletIndex >= chapterResult.data.bullets.length) {
      console.log(`✅ Chapter already complete (${chapterResult.data.bullets.length} bullets), returning existing content`);
      return {
        success: true,
        data: fullChapterContent,
      };
    }
  }

  // Generate content for remaining bullets sequentially
  console.log("\n✍️ Generating chapter content...");
  let previousBulletContent = "";
  let allPreviousContent = fullChapterContent;

  const temperature = TEMPERATURE_BY_SPICE[preferences.spiceLevel];

  for (let i = startFromBulletIndex; i < chapterResult.data.bullets.length; i++) {
    const bullet = chapterResult.data.bullets[i];
    const nextBullet =
      i < chapterResult.data.bullets.length - 1
        ? chapterResult.data.bullets[i + 1]
        : undefined;

    const bulletPrompt = buildBulletPrompt(
      bullet,
      chapterResult.data,
      previousBulletContent,
      nextBullet,
      allPreviousContent,
      preferences
    );
    console.log(
      `\n🔄 Generating bullet ${i + 1}/${chapterResult.data.bullets.length}: "${
        bullet.text
      }"`
    );

    const spiceLevel = SPICE_LEVELS[preferences.spiceLevel];
    const systemPrompt = buildFictionSystemPrompt(spiceLevel);
    const bulletResult = await callAI(bulletPrompt, temperature, systemPrompt);
    if (!bulletResult.success) {
      console.error(
        `❌ Bullet ${i + 1} generation failed:`,
        bulletResult.error
      );
      return bulletResult;
    }

    const bulletContent = bulletResult.data;
    
    // Only add separator if we have existing content and this isn't the first new bullet
    const needsSeparator = fullChapterContent.length > 0 && (i > startFromBulletIndex || startFromBulletIndex > 0);
    fullChapterContent += (needsSeparator ? "\n\n" : "") + bulletContent;
    previousBulletContent = bulletContent;
    allPreviousContent = fullChapterContent;

    console.log(
      `✅ Bullet ${i + 1} generated (${bulletContent.length} characters)`
    );

    // Update chapter content in database if chapterId provided
    if (chapterId) {
      console.log(`🔄 Updating chapter ${chapterId} with content so far...`);
      const { error: updateError } = await supabase
        .from("chapters")
        .update({
          title: chapterResult.data.name,
          content: fullChapterContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", chapterId);

      if (updateError) {
        console.error(`❌ Failed to update chapter ${chapterId} content:`, updateError);
      } else {
        console.log(`✅ Chapter ${chapterId} content updated (${fullChapterContent.length} total characters)`);
      }
    }

    // Update bullet progress in job if jobId provided
    if (jobId) {
      console.log(`🔄 Updating job ${jobId} bullet progress to ${i}...`);
      const { error: progressError } = await supabase
        .from("generation_jobs")
        .update({
          bullet_progress: i,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      if (progressError) {
        console.error(`❌ Failed to update job ${jobId} bullet progress:`, progressError);
      } else {
        console.log(`✅ Job ${jobId} bullet progress updated to ${i}`);
      }
    }

    // Update progress based on bullet completion
    if (progressCallback) {
      const progressPerBullet = 60 / chapterResult.data.bullets.length; // 60% for content generation
      const currentProgress = 30 + ((i + 1) * progressPerBullet); // Start from 30% after outline
      await progressCallback(`bullet_${i + 1}_completed`, Math.round(currentProgress));
    }
  }

  console.log(
    `✅ Complete chapter generated successfully (${fullChapterContent.length} total characters)`
  );

  return {
    success: true,
    data: fullChapterContent,
  };
};

// Generate any chapter by index
export const generateChapterByIndex = async (
  preferences: UserPreferences,
  outline: StoryOutline,
  chapterIndex: number
): Promise<Result<string>> => {
  if (chapterIndex < 0 || chapterIndex >= outline.chapters.length) {
    return { success: false, error: "Invalid chapter index" };
  }

  const chapter = outline.chapters[chapterIndex];
  console.log(
    `📖 Generating chapter ${chapterIndex + 1}: "${chapter.name}" (${
      chapter.bullets.length
    } plot points)`
  );

  let fullChapterContent = "";
  let previousBulletContent = "";
  let allPreviousContent = "";

  for (let i = 0; i < chapter.bullets.length; i++) {
    const bullet = chapter.bullets[i];
    const nextBullet =
      i < chapter.bullets.length - 1 ? chapter.bullets[i + 1] : undefined;

    const bulletPrompt = buildBulletPrompt(
      bullet,
      chapter,
      previousBulletContent,
      nextBullet,
      allPreviousContent,
      preferences
    );

    console.log(
      `\n🔄 Generating bullet ${i + 1}/${chapter.bullets.length}: "${
        bullet.text
      }"`
    );

    const temperature = TEMPERATURE_BY_SPICE[preferences.spiceLevel];
    const spiceLevel = SPICE_LEVELS[preferences.spiceLevel];
    const systemPrompt = buildFictionSystemPrompt(spiceLevel);
    const bulletResult = await callAI(bulletPrompt, temperature, systemPrompt);
    if (!bulletResult.success) {
      console.error(
        `❌ Bullet ${i + 1} generation failed:`,
        bulletResult.error
      );
      return bulletResult;
    }

    const bulletContent = bulletResult.data;
    fullChapterContent += (i > 0 ? "\n\n" : "") + bulletContent;
    previousBulletContent = bulletContent;
    allPreviousContent = fullChapterContent;

    console.log(
      `✅ Bullet ${i + 1} generated (${bulletContent.length} characters)`
    );
  }

  console.log(
    `✅ Chapter ${chapterIndex + 1} generated successfully (${
      fullChapterContent.length
    } total characters)`
  );

  return {
    success: true,
    data: fullChapterContent,
  };
};

// Main generation pipeline (updated to generate complete chapter)
export const generateFirstChapter = async (
  preferences: UserPreferences
): Promise<Result<string>> => {
  return generateCompleteFirstChapter(preferences);
};