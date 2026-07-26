import { getBilingualVideoData, startVietsubGeneration } from "./bilingual.service.js";
import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getBilingualVideoController = asyncHandler(async (req, res) => {
  const data = await getBilingualVideoData(req.validated.params.id, {
    admin: req.user?.role === "admin",
  });
  return successResponse(res, "Bilingual video data fetched successfully", data);
});

export const generateVietsubController = asyncHandler(async (req, res) => {
  const data = await startVietsubGeneration(req.validated.params.id, req.validated.body);
  return successResponse(res, "Vietnamese subtitle generation started", data, 202);
});
