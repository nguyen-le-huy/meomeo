import { createHttpError } from "../utils/createHttpError.js";

export function requireAuth(req, res, next) {
  return next(createHttpError(501, "Authentication middleware is not implemented yet"));
}
