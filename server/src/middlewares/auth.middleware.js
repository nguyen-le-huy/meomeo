import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { User } from "../modules/users/user.model.js";
import { createHttpError } from "../utils/createHttpError.js";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw createHttpError(401, "Unauthorized");
    }

    const payload = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(payload.userId);

    if (!user || !user.isActive) {
      throw createHttpError(401, "Unauthorized");
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return next();
  } catch (error) {
    if (error.statusCode) {
      return next(error);
    }

    return next(createHttpError(401, "Unauthorized"));
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return next();
    }

    const payload = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(payload.userId);

    if (user?.isActive) {
      req.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      };
    }

    return next();
  } catch {
    return next();
  }
}
