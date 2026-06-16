import { checkDictationAnswer } from "./dictation.service.js";
import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const checkDictationController = asyncHandler(async (req, res) => {
  const data = await checkDictationAnswer(req.validated.body);
  return successResponse(res, "Dictation answer checked successfully", data);
});
