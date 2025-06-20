import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { supabase } from "./supabase.js";

// Types
export interface UserPreferences {
  readonly selectedSettings: readonly string[];
  readonly selectedPlots: readonly string[];
  readonly selectedThemes: readonly string[];
  readonly customSetting?: string;
  readonly customPlot?: string;
  readonly customThemes?: string;
  readonly spiceLevel: number; // 0=Tease, 1=Steamy, 2=Spicy hot
  readonly storyLength: number; // 0=Short story, 1=Novella, 2=Slow burn
}

export interface ChapterBullet {
  readonly text: string;
  readonly index: number;
}

export interface Chapter {
  readonly name: string;
  readonly bullets: readonly ChapterBullet[];
}

export interface StoryOutline {
  readonly chapters: readonly Chapter[];
}

export type Result<T, E = string> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

// Constants
const SPICE_LEVELS = ["Tease", "Steamy", "Spicy hot"] as const;
const STORY_LENGTHS = ["Short story", "Novella", "Slow burn"] as const;
const STORY_LENGTH_PAGES = [20, 50, 100] as const;

// Story length configurations
const STORY_LENGTH_CONFIG = {
  0: {
    // Short story
    chapterCount: 5,
    bulletsPerChapter: 3,
    pagesPerBullet: 1.5,
    wordTarget: "400-500 words",
  },
  1: {
    // Novella
    chapterCount: 10,
    bulletsPerChapter: 4,
    pagesPerBullet: 1.75,
    wordTarget: "500-600 words",
  },
  2: {
    // Slow burn
    chapterCount: 20,
    bulletsPerChapter: 5,
    pagesPerBullet: 2,
    wordTarget: "500-700 words",
  },
} as const;

// Temperature settings based on spice level for more creative output at higher levels
const TEMPERATURE_BY_SPICE = [0.6, 0.7, 0.8] as const;

// Pure transformation functions
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

