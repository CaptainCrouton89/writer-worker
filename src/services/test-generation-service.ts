import { supabase } from "../lib/supabase.js";
import { Sequence, Chapter, UserPrompt, AuthorStyle, SpiceLevel, StoryLength } from "../lib/types.js";
import { generateNewOutline } from "../generation/outline/newOutline.js";
import { generatePlotPoint } from "../generation/plot/plotPoint.js";
import { STORY_LENGTH_CONFIG } from "../lib/constants/generation.js";

export interface TestOutlineParams {
  user_prompt: string;
  story_length: StoryLength;
  user_tags: string[];
  spice_level: SpiceLevel;
  author_style: AuthorStyle;
  writingQuirk?: string;
}

export interface TestGenerationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SequenceListItem {
  id: string;
  name: string | null;
  description: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  chapterCount: number;
}

export class TestGenerationService {
  /**
   * Generate a test outline without creating any database records
   */
  async generateTestOutline(params: TestOutlineParams): Promise<TestGenerationResult<Chapter[]>> {
    try {
      console.log("🧪 Generating test outline with params:", {
        story_length: params.story_length,
        spice_level: params.spice_level,
        author_style: params.author_style,
        user_tags: params.user_tags,
        hasWritingQuirk: !!params.writingQuirk
      });

      const chapters = await generateNewOutline({
        user_prompt: params.user_prompt,
        story_length: params.story_length,
        user_tags: params.user_tags,
        spice_level: params.spice_level,
        author_style: params.author_style,
        writingQuirk: params.writingQuirk
      });

      return {
        success: true,
        data: chapters
      };
    } catch (error) {
      console.error("❌ Test outline generation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get sequences from database for selection
   */
  async getSequences(limit: number = 10): Promise<TestGenerationResult<SequenceListItem[]>> {
    try {
      console.log(`📋 Fetching ${limit} sequences for test selection`);

      const { data, error } = await supabase
        .from("sequences")
        .select("id, name, description, tags, created_at, updated_at, chapters")
        .order("updated_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch sequences: ${error.message}`);
      }

      const sequenceList: SequenceListItem[] = data.map(sequence => ({
        id: sequence.id,
        name: sequence.name,
        description: sequence.description,
        tags: sequence.tags,
        created_at: sequence.created_at,
        updated_at: sequence.updated_at,
        chapterCount: Array.isArray(sequence.chapters) ? sequence.chapters.length : 0
      }));

      return {
        success: true,
        data: sequenceList
      };
    } catch (error) {
      console.error("❌ Failed to fetch sequences:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Generate a single test plot point without saving to database
   */
  async generateTestPlotPoint(
    sequenceId: string, 
    chapterIndex: number, 
    plotPointIndex: number
  ): Promise<TestGenerationResult<string>> {
    try {
      console.log(`📝 Generating test plot point - Sequence: ${sequenceId}, Chapter: ${chapterIndex + 1}, Plot Point: ${plotPointIndex + 1}`);

      // Load sequence from database
      const sequence = await this.fetchSequence(sequenceId);
      
      // Extract necessary context
      const chapters = this.getChapters(sequence);
      const userPrompt = this.getMostRecentUserPrompt(sequence);
      
      if (!userPrompt) {
        throw new Error("No user prompt found in sequence");
      }

      // Validate chapter and plot point indices
      if (chapterIndex < 0 || chapterIndex >= chapters.length) {
        throw new Error(`Invalid chapter index: ${chapterIndex}. Sequence has ${chapters.length} chapters.`);
      }

      const chapter = chapters[chapterIndex];
      if (plotPointIndex < 0 || plotPointIndex >= chapter.plotPoints.length) {
        throw new Error(`Invalid plot point index: ${plotPointIndex}. Chapter has ${chapter.plotPoints.length} plot points.`);
      }

      // Get previous content (for context)
      const previousChapterContent = await this.getPreviousChapterContent(sequenceId, chapterIndex);
      
      // Get content from earlier plot points in the same chapter
      const chapterContentSoFar = await this.getChapterContentSoFar(sequenceId, chapterIndex, plotPointIndex);

      // Generate the plot point
      const plotPointContent = await generatePlotPoint(
        userPrompt,
        chapters,
        chapterIndex,
        plotPointIndex,
        previousChapterContent,
        chapterContentSoFar,
        undefined, // Use default model config
        sequence.writing_quirk || undefined
      );

      return {
        success: true,
        data: plotPointContent
      };
    } catch (error) {
      console.error("❌ Test plot point generation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Generate an entire test chapter without saving to database
   */
  async generateTestChapter(
    sequenceId: string,
    chapterIndex: number
  ): Promise<TestGenerationResult<string>> {
    try {
      console.log(`📖 Generating test chapter - Sequence: ${sequenceId}, Chapter: ${chapterIndex + 1}`);

      // Load sequence from database
      const sequence = await this.fetchSequence(sequenceId);
      
      // Extract necessary context
      const chapters = this.getChapters(sequence);
      const userPrompt = this.getMostRecentUserPrompt(sequence);
      
      if (!userPrompt) {
        throw new Error("No user prompt found in sequence");
      }

      // Validate chapter index
      if (chapterIndex < 0 || chapterIndex >= chapters.length) {
        throw new Error(`Invalid chapter index: ${chapterIndex}. Sequence has ${chapters.length} chapters.`);
      }

      const chapter = chapters[chapterIndex];
      const previousChapterContent = await this.getPreviousChapterContent(sequenceId, chapterIndex);
      
      let chapterContent = "";
      let chapterContentSoFar = "";

      // Generate all plot points in sequence
      for (let plotPointIndex = 0; plotPointIndex < chapter.plotPoints.length; plotPointIndex++) {
        console.log(`📝 Generating plot point ${plotPointIndex + 1}/${chapter.plotPoints.length}`);
        
        const plotPointContent = await generatePlotPoint(
          userPrompt,
          chapters,
          chapterIndex,
          plotPointIndex,
          previousChapterContent,
          chapterContentSoFar,
          undefined, // Use default model config
          sequence.writing_quirk || undefined
        );

        chapterContent += plotPointContent + "\n\n";
        chapterContentSoFar += plotPointContent + "\n\n";
      }

      return {
        success: true,
        data: chapterContent.trim()
      };
    } catch (error) {
      console.error("❌ Test chapter generation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Private helper methods
   */
  private async fetchSequence(sequenceId: string): Promise<Sequence> {
    const { data, error } = await supabase
      .from("sequences")
      .select("*")
      .eq("id", sequenceId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch sequence ${sequenceId}: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Sequence ${sequenceId} not found`);
    }

    return data as Sequence;
  }

  private getChapters(sequence: Sequence): Chapter[] {
    if (!sequence.chapters) {
      throw new Error("Sequence has no chapters");
    }
    
    return sequence.chapters;
  }

  private getMostRecentUserPrompt(sequence: Sequence): UserPrompt | null {
    if (!sequence.user_prompt_history || sequence.user_prompt_history.length === 0) {
      return null;
    }

    // Return the most recent (last) prompt
    return sequence.user_prompt_history[sequence.user_prompt_history.length - 1];
  }

  private async getChapterContentSoFar(sequenceId: string, chapterIndex: number, plotPointIndex: number): Promise<string> {
    if (plotPointIndex === 0) {
      return ""; // No previous plot points for the first one
    }

    console.log(`🔍 Generating content for plot points 1-${plotPointIndex} as context...`);
    
    // For test generation, we need to generate all previous plot points in this chapter
    // to provide proper context
    try {
      // Load sequence data
      const sequence = await this.fetchSequence(sequenceId);
      const chapters = this.getChapters(sequence);
      const userPrompt = this.getMostRecentUserPrompt(sequence);
      
      if (!userPrompt) {
        throw new Error("No user prompt found in sequence");
      }

      // Get previous chapters content
      const previousChapterContent = await this.getPreviousChapterContent(sequenceId, chapterIndex);
      
      let chapterContentSoFar = "";
      
      // Generate all plot points up to (but not including) the requested one
      for (let i = 0; i < plotPointIndex; i++) {
        console.log(`  📝 Generating plot point ${i + 1} for context...`);
        
        const plotPointContent = await generatePlotPoint(
          userPrompt,
          chapters,
          chapterIndex,
          i,
          previousChapterContent,
          chapterContentSoFar,
          undefined,
          sequence.writing_quirk || undefined
        );
        
        chapterContentSoFar += plotPointContent + "\n\n";
      }
      
      console.log(`✅ Generated ${plotPointIndex} plot points as context (${chapterContentSoFar.length} characters)`);
      return chapterContentSoFar.trim();
      
    } catch (error) {
      console.error(`❌ Error generating chapter content so far:`, error);
      // Return empty string to allow generation to proceed without context
      return "";
    }
  }

  private async getPreviousChapterContent(sequenceId: string, chapterIndex: number): Promise<string> {
    if (chapterIndex === 0) {
      return ""; // No previous chapters for the first chapter
    }

    try {
      // Get all chapters for this sequence from the chapters table
      const { data: chapterMaps, error: mapError } = await supabase
        .from("chapter_sequence_map")
        .select("chapter_id, chapter_index")
        .eq("sequence_id", sequenceId)
        .lt("chapter_index", chapterIndex)
        .order("chapter_index", { ascending: true });

      if (mapError) {
        console.warn(`⚠️ Failed to fetch chapter mapping for sequence ${sequenceId}: ${mapError.message}`);
        return "";
      }

      if (!chapterMaps || chapterMaps.length === 0) {
        return "";
      }

      // Fetch content for all previous chapters
      const chapterIds = chapterMaps.map(map => map.chapter_id);
      const { data: chapters, error: chapterError } = await supabase
        .from("chapters")
        .select("id, content")
        .in("id", chapterIds);

      if (chapterError) {
        console.warn(`⚠️ Failed to fetch chapter content for sequence ${sequenceId}: ${chapterError.message}`);
        return "";
      }

      if (!chapters) {
        return "";
      }

      // Order chapters by their index and concatenate content
      const orderedChapters = chapterMaps
        .map(map => {
          const chapter = chapters.find(c => c.id === map.chapter_id);
          return chapter ? chapter.content : "";
        })
        .filter(content => content.length > 0);

      return orderedChapters.join("\n\n");
    } catch (error) {
      console.warn(`⚠️ Error fetching previous chapter content:`, error);
      return "";
    }
  }
}