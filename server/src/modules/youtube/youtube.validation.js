import { z } from "zod";

export const analyzeYoutubeSchema = z.object({
  body: z.object({
    youtubeUrl: z.string().trim().min(1, "YouTube URL is required"),
  }),
});
