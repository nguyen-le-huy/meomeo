import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const assessShadowingSchema = z.object({
  body: z.object({
    sessionId: z.string().trim().min(1).default("anonymous"),
    segmentId: z.string().regex(objectIdRegex, "Invalid segment id"),
  }),
});
