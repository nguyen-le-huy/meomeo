import { analyzeYoutubeUrl } from "./youtube.service.js";
import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const analyzeYoutubeController = asyncHandler(async (req, res) => {
  const data = await analyzeYoutubeUrl(req.validated.body.youtubeUrl);
  return successResponse(res, "YouTube video analyzed successfully", data);
});
