import { z } from "zod";

export const uploadMediaSchema = z.object({
  body: z.object({}).passthrough(),
});
