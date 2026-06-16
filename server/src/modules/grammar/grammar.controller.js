import { getHealth } from "./grammar.service.js";
import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getGrammarHealth = asyncHandler(async (req, res) => {
  const data = await getHealth();
  return successResponse(res, "Success", data);
});
