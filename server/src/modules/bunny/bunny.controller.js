import { handleBunnyWebhook } from "../movies/movie.service.js";
import { verifyBunnyWebhook } from "./bunny.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createHttpError } from "../../utils/createHttpError.js";

export const bunnyStreamWebhookController = asyncHandler(async (req, res) => {
  if (!req.rawBody || !verifyBunnyWebhook(req.rawBody, req.headers)) {
    throw createHttpError(401, "Invalid Bunny Stream webhook signature");
  }
  await handleBunnyWebhook(req.body);
  return res.status(200).json({ received: true });
});
