/**
 * Utility functions for generating and managing embeddings
 */

interface EmbeddingResponse {
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  object: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * Generate embeddings for text using OpenAI's text-embedding-ada-002 model
 * @param text - The text to generate embeddings for
 * @returns Array of 1536 dimensional embedding values
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const openAiKey = process.env.OPENAI_API_KEY;

  if (!openAiKey) {
    console.warn("OPENAI_API_KEY not found, falling back to zero vector");
    return new Array(1536).fill(0);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: text.replaceAll("\n", " ").trim(),
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status, response.statusText);
      return new Array(1536).fill(0);
    }

    const data = await response.json() as EmbeddingResponse;
    return data.data[0]?.embedding || new Array(1536).fill(0);
  } catch (error) {
    console.error("Error generating embedding:", error);
    return new Array(1536).fill(0);
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param texts - Array of texts to generate embeddings for
 * @returns Array of embedding arrays
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const openAiKey = process.env.OPENAI_API_KEY;

  if (!openAiKey) {
    console.warn("OPENAI_API_KEY not found, falling back to zero vectors");
    return texts.map(() => new Array(1536).fill(0));
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: texts.map((text) => text.replaceAll("\n", " ").trim()),
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status, response.statusText);
      return texts.map(() => new Array(1536).fill(0));
    }

    const data = await response.json() as EmbeddingResponse;
    return data.data.map((item) => item.embedding);
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return texts.map(() => new Array(1536).fill(0));
  }
}
