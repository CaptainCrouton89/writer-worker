// Utility functions for working with embeddings

import { supabase } from "../supabase.js";
import { generateEmbedding } from "../embedding.js";
import { StoryOutline } from "../types/generation.js";
import { outlineToText } from "./outline.js";

// Generate embedding for a story outline
export const generateOutlineEmbedding = async (outline: StoryOutline): Promise<string | null> => {
  try {
    const outlineText = outlineToText(outline);
    console.log('📊 Generating embedding for outline...');
    const embedding = await generateEmbedding(outlineText);
    console.log('✅ Outline embedding generated successfully');
    return JSON.stringify(embedding);
  } catch (error) {
    console.error('❌ Failed to generate outline embedding:', error);
    return null;
  }
};

// Save outline embedding to sequence
export const saveOutlineEmbedding = async (sequenceId: string, embedding: string): Promise<void> => {
  try {
    console.log(`📊 Saving outline embedding to sequence ${sequenceId}...`);
    const { error } = await supabase
      .from('sequences')
      .update({
        embedding,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sequenceId);

    if (error) {
      console.error('❌ Failed to save outline embedding:', error);
    } else {
      console.log('✅ Outline embedding saved successfully');
    }
  } catch (error) {
    console.error('❌ Error saving outline embedding:', error);
  }
};