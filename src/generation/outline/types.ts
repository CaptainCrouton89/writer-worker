import { z } from "zod";
import { Chapter } from "../../lib/types";

export const StoryOutlineSchema = z.object({
  chapters: z.array(
    z.object({
      name: z.string(),
      plotPoints: z.array(z.string()),
    })
  ),
});

export const parseOutlineText = (text: string): Chapter[] => {
  // Strip markdown formatting first
  const unformattedText = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '');
  
  // Remove preamble text like "Of course! Here is the list:" or "Of course! Here it is:"
  const cleanText = unformattedText.replace(/^.*?(?=Chapter \d+:)/s, '').trim();
  
  // Split by chapter headers
  const chapterSections = cleanText.split(/(?=Chapter \d+:)/);
  
  const chapters: Chapter[] = [];
  
  for (const section of chapterSections) {
    if (!section.trim()) continue;
    
    // Extract chapter title
    const titleMatch = section.match(/Chapter \d+:\s*(.+?)(?:\n|$)/);
    if (!titleMatch) continue;
    
    const name = titleMatch[1].trim();
    
    // Extract plot points (lines starting with -)
    const plotPointMatches = section.match(/^-\s*(.+)$/gm);
    const plotPoints = plotPointMatches ? plotPointMatches.map(match => match.replace(/^-\s*/, '').trim()) : [];
    
    chapters.push({ name, plotPoints });
  }
  
  return chapters;
};
