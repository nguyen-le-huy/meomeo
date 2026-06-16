import { errorResponse } from "../utils/apiResponse.js";
import { config } from "../config/env.js";

export function notFoundHandler(req, res) {
  return errorResponse(res, `Route not found: ${req.originalUrl}`, [], 404);
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.name === "MulterError" ? 400 : err.statusCode || 500;
  const message = err.message || "Internal server error";
  const errors = config.nodeEnv === "production" ? [] : err.errors || [];

  return errorResponse(res, message, errors, statusCode);
}
