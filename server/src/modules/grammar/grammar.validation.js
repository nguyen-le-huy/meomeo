import { z } from "zod";

export const grammarLessonIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
