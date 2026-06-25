import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const videoIdParamSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex, "Invalid video id") }),
});

export const generateVietsubSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex, "Invalid video id") }),
  body: z.object({
    force: z.boolean().optional().default(false),
    targetLanguage: z.string().optional(),
  }),
});
