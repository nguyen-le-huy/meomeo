import {
  createSegment,
  deleteSegment,
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

export const mergeSegmentController = asyncHandler(async (req, res) => {
  const segment = await mergeWithNextSegment(req.validated.params.segmentId);
  return successResponse(res, "Transcript segments merged successfully", { segment });
});

export const deleteSegmentController = asyncHandler(async (req, res) => {
  const data = await deleteSegment(req.validated.params.segmentId);
  return successResponse(res, "Transcript segment deleted successfully", data);
});

export const reorderSegmentsController = asyncHandler(async (req, res) => {
  const segments = await reorderSegments(req.validated.body.segmentIds);
  return successResponse(res, "Transcript segments reordered successfully", { segments });
});
