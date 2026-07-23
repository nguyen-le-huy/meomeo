import { z } from "zod";
import { TRANSLATION_MODEL_IDS } from "../bilingual/translationModels.js";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

function optionalBoolean(value) {
  if (value === undefined || value === "") return undefined;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return value;
}

const movieMetadataSchema = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(3000).optional(),
  posterUrl: z.string().url().or(z.literal("")).optional(),
  backdropUrl: z.string().url().or(z.literal("")).optional(),
  releaseYear: z.coerce.number().int().min(1888).max(2200).optional(),
  ageRating: z.string().trim().max(12).optional(),
  rating: z.coerce.number().min(0).max(10).optional(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1"]).optional(),
});

export const movieIdParamSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex, "Invalid movie id") }),
});

export const movieLibraryQuerySchema = z.object({
  query: z.object({
    includeUnpublished: z.preprocess(optionalBoolean, z.boolean().optional()),
    search: z.string().trim().max(120).optional(),
  }),
});

const uploadFileMetadataSchema = z.object({
  uploadFileName: z.string().trim().min(1).max(500),
  uploadFileSize: z.coerce.number().int().positive(),
  uploadFileLastModified: z.coerce.number().int().min(0),
  uploadFileType: z.enum(["video/mp4", "video/quicktime", "video/webm"]),
});

export const createMovieSchema = z.object({
  body: movieMetadataSchema.extend(uploadFileMetadataSchema.shape).strict(),
});

export const updateMovieSchema = z.object({
  params: movieIdParamSchema.shape.params,
  body: movieMetadataSchema.partial().strict(),
});

export const publishMovieSchema = z.object({
  params: movieIdParamSchema.shape.params,
  body: z.object({ isPublished: z.preprocess(optionalBoolean, z.boolean()) }).strict(),
});

export const uploadProgressSchema = z.object({
  params: movieIdParamSchema.shape.params,
  body: z.object({
    progress: z.coerce.number().min(0).max(100),
    bytesUploaded: z.coerce.number().min(0),
    bytesTotal: z.coerce.number().min(0),
    error: z.string().trim().max(1000).optional(),
  }).strict(),
});

export const uploadCredentialsSchema = z.object({
  params: movieIdParamSchema.shape.params,
  body: z.object({
    fileName: z.string().trim().min(1).max(500),
    fileSize: z.coerce.number().int().positive(),
    fileLastModified: z.coerce.number().int().min(0),
    fileType: z.enum(["video/mp4", "video/quicktime", "video/webm"]),
  }).strict(),
});

export const subtitleImportSchema = z.object({
  params: movieIdParamSchema.shape.params,
  query: z.object({ dryRun: z.preprocess(optionalBoolean, z.boolean().default(true)) }),
});

export const generateMovieVietsubSchema = z.object({
  params: movieIdParamSchema.shape.params,
  body: z.object({
    force: z.boolean().optional().default(false),
    model: z.enum(TRANSLATION_MODEL_IDS).optional(),
    targetLanguage: z.string().trim().max(12).optional(),
  }).strict(),
});

export const viPlainTextImportSchema = z.object({
  params: movieIdParamSchema.shape.params,
  query: z.object({ dryRun: z.preprocess(optionalBoolean, z.boolean().default(true)) }),
  body: z.object({ content: z.string().min(1, "content is required") }),
});
