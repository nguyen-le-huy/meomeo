import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { lookupDictionary } from "./dictionary.service.js";
import { clearDictionaryHistory, listDictionaryHistory, removeDictionaryHistory, saveDictionaryHistory } from "./dictionary.service.js";

export const lookupDictionaryController = asyncHandler(async (req, res) => {
  const result = await lookupDictionary(req.validated.body);
  const historyItem = await saveDictionaryHistory({ ...req.validated.body, result });
  return successResponse(res, "Dictionary lookup completed successfully", { result, historyItem });
});

export const listDictionaryHistoryController = asyncHandler(async (req, res) => {
  const history = await listDictionaryHistory(req.validated.query);
  return successResponse(res, "Dictionary history loaded successfully", { history });
});

export const removeDictionaryHistoryController = asyncHandler(async (req, res) => {
  await removeDictionaryHistory(req.validated.params);
  return successResponse(res, "Dictionary history item removed successfully", {});
});

export const clearDictionaryHistoryController = asyncHandler(async (req, res) => {
  await clearDictionaryHistory();
  return successResponse(res, "Dictionary history cleared successfully", {});
});
