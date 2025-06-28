import Replicate from "replicate";
import { supabase } from "../../lib/supabase.js";
import { Tables } from "../../lib/supabase/types.js";
import { enhancePromptWithRetry } from "./promptEnhancer.js";
import { progressivelySanitizePrompt } from "./promptSanitizer.js";

// Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

interface VideoGenerationContext {
  quote: Tables<"featured_quotes">;
  chapterContent?: string;
  storyOutline?: any;
  sequenceTitle?: string;
}

interface VideoGenerationResult {
  videoUrl: string;
  replicateId: string;
  enhancedPrompt: string;
}

/**
 * Generates a video for a featured quote using Replicate's Seedance-1-Pro model
 */
export async function generateVideo(
  context: VideoGenerationContext,
  promptOverride?: string
): Promise<VideoGenerationResult> {
  console.log(`🎬 Starting video generation for quote ${context.quote.id}`);

  // Step 1: Use provided prompt or enhance new one
  let enhancedPrompt: string;
  if (promptOverride) {
    console.log("📝 Using provided prompt override...");
    enhancedPrompt = promptOverride;
  } else {
    console.log("📝 Enhancing video prompt...");
    enhancedPrompt = await enhancePromptWithRetry({
      quoteText: context.quote.quote_text,
      chapterContent: context.chapterContent,
      storyOutline: context.storyOutline,
      sequenceTitle: context.sequenceTitle,
      contextSentence: context.quote.context_sentence || undefined,
    });
  }

  // Step 2: Prepare Replicate input
  const input = {
    fps: 24,
    prompt: enhancedPrompt,
    duration: 5,
    resolution: "480p",
    aspect_ratio: "16:9",
    camera_fixed: false,
  };

  console.log("🎥 Submitting to Replicate Seedance-1-pro...");
  console.log(`Input: ${JSON.stringify(input, null, 2)}`);

  try {
    // Step 3: Generate video using Replicate
    const output = await replicate.run("bytedance/seedance-1-pro", { input });

    console.log("🔍 Replicate output type:", typeof output);
    console.log("🔍 Replicate output:", output);

    // Step 4: Extract video URL using the official Replicate method
    let videoUrl: string;

    if (typeof output === "string") {
      videoUrl = output;
    } else if (
      output &&
      typeof output === "object" &&
      typeof (output as any).url === "function"
    ) {
      // Official Replicate format: output.url() returns the URL string
      videoUrl = (output as any).url();
      console.log("🔗 Extracted URL using output.url():", videoUrl);
    } else if (Array.isArray(output) && output.length > 0) {
      const firstItem = output[0];
      if (
        firstItem &&
        typeof firstItem === "object" &&
        typeof firstItem.url === "function"
      ) {
        videoUrl = firstItem.url();
      } else {
        videoUrl = firstItem;
      }
    } else {
      console.error("Replicate output:", JSON.stringify(output, null, 2));
      throw new Error(
        `Unexpected output format from Replicate: ${typeof output}`
      );
    }

    console.log(`✅ Video generated successfully: ${videoUrl}`);

    return {
      videoUrl,
      replicateId: "", // Replicate doesn't provide prediction ID in this format
      enhancedPrompt,
    };
  } catch (error) {
    console.error("❌ Replicate video generation failed:", error);
    throw new Error(`Video generation failed: ${error}`);
  }
}

/**
 * Uploads video from URL to Supabase storage
 */
