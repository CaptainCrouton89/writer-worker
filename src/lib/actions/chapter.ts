import { supabase } from "../supabase";
import { Tables } from "../supabase/types";

export async function fetchChapter(
  chapterId: string
): Promise<Tables<"chapters">> {
  console.log(`📖 Fetching chapter ${chapterId}`);

  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("id", chapterId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch chapter ${chapterId}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Chapter ${chapterId} not found`);
  }

  return data;
}

export async function getChapterIndex(chapterId: string): Promise<number> {
  console.log(`📊 Getting chapter index for ${chapterId}`);

  const { data, error } = await supabase
    .from("chapter_sequence_map")
    .select("chapter_index")
    .eq("chapter_id", chapterId)
    .single();

  if (error) {
    throw new Error(
      `Failed to get chapter index for ${chapterId}: ${error.message}`
    );
  }

  if (!data) {
    throw new Error(`Chapter sequence mapping not found for ${chapterId}`);
  }

  return data.chapter_index;
}

export async function getChapterContent(
  chapterParentId: string
): Promise<string> {
  const { data, error } = await supabase
    .from("chapters")
    .select("content")
    .eq("parent_id", chapterParentId)
    .single();

  if (error) {
    throw new Error(
      `Failed to get previous chapter content for ${chapterParentId}: ${error.message}`
    );
  }

  return data?.content || "";
}
