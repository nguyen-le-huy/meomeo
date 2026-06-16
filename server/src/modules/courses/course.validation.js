import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const levelSchema = z.enum(["beginner", "intermediate", "advanced"]);
const sortSchema = z.enum(["order", "createdAt", "title"]);

function optionalBoolean(value) {
  if (value === undefined || value === "") return undefined;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return value;
}

const vocabularyCourseBodySchema = z
  .object({
    title: z.string().trim().min(2).max(120),
    description: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    level: levelSchema.optional(),
    order: z.coerce.number().min(0).optional(),
    isPublished: z.preprocess(optionalBoolean, z.boolean().optional()),
  })
  .strict();

export const createVocabularyCourseSchema = z.object({
  body: vocabularyCourseBodySchema,
});

export const updateVocabularyCourseSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid course id"),
  }),
  body: vocabularyCourseBodySchema.partial().refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  }),
});

export const courseIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid course id"),
  }),
});

export const courseQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    isPublished: z.preprocess(optionalBoolean, z.boolean().optional()),
    level: levelSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: sortSchema.default("order"),
  }),
});
