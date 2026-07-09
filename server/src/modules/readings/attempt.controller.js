import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import { createHttpError } from "../../utils/createHttpError.js";
import { submitAttempt, getAttemptByUser, getAttempts, deleteAttempt } from "./attempt.service.js";

function isAdmin(req) {
  return req.user?.role === "admin";
}

export const submitAttemptController = asyncHandler(async (req, res) => {
  const attempt = await submitAttempt(req.validated.params.id, req.validated.body);
  return successResponse(res, "Bài làm đã được nộp", { attempt }, 201);
});

export const getMyAttemptController = asyncHandler(async (req, res) => {
  const attempt = await getAttemptByUser(req.validated.params.id, req.query.sessionId);
  return successResponse(res, "Attempt fetched", { attempt });
});

export const getAttemptsController = asyncHandler(async (req, res) => {
  if (!isAdmin(req)) throw createHttpError(403, "Forbidden");
  const attempts = await getAttempts(req.validated.params.id);
  return successResponse(res, "Attempts fetched", { attempts });
});

export const deleteAttemptController = asyncHandler(async (req, res) => {
  if (!isAdmin(req)) throw createHttpError(403, "Forbidden");
  const data = await deleteAttempt(req.validated.params.id, req.validated.params.attemptId);
  return successResponse(res, "Attempt deleted", data);
});
