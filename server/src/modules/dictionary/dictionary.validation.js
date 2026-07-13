import { z } from "zod";

export const lookupDictionarySchema = z.object({
  body: z
    .object({
      query: z.string().trim().min(1).max(1200),
      context: z.string().trim().max(2000).optional(),
    })
    .strict(),
});
