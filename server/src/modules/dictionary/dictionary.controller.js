import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { lookupDictionary } from "./dictionary.service.js";

export const lookupDictionaryController = asyncHandler(async (req, res) => {
  const result = await lookupDictionary(req.validated.body);
  return successResponse(res, "Dictionary lookup completed successfully", { result });
});
