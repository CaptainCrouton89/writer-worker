// Story length configurations
export const STORY_LENGTH_CONFIG = [
  {
    type: "short story",
    // Short story
    chapterCount: 5,
    bulletsPerChapter: 3,
    pagesPerBullet: 1,
    wordTarget: "400-500 words",
    pageDescription: "1.5 pages of content (400-500 words)",
    customGuideline: "- This is a short story—outline it appropriately",
  },
  {
    type: "novella",
    // Novella
    chapterCount: 10,
    bulletsPerChapter: 4,
    pagesPerBullet: 1.25,
    wordTarget: "500-600 words",
    pageDescription: "2 pages of content (500-600 words)",
    customGuideline: "- This is a novella—outline it appropriately. Do not skip exposition, conflict, or resolution.",
  },
  {
    type: "slow burn/novel",
    // Slow burn
    chapterCount: 20,
    bulletsPerChapter: 5,
    pagesPerBullet: 1.5,
    wordTarget: "500-700 words",
    pageDescription: "2.5 pages of content (500-700 words)",
    customGuideline: "- Outline this like a proper, feature-length novel. Do not skip exposition, conflict, or resolution.",
  },
];
