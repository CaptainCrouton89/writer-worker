// Utility functions for working with story outlines

import {
  Chapter,
  PlotPoint,
  Result,
  StoryOutline,
} from "../types/generation.js";

// Utility function to convert outline to text for embedding
export const outlineToText = (outline: StoryOutline): string => {
  return (
    outline.title +
    "\n" +
    outline.description +
    "\n" +
    outline.tags.join(", ") +
    "\n" +
    outline.trigger_warnings.join(", ") +
    "\n" +
    outline.is_sexually_explicit +
    "\n" +
    "Spice Level: " +
    ["Tease", "Steam", "Spicy"][outline.spiceLevel] +
    "\n" +
    ["Short Story", "Novella", "Novel/Slow Burn"][outline.storyLength]
  );
};

export const parseOutlineResponse = (response: string): Chapter[] => {
  console.log("📋 Parsing outline response");
  try {
    const lines = response
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const chapters: Chapter[] = [];
    let currentChapter: { name: string; plotPoints: PlotPoint[] } | null = null;

    for (const line of lines) {
      const chapterMatch = line.match(/^Chapter\s+\d+:\s*(.+)$/i);

      if (chapterMatch) {
        if (currentChapter) {
          chapters.push({
            name: currentChapter.name,
            plotPoints: currentChapter.plotPoints,
          });
        }

        currentChapter = {
          name: chapterMatch[1].trim(),
          plotPoints: [],
        };
      } else if (line.startsWith("-") && currentChapter) {
        const bulletText = line.replace(/^-\s*/, "").trim();
        if (bulletText) {
          currentChapter.plotPoints.push({
            text: bulletText,
          });
        }
      } else if (line.match(/^[•*]\s+/) && currentChapter) {
        const bulletText = line.replace(/^[•*]\s*/, "").trim();
        if (bulletText) {
          currentChapter.plotPoints.push({
            text: bulletText,
          });
        }
      }
    }

    if (currentChapter) {
      chapters.push({
        name: currentChapter.name,
        plotPoints: currentChapter.plotPoints,
      });
    }

    if (chapters.length === 0) {
      console.error("❌ No chapters found in outline response. Response preview:", response.slice(0, 200));
      throw new Error("No chapters found in response");
    }

    console.log(`✅ Parsed ${chapters.length} chapters from outline`);
    return chapters;
  } catch (error) {
    console.error("❌ Failed to parse outline response:", error, "Response preview:", response.slice(0, 200));
    throw new Error(`Failed to parse outline: ${error}`);
  }
};

export const extractChapterByIndex = (
  outline: StoryOutline,
  chapterIndex: number
): Result<Chapter> => {
  if (outline.chapters.length === 0) {
    return { success: false, error: "No chapters available" };
  }

  if (chapterIndex < 0 || chapterIndex >= outline.chapters.length) {
    return {
      success: false,
      error: `Chapter index ${chapterIndex} is out of bounds. Available chapters: ${outline.chapters.length}`,
    };
  }

  return { success: true, data: outline.chapters[chapterIndex] };
};
