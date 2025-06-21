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
    chapterContent += plotPointContent;

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
    await supabase
      .from("chapters")
      .update({
        content: chapterContent,
        generation_progress: plotPointProgress,
        generation_status:
          plotPointProgress === 100 ? "completed" : "in_progress",
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.chapter_id);

    console.log(
      `✅ Completed plot point ${
        plotPointIndex + 1
      }/${totalPlotPoints} (${plotPointProgress.toFixed(1)}%)`
    );
  }

  return chapterContent;
};
