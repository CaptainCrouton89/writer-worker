// Types and interfaces for story generation
export interface PlotPoint {
  readonly text: string;
}

export interface Chapter {
  readonly name: string;
  readonly plotPoints: readonly PlotPoint[];
}

export interface StoryOutline {
  readonly title: string;
  readonly description: string;
  readonly user_prompt: string;
  readonly chapters: readonly Chapter[];
  readonly tags: readonly string[];
  readonly trigger_warnings: readonly string[];
  readonly is_sexually_explicit: boolean;
  readonly spiceLevel: number; // 0: Tease, 1: Steamy, 2: Spicy hot
  readonly storyLength: number; // 0: Short story, 1: Novella, 2: Novel
}

export type Result<T, E = string> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };
