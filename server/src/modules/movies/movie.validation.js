import { z } from "zod";
import { TRANSLATION_MODEL_IDS } from "../bilingual/translationModels.js";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const supportedVideoFileRegex = /\.(mp4|mov|webm|mkv)$/i;
const supportedVideoMimeTypes = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
  "video/matroska",
];
const uploadFileMetadataShape = {
  uploadFileName: z.string().trim().min(1).max(500),
  uploadFileSize: z.coerce.number().int().positive(),
  uploadFileLastModified: z.coerce.number().int().min(0),
  uploadFileType: z.enum(supportedVideoMimeTypes),
};

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

const uploadFileMetadataSchema = z.object(uploadFileMetadataShape).superRefine((data, context) => {
  if (!supportedVideoFileRegex.test(data.uploadFileName)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Video must be an MP4, MOV, WebM, or MKV file",
      path: ["uploadFileName"],
    });
  }
});

export const createMovieSchema = z.object({
  body: movieMetadataSchema
    .extend({
      ...uploadFileMetadataShape,
      subtitleSource: z.enum(["external", "embedded"]).default("external"),
    })
    .strict()
    .superRefine((data, context) => {
      const fileResult = uploadFileMetadataSchema.safeParse(data);
      if (!fileResult.success) {
        fileResult.error.issues.forEach((issue) => context.addIssue(issue));
      }
      if (data.subtitleSource === "embedded" && !/\.mkv$/i.test(data.uploadFileName)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Embedded subtitles are only available for MKV files",
          path: ["subtitleSource"],
        });
      }
    }),
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

const uploadCredentialsBodyShape = {
    fileName: z.string().trim().min(1).max(500),
    fileSize: z.coerce.number().int().positive(),
    fileLastModified: z.coerce.number().int().min(0),
    fileType: z.enum(supportedVideoMimeTypes),
};

function validateUploadVideoFile(data, context) {
    if (!supportedVideoFileRegex.test(data.fileName)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Video must be an MP4, MOV, WebM, or MKV file",
        path: ["fileName"],
      });
    }
}

export const uploadCredentialsSchema = z.object({
  params: movieIdParamSchema.shape.params,
  body: z.object(uploadCredentialsBodyShape).strict().superRefine(validateUploadVideoFile),
});

export const reuploadCredentialsSchema = z.object({
  params: movieIdParamSchema.shape.params,
  body: z
    .object({
      ...uploadCredentialsBodyShape,
      subtitleSource: z.enum(["external", "embedded"]).default("external"),
    })
    .strict()
    .superRefine((data, context) => {
      validateUploadVideoFile(data, context);
      if (data.subtitleSource === "embedded" && !/\.mkv$/i.test(data.fileName)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Embedded subtitles are only available for MKV files",
          path: ["subtitleSource"],
        });
      }
    }),
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
