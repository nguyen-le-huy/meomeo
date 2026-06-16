import { z } from "zod";

export const exerciseIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
