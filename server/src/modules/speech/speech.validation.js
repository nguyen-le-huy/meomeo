import { z } from "zod";

export const pronunciationAssessmentSchema = z.object({
  body: z.object({
    text: z.string().min(1),
  }),
});
