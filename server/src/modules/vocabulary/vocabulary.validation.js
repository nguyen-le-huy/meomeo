import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const partOfSpeechSchema = z.enum([
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "conjunction",
  "phrase",
  "other",
]);
const difficultySchema = z.enum(["easy", "medium", "hard"]);

function optionalBoolean(value) {
  if (value === undefined || value === "") return undefined;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return value;
}

const itemBodySchema = z
  .object({
    word: z.string().trim().min(1),
    phonetic: z.string().optional(),
    partOfSpeech: partOfSpeechSchema.optional(),
    meaningVi: z.string().trim().min(1),
    meaningEn: z.string().optional(),
    example: z.string().optional(),
    exampleMeaningVi: z.string().optional(),
    imageUrl: z.string().optional(),
    audioUrl: z.string().optional(),
    order: z.coerce.number().min(0).optional(),
    difficulty: difficultySchema.optional(),
    isPublished: z.preprocess(optionalBoolean, z.boolean().optional()),
  })
  .strict();

const bulkItemSchema = itemBodySchema.extend({
  word: z.string().trim().min(1),
  meaningVi: z.string().trim().min(1),
});

export const createVocabularyItemSchema = z.object({
  params: z.object({ courseId: z.string().regex(objectIdRegex, "Invalid course id") }),
  body: itemBodySchema,
});

export const updateVocabularyItemSchema = z.object({
  params: z.object({ itemId: z.string().regex(objectIdRegex, "Invalid vocabulary item id") }),
  body: itemBodySchema.partial().refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  }),
});

export const vocabularyItemIdParamSchema = z.object({
  params: z.object({ itemId: z.string().regex(objectIdRegex, "Invalid vocabulary item id") }),
});

export const courseIdParamSchema = z.object({
  params: z.object({ courseId: z.string().regex(objectIdRegex, "Invalid course id") }),
});

export const vocabularyItemQuerySchema = z.object({
  params: z.object({ courseId: z.string().regex(objectIdRegex, "Invalid course id") }),
  query: z.object({
    search: z.string().optional(),
    partOfSpeech: partOfSpeechSchema.optional(),
    difficulty: difficultySchema.optional(),
    isPublished: z.preprocess(optionalBoolean, z.boolean().optional()),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(["order", "createdAt", "word"]).default("order"),
  }),
});

export const bulkImportVocabularyItemsSchema = z.object({
  params: z.object({ courseId: z.string().regex(objectIdRegex, "Invalid course id") }),
  body: z.object({
    items: z.array(bulkItemSchema).min(1).max(200),
  }),
});

export const generateAudioForItemSchema = z.object({
  params: z.object({ itemId: z.string().regex(objectIdRegex, "Invalid vocabulary item id") }),
  body: z
    .object({
      force: z.preprocess(optionalBoolean, z.boolean().optional()).default(false),
      voice: z.string().optional(),
    })
    .default({}),
});

export const generateAudioForCourseSchema = z.object({
  params: z.object({ courseId: z.string().regex(objectIdRegex, "Invalid course id") }),
  body: z
    .object({
      force: z.preprocess(optionalBoolean, z.boolean().optional()).default(false),
      voice: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(100),
    })
    .default({}),
});
