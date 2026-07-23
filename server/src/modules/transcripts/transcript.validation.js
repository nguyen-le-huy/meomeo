import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

function optionalBoolean(value) {
  if (value === undefined || value === "") return undefined;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return value;
}

export const segmentIdParamSchema = z.object({
  params: z.object({ segmentId: z.string().regex(objectIdRegex, "Invalid segment id") }),
});

export const createSegmentSchema = z.object({
  body: z
    .object({
      videoId: z.string().regex(objectIdRegex, "Invalid video id"),
      text: z.string().trim().min(1),
      startTime: z.coerce.number().min(0),
      endTime: z.coerce.number().min(0),
      isPublished: z.preprocess(optionalBoolean, z.boolean().optional()),
    })
    .strict()
    .refine((value) => value.endTime >= value.startTime, {
      message: "End time must be greater than or equal to start time",
      path: ["endTime"],
    }),
});

export const updateSegmentSchema = z.object({
  params: z.object({ segmentId: z.string().regex(objectIdRegex, "Invalid segment id") }),
  body: z
    .object({
      text: z.string().trim().min(1).optional(),
      translationText: z.string().optional(),
      startTime: z.coerce.number().min(0).optional(),
      endTime: z.coerce.number().min(0).optional(),
      isPublished: z.preprocess(optionalBoolean, z.boolean().optional()),
    })
    .strict()
    .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" }),
});

const translationUpdateSchema = z
  .object({
    segmentId: z.string().regex(objectIdRegex, "Invalid segment id"),
    translationText: z.string(),
  })
  .strict();

export const bulkUpdateTranslationsSchema = z.object({
  body: z
    .object({
      updates: z.array(translationUpdateSchema).min(1).max(5000),
    })
    .strict()
    .refine(
      ({ updates }) => new Set(updates.map(({ segmentId }) => segmentId)).size === updates.length,
      { message: "Each segment can only be updated once", path: ["updates"] },
    ),
});

export const reorderSegmentsSchema = z.object({
  body: z.object({
    segmentIds: z.array(z.string().regex(objectIdRegex, "Invalid segment id")).min(1),
  }),
});

export const deleteSegmentsSchema = z.object({
  body: z
    .object({
      segmentIds: z.array(z.string().regex(objectIdRegex, "Invalid segment id")).min(1),
    })
    .strict(),
});
