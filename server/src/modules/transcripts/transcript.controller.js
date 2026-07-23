import {
  bulkUpdateTranslations,
  createSegment,
  deleteSegment,
  deleteSegments,
  mergeWithNextSegment,
  reorderSegments,
  updateSegment,
} from "./transcript.service.js";
import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const createSegmentController = asyncHandler(async (req, res) => {
  const segment = await createSegment(req.validated.body);
  return successResponse(res, "Transcript segment created successfully", { segment }, 201);
});

export const updateSegmentController = asyncHandler(async (req, res) => {
  const segment = await updateSegment(req.validated.params.segmentId, req.validated.body);
  return successResponse(res, "Transcript segment updated successfully", { segment });
});

export const bulkUpdateTranslationsController = asyncHandler(async (req, res) => {
  const data = await bulkUpdateTranslations(req.validated.body.updates);
  return successResponse(res, "Transcript translations updated successfully", data);
});

export const mergeSegmentController = asyncHandler(async (req, res) => {
  const segment = await mergeWithNextSegment(req.validated.params.segmentId);
  return successResponse(res, "Transcript segments merged successfully", { segment });
});

export const deleteSegmentController = asyncHandler(async (req, res) => {
  const data = await deleteSegment(req.validated.params.segmentId);
  return successResponse(res, "Transcript segment deleted successfully", data);
});

export const deleteSegmentsController = asyncHandler(async (req, res) => {
  const data = await deleteSegments(req.validated.body.segmentIds);
  return successResponse(res, "Transcript segments deleted successfully", data);
});

export const reorderSegmentsController = asyncHandler(async (req, res) => {
  const segments = await reorderSegments(req.validated.body.segmentIds);
  return successResponse(res, "Transcript segments reordered successfully", { segments });
});
