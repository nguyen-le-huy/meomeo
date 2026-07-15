import { z } from "zod";

export const lookupDictionarySchema = z.object({
  body: z
    .object({
      query: z.string().trim().min(1).max(1200),
      context: z.string().trim().max(2000).optional(),
      sessionId: z.string().trim().min(1).max(120).optional(),
    })
    .strict(),
});

export const dictionaryHistoryQuerySchema = z.object({
  query: z.object({
    sessionId: z.string().trim().min(1).max(120).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const dictionaryHistoryParamsSchema = z.object({
  params: z.object({ id: z.string().trim().min(1) }),
});
