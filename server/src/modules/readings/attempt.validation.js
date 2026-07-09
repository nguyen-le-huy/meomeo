import { z } from "zod";

export const submitAttemptSchema = z.object({
  params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid reading id") }),
  body: z.object({
    sessionId: z.string().trim().min(1).max(64),
    answers: z
      .array(
        z.object({
          questionIndex: z.number().int().min(0),
          selectedChoice: z.string().trim().min(1),
          correctAnswer: z.string().trim().min(1),
        }),
      )
      .min(1),
  }),
});

export const getAttemptsSchema = z.object({
  params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid reading id") }),
});

export const deleteAttemptSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid reading id"),
    attemptId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid attempt id"),
  }),
});
