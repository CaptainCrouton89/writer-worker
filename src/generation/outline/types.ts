import { z } from "zod";

export const StoryOutlineSchema = z.object({
  chapters: z.array(
    z.object({
      name: z.string(),
      plotPoints: z.array(z.string()),
    })
  ),
});
