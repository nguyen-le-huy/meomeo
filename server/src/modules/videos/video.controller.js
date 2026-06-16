import {
  analyzeVideoTranscript,
  createVideo,
  deleteVideo,
  getVideoById,
  getVideoTranscripts,
  getVideos,
  publishVideo,
  updateVideo,
} from "./video.service.js";
import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

function isAdmin(req) {
  return req.user?.role === "admin";
}

export const getVideosController = asyncHandler(async (req, res) => {
  const videos = await getVideos(req.validated.query, { admin: isAdmin(req) });
  return successResponse(res, "Videos fetched successfully", { videos });
});

export const getVideoDetailController = asyncHandler(async (req, res) => {
  const video = await getVideoById(req.validated.params.id, { admin: isAdmin(req) });
  return successResponse(res, "Video fetched successfully", { video });
});

export const getVideoTranscriptsController = asyncHandler(async (req, res) => {
  const segments = await getVideoTranscripts(req.validated.params.id, { admin: isAdmin(req) });
  return successResponse(res, "Video transcripts fetched successfully", { segments });
});

export const createVideoController = asyncHandler(async (req, res) => {
  const data = await createVideo(req.validated.body, req.user);
  return successResponse(res, "Video created successfully", data, 201);
});

export const updateVideoController = asyncHandler(async (req, res) => {
  const video = await updateVideo(req.validated.params.id, req.validated.body);
  return successResponse(res, "Video updated successfully", { video });
});

export const deleteVideoController = asyncHandler(async (req, res) => {
  const data = await deleteVideo(req.validated.params.id);
  return successResponse(res, "Video deleted successfully", data);
});

export const publishVideoController = asyncHandler(async (req, res) => {
  const video = await publishVideo(req.validated.params.id, req.validated.body.isPublished);
  return successResponse(res, "Video publish status updated successfully", { video });
});

export const analyzeVideoTranscriptController = asyncHandler(async (req, res) => {
  const data = await analyzeVideoTranscript(req.validated.params.id);
  return successResponse(res, "Video transcript analyzed successfully", data);
});
