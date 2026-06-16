import { assessShadowing } from "./shadowing.service.js";
import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const assessShadowingController = asyncHandler(async (req, res) => {
  const data = await assessShadowing({
    ...req.validated.body,
    audioUrl: req.file?.path || "",
  });
  return successResponse(res, "Shadowing pronunciation assessed successfully", data);
});
