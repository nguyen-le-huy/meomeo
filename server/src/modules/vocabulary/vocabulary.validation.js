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
    collocations: z.array(z.string().trim().min(1)).max(12).optional(),
    imageUrl: z.string().optional(),
    audioUrl: z.string().optional(),
    audioProvider: z.enum(["openai", "elevenlabs", "manual", ""]).optional(),
    exampleAudioUrl: z.string().optional(),
    exampleAudioProvider: z.enum(["openai", "elevenlabs", "manual", ""]).optional(),
    generatedByAi: z.boolean().optional(),
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
      includeExample: z.preprocess(optionalBoolean, z.boolean().optional()).default(true),
      voice: z.string().optional(),
      provider: z.enum(["openai", "elevenlabs"]).default("openai"),
      elevenLabs: z
        .object({
          apiKey: z.string().optional(),
          voiceId: z.string().optional(),
          model: z.string().optional(),
          stability: z.coerce.number().min(0).max(1).optional(),
          similarityBoost: z.coerce.number().min(0).max(1).optional(),
        })
        .optional(),
    })
    .default({}),
});

export const generateAudioForCourseSchema = z.object({
  params: z.object({ courseId: z.string().regex(objectIdRegex, "Invalid course id") }),
  body: z
    .object({
      force: z.preprocess(optionalBoolean, z.boolean().optional()).default(false),
      includeExample: z.preprocess(optionalBoolean, z.boolean().optional()).default(true),
      voice: z.string().optional(),
      provider: z.enum(["openai", "elevenlabs"]).default("openai"),
      elevenLabs: z
        .object({
          apiKey: z.string().optional(),
          voiceId: z.string().optional(),
          model: z.string().optional(),
        })
        .optional(),
      limit: z.coerce.number().int().min(1).max(100).default(100),
    })
    .default({}),
});

const lessonKeySchema = z.enum(["match-meaning", "listening-fill", "cloze-quiz"]);

export const generateVocabularyWithAiSchema = z.object({
  params: z.object({ courseId: z.string().regex(objectIdRegex, "Invalid course id") }),
  body: z.object({
    words: z.array(z.string().trim().min(1)).min(1).max(40),
    generateAudio: z.boolean().default(true),
    audioProvider: z.enum(["openai", "elevenlabs"]).default("openai"),
    openAiVoice: z.string().default("coral"),
    elevenLabs: z
      .object({
        apiKey: z.string().optional(),
        voiceId: z.string().optional(),
        model: z.string().optional(),
      })
      .optional(),
    startOrder: z.coerce.number().int().min(0).default(0),
    isPublished: z.boolean().default(true),
  }),
});

export const vocabularyExerciseParamsSchema = z.object({
  params: z.object({
    courseId: z.string().regex(objectIdRegex, "Invalid course id"),
    lessonKey: lessonKeySchema.optional(),
  }),
});

const exerciseBodySchema = z.object({
  title: z.string().trim().min(2).max(120),
  instructions: z.string().max(500).optional(),
  questions: z.array(z.record(z.unknown())).max(200).default([]),
  settings: z.record(z.unknown()).optional(),
  generatedByAi: z.boolean().optional(),
  isPublished: z.boolean().default(true),
});

export const upsertVocabularyExerciseSchema = z.object({
  params: z.object({
    courseId: z.string().regex(objectIdRegex, "Invalid course id"),
    lessonKey: lessonKeySchema,
  }),
  body: exerciseBodySchema,
});

export const generateVocabularyExerciseSchema = z.object({
  params: z.object({
    courseId: z.string().regex(objectIdRegex, "Invalid course id"),
    lessonKey: lessonKeySchema,
  }),
  body: z.object({
    questionCount: z.coerce.number().int().min(1).max(500).optional(),
    audioProvider: z.enum(["openai", "elevenlabs"]).default("openai"),
    openAiVoice: z.string().default("coral"),
    elevenLabs: z
      .object({
        apiKey: z.string().optional(),
        voiceId: z.string().optional(),
        model: z.string().optional(),
      })
      .optional(),
    title: z.string().trim().min(2).max(120).optional(),
    instructions: z.string().max(500).optional(),
    settings: z.record(z.unknown()).optional(),
    isPublished: z.boolean().default(true),
  }),
});
