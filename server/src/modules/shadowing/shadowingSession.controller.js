import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import { createHttpError } from "../../utils/createHttpError.js";
import {
  saveShadowingSessionProgress,
  submitShadowingSession,
  getMyShadowingSession,
  getMyShadowingSessions,
  getShadowingSessions,
  deleteShadowingSession,
} from "./shadowingSession.service.js";

function isAdmin(req) {
  return req.user?.role === "admin";
}

export const submitShadowingSessionController = asyncHandler(async (req, res) => {
  const session = await submitShadowingSession(req.validated.body);
  return successResponse(res, "Bài shadowing đã được nộp", { shadowingSession: session }, 201);
});

export const saveShadowingSessionProgressController = asyncHandler(async (req, res) => {
  const session = await saveShadowingSessionProgress(req.validated.body);
  return successResponse(res, "Tiến độ shadowing đã được lưu", { shadowingSession: session });
});

export const getMyShadowingSessionController = asyncHandler(async (req, res) => {
  const session = await getMyShadowingSession(req.validated.query.videoId, req.validated.query.sessionId);
  return successResponse(res, "Shadowing session fetched", { shadowingSession: session });
});

export const getMyShadowingSessionsController = asyncHandler(async (req, res) => {
  const sessions = await getMyShadowingSessions(req.validated.query.sessionId);
  return successResponse(res, "Shadowing sessions fetched", { shadowingSessions: sessions });
});

export const getShadowingSessionsController = asyncHandler(async (req, res) => {
  if (!isAdmin(req)) throw createHttpError(403, "Forbidden");
  const sessions = await getShadowingSessions(req.validated.query.videoId);
  return successResponse(res, "Shadowing sessions fetched", { shadowingSessions: sessions });
});

export const deleteShadowingSessionController = asyncHandler(async (req, res) => {
  if (!isAdmin(req)) throw createHttpError(403, "Forbidden");
  const data = await deleteShadowingSession(req.validated.params.id);
  return successResponse(res, "Shadowing session deleted", data);
});
