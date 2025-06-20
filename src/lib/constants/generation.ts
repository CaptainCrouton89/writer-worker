// Constants for story generation

export const SPICE_LEVELS = ["Tease", "Steamy", "Spicy hot"] as const;
export const SPICE_DESCRIPTOR = {
  Tease: "a bit steamy",
  Steamy: "explicit",
  "Spicy hot": "explicit and hardcore",
} as const;
export const STORY_LENGTHS = ["Short story", "Novella", "Slow burn"] as const;
export const STORY_LENGTH_PAGES = [20, 50, 100] as const;

// Story length configurations
export const STORY_LENGTH_CONFIG = {
  0: {
    // Short story
    chapterCount: 5,
    bulletsPerChapter: 3,
    pagesPerBullet: 1.5,
    wordTarget: "400-500 words",
  },
  1: {
    // Novella
    chapterCount: 10,
    bulletsPerChapter: 4,
    pagesPerBullet: 1.75,
    wordTarget: "500-600 words",
  },
  2: {
    // Slow burn
    chapterCount: 20,
    bulletsPerChapter: 5,
    pagesPerBullet: 2,
    wordTarget: "500-700 words",
  },
} as const;

// Temperature settings based on spice level for more creative output at higher levels
export const TEMPERATURE_BY_SPICE = [0.7, 0.8, 0.85] as const;