export const parseOutlineResponse = (
  response: string
): Result<StoryOutline> => {
  try {
    const lines = response
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const chapters: Chapter[] = [];
    let currentChapter: { name: string; bullets: ChapterBullet[] } | null =
      null;

    for (const line of lines) {
      const chapterMatch = line.match(/^Chapter\s+\d+:\s*(.+)$/i);

      if (chapterMatch) {
        if (currentChapter) {
          chapters.push({
            name: currentChapter.name,
            bullets: currentChapter.bullets,
          });
        }

        currentChapter = {
          name: chapterMatch[1].trim(),
          bullets: [],
        };
      } else if (line.startsWith("-") && currentChapter) {
        const bulletText = line.replace(/^-\s*/, "").trim();
        if (bulletText) {
          currentChapter.bullets.push({
            text: bulletText,
            index: currentChapter.bullets.length,
          });
        }
      } else if (line.match(/^[•*]\s+/) && currentChapter) {
        const bulletText = line.replace(/^[•*]\s*/, "").trim();
        if (bulletText) {
          currentChapter.bullets.push({
            text: bulletText,
            index: currentChapter.bullets.length,
          });
        }
      }
    }

    if (currentChapter) {
      chapters.push({
        name: currentChapter.name,
        bullets: currentChapter.bullets,
      });
    }

    if (chapters.length === 0) {
      return { success: false, error: "No chapters found in response" };
    }

    return {
      success: true,
      data: { chapters: chapters as readonly Chapter[] },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse outline: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};

export const extractChapterByIndex = (outline: StoryOutline, chapterIndex: number): Result<Chapter> => {
  if (outline.chapters.length === 0) {
    return { success: false, error: "No chapters available" };
  }

  if (chapterIndex < 0 || chapterIndex >= outline.chapters.length) {
    return { success: false, error: `Chapter index ${chapterIndex} is out of bounds. Available chapters: ${outline.chapters.length}` };
  }

  return { success: true, data: outline.chapters[chapterIndex] };
};

// Keep backward compatibility
export const extractFirstChapter = (outline: StoryOutline): Result<Chapter> => {
  return extractChapterByIndex(outline, 0);
};

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

// AI interaction function
const callAI = async (
  prompt: string,
  temperature: number = 0.7
): Promise<Result<string>> => {
  try {
    const { text } = await generateText({
      model: google("gemini-2.5-pro"),
      prompt,
      temperature,
    });

    return { success: true, data: text };
  } catch (error) {
    return {
      success: false,
      error: `AI generation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};

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
    console.log("\n🔮 Requesting story outline from AI...");

    const temperature = TEMPERATURE_BY_SPICE[preferences.spiceLevel];
    const outlineResult = await callAI(outlinePrompt, temperature);
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

    const bulletResult = await callAI(bulletPrompt, temperature);
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

// Generate story outline only
export const generateStoryOutline = async (
  preferences: UserPreferences
): Promise<Result<StoryOutline>> => {
  console.log("🚀 Starting outline generation");
  console.log("📝 User preferences:", buildUserContext(preferences));

  const outlinePrompt = buildOutlinePrompt(preferences);
  console.log("\n🔮 Requesting story outline from AI...");

  const temperature = TEMPERATURE_BY_SPICE[preferences.spiceLevel];
  const outlineResult = await callAI(outlinePrompt, temperature);
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

  return parseResult;
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
    const bulletResult = await callAI(bulletPrompt, temperature);
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

// Generate content for a specific bullet point
export const generateBulletContent = async (
  bullet: ChapterBullet,
  chapter: Chapter,
  previousContent?: string,
  allPreviousContent?: string,
  preferences?: UserPreferences
): Promise<Result<string>> => {
  const nextBullet =
    bullet.index < chapter.bullets.length - 1
      ? chapter.bullets[bullet.index + 1]
      : undefined;
  const bulletPrompt = buildBulletPrompt(
    bullet,
    chapter,
    previousContent,
    nextBullet,
    allPreviousContent,
    preferences
  );

  console.log(
    `\n✍️ Generating content for bullet ${bullet.index + 1}: "${
      bullet.text
    }"...`
  );

  const temperature = preferences
    ? TEMPERATURE_BY_SPICE[preferences.spiceLevel]
    : 0.7;
  const result = await callAI(bulletPrompt, temperature);
  if (result.success) {
    console.log(
      `✅ Bullet ${bullet.index + 1} generated successfully (${
        result.data.length
      } characters)`
    );
  } else {
    console.error(
      `❌ Bullet ${bullet.index + 1} generation failed:`,
      result.error
    );
  }

  return result;
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

// Regenerate outline with user prompt, preserving completed chapters
export const regenerateOutlineWithUserPrompt = async (
  existingOutline: StoryOutline,
  userPrompt: string,
  preferences: UserPreferences,
  currentChapterIndex: number
): Promise<Result<StoryOutline>> => {
  console.log(`🔄 Regenerating outline with user prompt for chapters ${currentChapterIndex + 1} onwards`);
  console.log(`📝 User prompt: ${userPrompt}`);

  const config = STORY_LENGTH_CONFIG[preferences.storyLength as keyof typeof STORY_LENGTH_CONFIG];
  const spiceLevel = SPICE_LEVELS[preferences.spiceLevel];
  const pageCount = STORY_LENGTH_PAGES[preferences.storyLength];

  // Build context from completed chapters
  const completedChapters = existingOutline.chapters.slice(0, currentChapterIndex + 1);
  const completedContext = completedChapters
    .map((ch, i) => `Chapter ${i + 1}: ${ch.name}\n${ch.bullets.map(b => `- ${b.text}`).join('\n')}`)
    .join('\n\n');

  // Calculate remaining chapters
  const remainingChapterCount = config.chapterCount - (currentChapterIndex + 1);
  
  if (remainingChapterCount <= 0) {
    console.log('✅ No remaining chapters to regenerate');
    return { success: true, data: existingOutline };
  }

  // Build settings context
  const settings = preferences.customSetting || preferences.selectedSettings.join(", ") || "a contemporary setting";
  const plots = preferences.customPlot || preferences.selectedPlots.join(", ") || "forbidden attraction";
  const themes = preferences.customThemes || preferences.selectedThemes.join(", ") || "passion and desire";

  const smutDescriptors = {
    Tease: "sensual tension and suggestive scenes",
    Steamy: "passionate encounters with moderate explicit content",
    "Spicy hot": "highly explicit sexual content with detailed physical descriptions",
  };

  const smutRequirements = {
    Tease: "subtle physical attraction, lingering touches, and building sexual tension",
    Steamy: "passionate kissing, intimate touching, and moderately explicit sexual scenes",
    "Spicy hot": "explicit physical descriptions of sex and the characters' body parts during sex",
  };

  const regeneratePrompt = `You are updating a story outline based on new user direction. The story is a ${pageCount} page smut story about ${plots} set in ${settings}, exploring themes of ${themes}.

<completed_chapters>
${completedContext}
</completed_chapters>

<user_direction>
${userPrompt}
</user_direction>

Generate ${remainingChapterCount} new chapter names and plot points that continue from where the completed chapters left off, incorporating the user's new direction. For each chapter list ${config.bulletsPerChapter} bulleted plot points. The bullet points should include ${smutDescriptors[spiceLevel]} and require that those scenes focus on ${smutRequirements[spiceLevel]}.

<requirements>
- Create exactly ${remainingChapterCount} chapters (continuing from Chapter ${currentChapterIndex + 1})
- Each chapter must have exactly ${config.bulletsPerChapter} bullet points
- Include ${smutDescriptors[spiceLevel]}
- Focus on ${smutRequirements[spiceLevel]}
- Be descriptive and provocative appropriate to the ${spiceLevel} level
- Bullet points should be longer and more detailed than typical plot points
- Each bullet point should be 2-3 sentences that clearly describe a scene, emotional beats, and specific actions
- Make bullet points substantial enough to generate ${config.pagesPerBullet} pages of content each
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
  const outlineResult = await callAI(regeneratePrompt, temperature);
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

  console.log(`📋 Combined ${completedChapters.length} existing + ${newChapters.length} new = ${combinedChapters.length} total chapters`);

  return {
    success: true,
    data: { chapters: combinedChapters as readonly Chapter[] }
  };
};
