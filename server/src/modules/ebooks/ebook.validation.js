import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const sessionIdSchema = z.string().trim().min(8).max(120);

function optionalBoolean(value) {
  if (value === undefined || value === "") return undefined;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return value;
}

const ebookFields = z.object({
  title: z.string().trim().min(1).max(240),
  slug: z.string().trim().regex(slugRegex).optional(),
  description: z.string().trim().max(2000).optional(),
  author: z.string().trim().max(160).optional(),
  level: z.string().trim().max(60).optional(),
  language: z.string().trim().max(60).optional(),
  coverUrl: z.string().trim().url().max(1000).optional().or(z.literal("")),
  isPublished: z.preprocess(optionalBoolean, z.boolean().optional()),
}).strict();

export const ebookIdParamSchema = z.object({ params: z.object({ id: z.string().regex(objectIdRegex) }) });
export const ebookSlugParamSchema = z.object({ params: z.object({ slug: z.string().trim().regex(slugRegex) }) });
export const ebookQuerySchema = z.object({
  query: z.object({
    search: z.string().trim().max(120).optional(),
    includeUnpublished: z.preprocess(optionalBoolean, z.boolean().optional()),
  }),
});
export const createEbookSchema = z.object({ body: ebookFields });
export const updateEbookSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex) }),
  body: ebookFields.partial().refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" }),
});
export const publishEbookSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex) }),
  body: z.object({ isPublished: z.preprocess(optionalBoolean, z.boolean()) }),
});
export const progressParamSchema = z.object({ params: z.object({ id: z.string().regex(objectIdRegex) }) });
export const progressBodySchema = z.object({
  sessionId: sessionIdSchema,
  location: z.unknown().nullable().optional(),
  progress: z.coerce.number().min(0).max(1).optional(),
  page: z.coerce.number().int().min(0).optional(),
}).strict();
export const progressRequestSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex) }),
  body: progressBodySchema,
});
export const progressQuerySchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex) }),
  query: z.object({ sessionId: sessionIdSchema }),
});
export const progressListQuerySchema = z.object({
  query: z.object({ sessionId: sessionIdSchema }),
});
export const bookmarkBodySchema = z.object({ sessionId: sessionIdSchema, cfi: z.string().trim().min(1).max(1000), label: z.string().trim().max(240).optional() }).strict();
export const bookmarkRequestSchema = z.object({ params: z.object({ id: z.string().regex(objectIdRegex) }), body: bookmarkBodySchema });
export const bookmarkQuerySchema = progressQuerySchema;
export const bookmarkDeleteSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex), bookmarkId: z.string().regex(objectIdRegex) }),
  query: z.object({ sessionId: sessionIdSchema }),
});

export const readerSettingsSchema = z.object({
  fontSize: z.coerce.number().int().min(14).max(30),
  fontFamily: z.enum(["serif", "sans", "bbc"]),
  theme: z.enum(["light", "sepia", "dark"]),
  letterSpacing: z.coerce.number().min(0).max(0.12),
  lineHeight: z.coerce.number().min(1.2).max(2.2),
}).strict();

export const readerSettingsRequestSchema = z.object({
  body: readerSettingsSchema,
});
