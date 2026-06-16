import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../users/user.model.js";
import { config } from "../../config/env.js";
import { createHttpError } from "../../utils/createHttpError.js";

export async function getHealth() {
  return { module: "auth", status: "ok" };
}

function buildUserResponse(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
  };
}

export async function login({ email, password }) {
  const loginValue = email.trim().toLowerCase();
  const user = await User.findOne({
    $or: [{ email: loginValue }, { username: loginValue }],
    role: "admin",
  });

  if (!user) {
    throw createHttpError(401, "Invalid credentials");
  }

  if (!user.isActive) {
    throw createHttpError(403, "Account is disabled");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw createHttpError(401, "Invalid credentials");
  }

  const token = jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );

  return {
    user: buildUserResponse(user),
    token,
  };
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw createHttpError(401, "Unauthorized");
  }

  return buildUserResponse(user);
}
