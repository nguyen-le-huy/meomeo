import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

function optionalBoolean(value) {
  if (value === undefined || value === "") return undefined;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return value;
}

const transcriptInputSchema = z.object({
  startTime: z.coerce.number().min(0),
  endTime: z.coerce.number().min(0),
  text: z.string().trim().min(1),
});

const topicIdSchema = z.union([z.string().regex(objectIdRegex, "Invalid topic id"), z.null()]);

const videoBodySchema = z
  .object({
    topicId: topicIdSchema.optional(),
    youtubeUrl: z.string().trim().min(1),
    title: z.string().trim().optional(),
    description: z.string().optional(),
    level: z.enum(["A1", "A2", "B1", "B2", "C1"]).optional(),
    isPublished: z.preprocess(optionalBoolean, z.boolean().optional()),
    transcripts: z.array(transcriptInputSchema).optional(),
  })
  .strict();

export const videoIdParamSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex, "Invalid video id") }),
});

export const videoQuerySchema = z.object({
  query: z.object({
    topicId: z.string().regex(objectIdRegex, "Invalid topic id").optional(),
    level: z.enum(["A1", "A2", "B1", "B2", "C1"]).optional(),
    search: z.string().optional(),
    includeUnpublished: z.preprocess(optionalBoolean, z.boolean().optional()),
  }),
});

export const createVideoSchema = z.object({ body: videoBodySchema });

export const updateVideoSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex, "Invalid video id") }),
  body: videoBodySchema
    .omit({ transcripts: true })
    .partial()
    .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" }),
});

export const publishVideoSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex, "Invalid video id") }),
  body: z.object({
    isPublished: z.preprocess(optionalBoolean, z.boolean()),
  }),
});
