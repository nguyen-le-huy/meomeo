import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

function optionalBoolean(value) {
  if (value === undefined || value === "") return undefined;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return value;
}

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(220)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must use lowercase letters, numbers and hyphens");

const questionSchema = z
  .object({
    prompt: z.string().trim().min(1).max(500),
    choices: z.array(z.string().trim().min(1).max(250)).min(2).max(6),
    answer: z.string().trim().min(1).max(250),
    explanation: z.string().trim().max(1000).optional(),
  })
  .strict()
  .refine((question) => question.choices.includes(question.answer), {
    message: "Question answer must match one of the choices",
    path: ["answer"],
  });

const readingBodySchema = z
  .object({
    title: z.string().trim().min(1).max(180),
    slug: slugSchema.optional(),
    summary: z.string().trim().min(1).max(500),
    author: z.string().trim().min(1).max(120).optional(),
    authorRole: z.string().trim().max(160).optional(),
    level: z.string().trim().min(1).max(40).optional(),
    publishedAt: z.coerce.date().optional(),
    imageUrl: z.string().trim().url().max(1000),
    imageCredit: z.string().trim().max(120).optional(),
    imageCaption: z.string().trim().max(500).optional(),
    secondaryImageUrl: z.union([z.string().trim().url().max(1000), z.literal("")]).optional(),
    secondaryImageCredit: z.string().trim().max(120).optional(),
    secondaryImageCaption: z.string().trim().max(500).optional(),
    paragraphs: z.array(z.string().trim().min(1)).min(1).optional(),
    bodyHtml: z.string().max(500000).optional(),
    questions: z.array(questionSchema).optional(),
    isPublished: z.preprocess(optionalBoolean, z.boolean().optional()),
  })
  .strict();

export const readingIdParamSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex, "Invalid reading id") }),
});

export const readingSlugParamSchema = z.object({
  params: z.object({ slug: slugSchema }),
});

export const readingQuerySchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    includeUnpublished: z.preprocess(optionalBoolean, z.boolean().optional()),
  }),
});

export const createReadingSchema = z.object({
  body: readingBodySchema.refine(
    (data) => (data.paragraphs && data.paragraphs.length > 0) || (data.bodyHtml && data.bodyHtml.length > 0),
    { message: "At least one paragraph or bodyHtml is required" },
  ),
});

export const updateReadingSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex, "Invalid reading id") }),
  body: readingBodySchema
    .partial()
    .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" }),
});

export const publishReadingSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex, "Invalid reading id") }),
  body: z.object({
    isPublished: z.preprocess(optionalBoolean, z.boolean()),
  }),
});
