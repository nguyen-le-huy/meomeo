import { z } from "zod";

export const progressIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
