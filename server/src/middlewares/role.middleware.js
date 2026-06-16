import { createHttpError } from "../utils/createHttpError.js";

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(createHttpError(403, "Forbidden"));
    }

    return next();
  };
}
