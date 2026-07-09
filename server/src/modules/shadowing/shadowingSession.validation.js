import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const shadowingSessionBodySchema = z.object({
  body: z.object({
    sessionId: z.string().trim().min(1).max(64),
    videoId: z.string().regex(objectIdRegex, "Invalid video id"),
    segments: z
      .array(
        z.object({
          segmentId: z.string().regex(objectIdRegex, "Invalid segment id"),
          bestPronunciationScore: z.number().min(0).max(100),
          bestAccuracyScore: z.number().min(0).max(100),
          bestFluencyScore: z.number().min(0).max(100),
          bestCompletenessScore: z.number().min(0).max(100),
          attempts: z.number().int().min(1),
        }),
      )
      .min(1),
  }),
});

export const saveShadowingSessionProgressSchema = shadowingSessionBodySchema;
export const submitShadowingSessionSchema = shadowingSessionBodySchema;

export const getMyShadowingSessionSchema = z.object({
  query: z.object({
    videoId: z.string().regex(objectIdRegex, "Invalid video id"),
    sessionId: z.string().trim().min(1).max(64),
  }),
});

export const getMyShadowingSessionsSchema = z.object({
  query: z.object({
    sessionId: z.string().trim().min(1).max(64),
  }),
});

export const getShadowingSessionsSchema = z.object({
  query: z.object({
    videoId: z.string().regex(objectIdRegex, "Invalid video id"),
  }),
});

export const shadowingSessionIdParamSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex, "Invalid session id") }),
});
