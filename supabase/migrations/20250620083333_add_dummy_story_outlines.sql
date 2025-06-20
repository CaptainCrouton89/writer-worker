-- Update existing generation jobs with dummy story outlines
UPDATE generation_jobs 
SET story_outline = '{
  "chapters": [
    {
      "name": "Chapter 1: The Beginning",
      "bullets": [
        {"text": "Introduction of main characters", "index": 0},
        {"text": "Setting the scene and mood", "index": 1},
        {"text": "Initial romantic tension", "index": 2}
      ]
    },
    {
      "name": "Chapter 2: Development",
      "bullets": [
        {"text": "Characters get to know each other", "index": 0},
        {"text": "Emotional connection deepens", "index": 1},
        {"text": "First intimate moment", "index": 2}
      ]
    },
    {
      "name": "Chapter 3: Climax",
      "bullets": [
        {"text": "Passion reaches its peak", "index": 0},
        {"text": "Emotional breakthrough", "index": 1},
        {"text": "Character transformation", "index": 2}
      ]
    },
    {
      "name": "Chapter 4: Resolution",
      "bullets": [
        {"text": "Aftermath and reflection", "index": 0},
        {"text": "New understanding between characters", "index": 1},
        {"text": "Looking toward the future", "index": 2}
      ]
    },
    {
      "name": "Chapter 5: Conclusion",
      "bullets": [
        {"text": "Final romantic scene", "index": 0},
        {"text": "Character growth conclusion", "index": 1},
        {"text": "Satisfying ending", "index": 2}
      ]
    }
  ]
}'::jsonb
WHERE story_outline IS NULL;