export async function uploadVideoToStorage(
  videoUrl: string,
  fileName: string
): Promise<string> {
  console.log(`☁️ Uploading video to Supabase storage: ${fileName}`);

  try {
    // Download video from Replicate
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const videoBlob = await response.blob();
    const videoBuffer = Buffer.from(await videoBlob.arrayBuffer());

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from("videos")
      .upload(fileName, videoBuffer, {
        contentType: "video/mp4",
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("videos")
      .getPublicUrl(fileName);

    console.log(`✅ Video uploaded successfully: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("❌ Video upload failed:", error);
    throw new Error(`Video upload failed: ${error}`);
  }
}

/**
 * Updates the featured_quotes table with the video URL
 */
export async function updateQuoteWithVideoUrl(
  quoteId: string,
  videoUrl: string
): Promise<void> {
  console.log(`💾 Updating quote ${quoteId} with video URL`);

  try {
    const { error } = await supabase
      .from("featured_quotes")
      .update({
        video_url: videoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quoteId);

    if (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }

    console.log(`✅ Quote updated successfully with video URL`);
  } catch (error) {
    console.error("❌ Database update failed:", error);
    throw new Error(`Database update failed: ${error}`);
  }
}

/**
 * Complete video generation workflow
 */
export async function generateVideoForQuote(
  context: VideoGenerationContext
): Promise<string> {
  const startTime = Date.now();
  console.log(
    `🚀 Starting complete video generation for quote ${context.quote.id}`
  );

  try {
    // Step 1: Generate video
    const result = await generateVideo(context);

    // Step 2: Upload to storage
    const fileName = `quote_${context.quote.id}_${Date.now()}.mp4`;
    const storageUrl = await uploadVideoToStorage(result.videoUrl, fileName);

    // Step 3: Update database
    await updateQuoteWithVideoUrl(context.quote.id, storageUrl);

    const duration = Date.now() - startTime;
    console.log(`🎉 Video generation completed in ${duration}ms`);
    console.log(`📹 Enhanced prompt: ${result.enhancedPrompt}`);
    console.log(`🔗 Final video URL: ${storageUrl}`);

    return storageUrl;
  } catch (error) {
    console.error("❌ Complete video generation failed:", error);
    throw error;
  }
}

/**
 * Video generation with retry logic and progressive prompt sanitization
 */
export async function generateVideoWithRetry(
  context: VideoGenerationContext,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | undefined;
  let enhancedPrompt: string | undefined;
  let currentPrompt: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Video generation attempt ${attempt}/${maxRetries}`);
      
      // On first attempt, use normal generation
      if (attempt === 1) {
        return await generateVideoForQuote(context);
      } 
      
      // On subsequent attempts, sanitize the prompt progressively
      else {
        console.log(`🧹 Sanitizing prompt for attempt ${attempt}...`);
        
        // Get the original enhanced prompt if we haven't already
        if (!enhancedPrompt) {
          enhancedPrompt = await enhancePromptWithRetry({
            quoteText: context.quote.quote_text,
            chapterContent: context.chapterContent,
            storyOutline: context.storyOutline,
            sequenceTitle: context.sequenceTitle,
            contextSentence: context.quote.context_sentence || undefined,
          });
        }
        
        // Sanitize the prompt based on attempt number
        currentPrompt = await progressivelySanitizePrompt(enhancedPrompt, attempt - 1);
        
        // Try generating with sanitized prompt
        const result = await generateVideo(context, currentPrompt);
        
        // Upload to storage
        const fileName = `quote_${context.quote.id}_${Date.now()}.mp4`;
        const storageUrl = await uploadVideoToStorage(result.videoUrl, fileName);
        
        // Update database
        await updateQuoteWithVideoUrl(context.quote.id, storageUrl);
        
        console.log(`✅ Video generated successfully with sanitized prompt (attempt ${attempt})`);
        return storageUrl;
      }
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Video generation attempt ${attempt} failed:`, error);
      
      // Check if the error message indicates content policy violation
      const errorMessage = lastError.message.toLowerCase();
      const isPolicyViolation = errorMessage.includes('policy') || 
                               errorMessage.includes('explicit') || 
                               errorMessage.includes('inappropriate') ||
                               errorMessage.includes('nsfw') ||
                               errorMessage.includes('safety');
      
      if (isPolicyViolation) {
        console.log(`⚠️ Content policy violation detected. Will sanitize prompt on next attempt.`);
      }

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff (2s, 4s, 8s)
        console.log(`⏱️ Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Video generation failed after ${maxRetries} attempts: ${
      lastError?.message || "Unknown error"
    }`
  );
}
