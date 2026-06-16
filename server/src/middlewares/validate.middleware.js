import { createHttpError } from "../utils/createHttpError.js";

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return next(createHttpError(400, "Validation failed", result.error.flatten()));
    }

    req.validated = result.data;
    return next();
  };
}
