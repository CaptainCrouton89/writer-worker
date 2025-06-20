import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { Database } from "./supabase/types";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);

// Get the last 500 words from the previous chapter in a sequence
export const getPreviousChapterContext = async (
  sequenceId: string, 
  currentChapterIndex: number
): Promise<string | null> => {
  if (currentChapterIndex <= 0) {
    return null; // No previous chapter for first chapter
  }

  const previousChapterIndex = currentChapterIndex - 1;
  
  // First get the chapter_id for the previous chapter
  const { data: chapterMapData, error: mapError } = await supabase
    .from('chapter_sequence_map')
    .select('chapter_id')
    .eq('sequence_id', sequenceId)
    .eq('chapter_index', previousChapterIndex)
    .single();

  if (mapError || !chapterMapData?.chapter_id) {
    console.warn(`Could not find previous chapter mapping for sequence ${sequenceId}, chapter index ${previousChapterIndex}:`, mapError);
    return null;
  }

  // Then get the chapter content
  const { data: chapterData, error: chapterError } = await supabase
    .from('chapters')
    .select('content')
    .eq('id', chapterMapData.chapter_id)
    .single();

  if (chapterError || !chapterData?.content) {
    console.warn(`Could not retrieve previous chapter content for chapter ${chapterMapData.chapter_id}:`, chapterError);
    return null;
  }

  const fullContent = chapterData.content;
  const words = fullContent.split(/\s+/);
  
  // Get last 500 words
  if (words.length <= 500) {
    return fullContent;
  }
  
  return words.slice(-500).join(' ');
};
