import {
  createMovie,
  deleteMovie,
  generateMovieVietsub,
  getMovieDetail,
  getMovieLibrary,
  getMoviePlayback,
  getMoviePublishEligibility,
  getMovieReuploadCredentials,
  getMovieUploadCredentials,
  importEnglishSubtitle,
  importVietnamesePlainText,
  importVietnameseSubtitle,
  markMovieUploadCompleted,
  publishMovie,
  reportMovieUploadProgress,
  setFeaturedMovie,
  setHomeFeaturedMovie,
  syncMovieStreamStatus,
  updateMovie,
} from "./movie.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createHttpError } from "../../utils/createHttpError.js";
import { successResponse } from "../../utils/apiResponse.js";

function isAdmin(req) {
  return req.user?.role === "admin";
}

function getSubtitleContent(req) {
  const content = req.file?.buffer?.toString("utf8") || req.body?.content;
  if (!content?.trim()) throw createHttpError(400, "Subtitle file or content is required");
  return content;
}

export const getMovieLibraryController = asyncHandler(async (req, res) => {
  const data = await getMovieLibrary(req.validated.query, { admin: isAdmin(req) });
  return successResponse(res, "Movie library fetched successfully", data);
});

export const getMovieDetailController = asyncHandler(async (req, res) => {
  const data = await getMovieDetail(req.validated.params.id, { admin: isAdmin(req) });
  return successResponse(res, "Movie fetched successfully", data);
});

export const getMoviePlaybackController = asyncHandler(async (req, res) => {
  const playback = await getMoviePlayback(req.validated.params.id, { admin: isAdmin(req) });
  res.set("Cache-Control", "private, no-store");
  return successResponse(res, "Playback data created successfully", { playback });
});

export const createMovieController = asyncHandler(async (req, res) => {
  const data = await createMovie(req.validated.body, req.user, {
    posterFile: req.files?.poster?.[0],
    subtitleFile: req.files?.subtitle?.[0],
    viSubtitleFile: req.files?.viSubtitle?.[0],
  });
  return successResponse(res, "Movie draft created successfully", data, 201);
});

export const updateMovieController = asyncHandler(async (req, res) => {
  const movie = await updateMovie(req.validated.params.id, req.validated.body, { posterFile: req.file });
  return successResponse(res, "Movie updated successfully", { movie });
});

export const setFeaturedMovieController = asyncHandler(async (req, res) => {
  if (!req.file) throw createHttpError(400, "Hero thumbnail is required");
  const movie = await setFeaturedMovie(req.validated.params.id, req.file);
  return successResponse(res, "Featured movie and hero thumbnail updated successfully", { movie });
});

export const setHomeFeaturedMovieController = asyncHandler(async (req, res) => {
  const movie = await setHomeFeaturedMovie(req.validated.params.id);
  return successResponse(res, "Home featured movie updated successfully", { movie });
});

export const getUploadCredentialsController = asyncHandler(async (req, res) => {
  const upload = await getMovieUploadCredentials(req.validated.params.id, req.validated.body);
  res.set("Cache-Control", "private, no-store");
  return successResponse(res, "Upload credentials created successfully", { upload });
});

export const getReuploadCredentialsController = asyncHandler(async (req, res) => {
  const upload = await getMovieReuploadCredentials(req.validated.params.id, req.validated.body);
  res.set("Cache-Control", "private, no-store");
  return successResponse(res, "Re-upload credentials created successfully", { upload });
});

export const markUploadCompletedController = asyncHandler(async (req, res) => {
  const movie = await markMovieUploadCompleted(req.validated.params.id);
  return successResponse(res, "Upload completed and video is processing", { movie });
});

export const reportUploadProgressController = asyncHandler(async (req, res) => {
  const movie = await reportMovieUploadProgress(req.validated.params.id, req.validated.body);
  return successResponse(res, "Upload progress updated", { movie });
});

export const getStreamStatusController = asyncHandler(async (req, res) => {
  const movie = await syncMovieStreamStatus(req.validated.params.id);
  return successResponse(res, "Stream status synchronized", { movie });
});

export const getPublishEligibilityController = asyncHandler(async (req, res) => {
  const eligibility = await getMoviePublishEligibility(req.validated.params.id);
  return successResponse(res, "Publish eligibility evaluated", { eligibility });
});

export const publishMovieController = asyncHandler(async (req, res) => {
  const movie = await publishMovie(req.validated.params.id, req.validated.body.isPublished);
  return successResponse(res, "Movie publish status updated successfully", { movie });
});

export const importEnglishSubtitleController = asyncHandler(async (req, res) => {
  const data = await importEnglishSubtitle(req.validated.params.id, getSubtitleContent(req), req.validated.query.dryRun);
  return successResponse(res, req.validated.query.dryRun ? "Subtitle preview created" : "English subtitles imported", data);
});

export const importVietnameseSubtitleController = asyncHandler(async (req, res) => {
  const data = await importVietnameseSubtitle(req.validated.params.id, getSubtitleContent(req), req.validated.query.dryRun);
  return successResponse(res, req.validated.query.dryRun ? "Subtitle preview created" : "Vietnamese subtitles imported", data);
});

export const importViPlainTextController = asyncHandler(async (req, res) => {
  const content = req.body?.content;
  if (!content?.trim()) throw createHttpError(400, "content is required");
  const dryRun = req.validated.query.dryRun;
  const data = await importVietnamesePlainText(req.validated.params.id, content, dryRun);
  return successResponse(res, dryRun ? "Plain-text VI preview created" : "Vietnamese plain-text imported", data);
});

export const generateMovieVietsubController = asyncHandler(async (req, res) => {
  const data = await generateMovieVietsub(req.validated.params.id, req.validated.body);
  return successResponse(res, "AI Vietsub generated and synced to Bunny", data);
});

export const deleteMovieController = asyncHandler(async (req, res) => {
  const data = await deleteMovie(req.validated.params.id, { deleteAsset: req.query.deleteAsset === "true" });
  return successResponse(res, "Movie deleted successfully", data);
});
