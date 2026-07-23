import { z } from "zod";
import { TRANSLATION_MODEL_IDS } from "./translationModels.js";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const videoIdParamSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex, "Invalid video id") }),
});

export const generateVietsubSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex, "Invalid video id") }),
  body: z.object({
    force: z.boolean().optional().default(false),
    model: z.enum(TRANSLATION_MODEL_IDS).optional(),
    targetLanguage: z.string().optional(),
  }),
});
