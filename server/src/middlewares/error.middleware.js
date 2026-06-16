import { errorResponse } from "../utils/apiResponse.js";

export function notFoundHandler(req, res) {
  return errorResponse(res, `Route not found: ${req.originalUrl}`, [], 404);
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";
  const errors = err.errors || [];

  return errorResponse(res, message, errors, statusCode);
}
