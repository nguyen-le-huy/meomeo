import {
  createReading,
  deleteReading,
  getLatestReading,
  getReadingById,
  getReadingBySlug,
  getReadings,
  publishReading,
  updateReading,
} from "./reading.service.js";
import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

function isAdmin(req) {
  return req.user?.role === "admin";
}

export const getReadingsController = asyncHandler(async (req, res) => {
  const readings = await getReadings(req.validated.query, { admin: isAdmin(req) });
  return successResponse(res, "Readings fetched successfully", { readings });
});

export const getLatestReadingController = asyncHandler(async (req, res) => {
  const reading = await getLatestReading({ admin: isAdmin(req) });
  return successResponse(res, "Latest reading fetched successfully", { reading });
});

export const getReadingBySlugController = asyncHandler(async (req, res) => {
  const reading = await getReadingBySlug(req.validated.params.slug, { admin: isAdmin(req) });
  return successResponse(res, "Reading fetched successfully", { reading });
});

export const getReadingByIdController = asyncHandler(async (req, res) => {
  const reading = await getReadingById(req.validated.params.id, { admin: true });
  return successResponse(res, "Reading fetched successfully", { reading });
});

export const createReadingController = asyncHandler(async (req, res) => {
  const reading = await createReading(req.validated.body, req.user);
  return successResponse(res, "Reading created successfully", { reading }, 201);
});

export const updateReadingController = asyncHandler(async (req, res) => {
  const reading = await updateReading(req.validated.params.id, req.validated.body);
  return successResponse(res, "Reading updated successfully", { reading });
});

export const deleteReadingController = asyncHandler(async (req, res) => {
  const data = await deleteReading(req.validated.params.id);
  return successResponse(res, "Reading deleted successfully", data);
});

export const publishReadingController = asyncHandler(async (req, res) => {
  const reading = await publishReading(req.validated.params.id, req.validated.body.isPublished);
  return successResponse(res, "Reading publish status updated successfully", { reading });
});
