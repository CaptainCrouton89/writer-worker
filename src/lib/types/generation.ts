// Types and interfaces for story generation

export interface UserPreferences {
  readonly selectedSettings: readonly string[];
  readonly selectedPlots: readonly string[];
  readonly selectedThemes: readonly string[];
  readonly customSetting?: string;
  readonly customPlot?: string;
  readonly customThemes?: string;
  readonly spiceLevel: number; // 0=Tease, 1=Steamy, 2=Spicy hot
  readonly storyLength: number; // 0=Short story, 1=Novella, 2=Slow burn
}

export interface ChapterBullet {
  readonly text: string;
  readonly index: number;
}

export interface Chapter {
  readonly name: string;
  readonly bullets: readonly ChapterBullet[];
}

export interface StoryOutline {
  readonly chapters: readonly Chapter[];
  readonly title?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly trigger_warnings?: readonly string[];
  readonly is_sexually_explicit?: boolean;
}

export type Result<T, E = string> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };
