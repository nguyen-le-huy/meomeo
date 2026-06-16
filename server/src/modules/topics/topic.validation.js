import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

function optionalBoolean(value) {
  if (value === undefined || value === "") return undefined;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return value;
}

const topicBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().optional(),
    order: z.coerce.number().min(0).optional(),
    isPublished: z.preprocess(optionalBoolean, z.boolean().optional()),
  })
  .strict();

export const topicIdParamSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex, "Invalid topic id") }),
});

export const topicSlugParamSchema = z.object({
  params: z.object({ slug: z.string().trim().min(1) }),
});

export const topicQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    isPublished: z.preprocess(optionalBoolean, z.boolean().optional()),
    includeUnpublished: z.preprocess(optionalBoolean, z.boolean().optional()),
  }),
});

export const createTopicSchema = z.object({ body: topicBodySchema });

export const updateTopicSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex, "Invalid topic id") }),
  body: topicBodySchema.partial().refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  }),
});
