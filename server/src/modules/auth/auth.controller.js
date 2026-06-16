import { getCurrentUser, getHealth, login } from "./auth.service.js";
import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getAuthHealth = asyncHandler(async (req, res) => {
  const data = await getHealth();
  return successResponse(res, "Success", data);
});

export const loginController = asyncHandler(async (req, res) => {
  const data = await login(req.validated.body);
  return successResponse(res, "Login successful", data);
});

export const getMeController = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user.id);
  return successResponse(res, "Current user fetched successfully", { user });
});
