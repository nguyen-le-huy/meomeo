import { getHealth, uploadMedia } from "./media.service.js";
import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createHttpError } from "../../utils/createHttpError.js";

export const getMediaHealth = asyncHandler(async (req, res) => {
  const data = await getHealth();
  return successResponse(res, "Success", data);
});

export const uploadSingleMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createHttpError(400, "No media file was uploaded");
  }

  const data = await uploadMedia(req.file);
  return successResponse(res, "Media uploaded successfully", data, 201);
});
