// Utility functions for working with story outlines

import { StoryOutline, Chapter, ChapterBullet, Result } from "../types/generation.js";

// Utility function to convert outline to text for embedding
export const outlineToText = (outline: StoryOutline): string => {
  return outline.chapters
    .map((chapter, index) => {
      const chapterText = `Chapter ${index + 1}: ${chapter.name}`;
      const bulletsText = chapter.bullets
        .map((bullet, bulletIndex) => `${bulletIndex + 1}. ${bullet.text}`)
        .join('\n');
      return `${chapterText}\n${bulletsText}`;
    })
    .join('\n\n');
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