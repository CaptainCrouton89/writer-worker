import { CHAPTER_GENERATION_STATUS } from "../../lib/constants/status.js";
import { supabase } from "../../lib/supabase.js";
import { Chapter, GenerationJob, UserPrompt } from "../../lib/types.js";
import { generatePlotPoint } from "./plotPoint.js";

interface StoryOutline {}

export const generateChapter = async (
  job: GenerationJob,
  chapterIndex: number,
  userPrompt: UserPrompt,
  chapters: Chapter[],
  previousChapterContent: string
): Promise<string> => {
  const chapter = chapters[chapterIndex];

  if (!chapter) {
    throw new Error(`Chapter ${chapterIndex + 1} not found in outline`);
  }

  let chapterContent = "";

  if (!chapter.plotPoints) {
    throw new Error(`Chapter ${chapterIndex + 1} has no plot points`);
  }

  const totalPlotPoints = chapter.plotPoints.length;

  // Iterate through each plot point in the chapter
  for (
    let plotPointIndex = 0;
    plotPointIndex < totalPlotPoints;
    plotPointIndex++
  ) {
    console.log(
      `📝 Generating plot point ${
        plotPointIndex + 1
      }/${totalPlotPoints} for chapter ${chapterIndex + 1}`
    );

    // Generate content for this plot point
    const plotPointContent = await generatePlotPoint(
      userPrompt,
      chapters,
      chapterIndex,
      plotPointIndex,
      previousChapterContent,
      chapterContent
    );

    // Append the generated content
    chapterContent += "\n\n" + plotPointContent;

    // Update plot point progress in the database
    const plotPointProgress = ((plotPointIndex + 1) / totalPlotPoints) * 100;
    await supabase
      .from("generation_jobs")
      .update({
        progress: 40 + 0.6 * plotPointProgress,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    // Update chapter content in database incrementally
    try {
      console.log(
        `💾 Updating chapter ${job.chapter_id} with ${
          chapterContent.length
        } characters, progress: ${plotPointProgress}%, status: ${
          plotPointProgress === 100
            ? CHAPTER_GENERATION_STATUS.COMPLETED
            : CHAPTER_GENERATION_STATUS.GENERATING
        }`
      );

      const { data, error, count } = await supabase
        .from("chapters")
        .update({
          content: chapterContent,
          generation_progress: plotPointProgress,
          generation_status:
            plotPointProgress === 100
              ? CHAPTER_GENERATION_STATUS.COMPLETED
              : CHAPTER_GENERATION_STATUS.GENERATING,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.chapter_id)
        .select();

      if (error) {
        console.error(
          `❌ Database error updating chapter ${job.chapter_id}:`,
          error
        );
        throw new Error(`Failed to update chapter content: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.error(
          `❌ No rows updated for chapter ${job.chapter_id}! Chapter may not exist or conditions not met.`
        );
        throw new Error(
          `Chapter update failed: no rows updated for chapter ${job.chapter_id}`
        );
      }

      console.log(
        `✅ Successfully updated chapter ${job.chapter_id}, ${data.length} row(s) affected`
      );
    } catch (updateError) {
      console.error(
        `❌ Critical error updating chapter ${job.chapter_id}:`,
        updateError
      );
      throw updateError;
    }

    console.log(
      `✅ Completed plot point ${
        plotPointIndex + 1
      }/${totalPlotPoints} (${plotPointProgress.toFixed(1)}%)`
    );
  }

  return chapterContent;
};
