import { Router } from "express";
import {
  analyzeVideoTranscriptController,
  createVideoController,
  deleteVideoController,
  getVideoDetailController,
  getVideoTranscriptsController,
  getVideosController,
  publishVideoController,
  updateVideoController,
} from "./video.controller.js";
import {
  createVideoSchema,
  publishVideoSchema,
  updateVideoSchema,
  videoIdParamSchema,
  videoQuerySchema,
} from "./video.validation.js";
import { optionalAuth, requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = Router();

router.get("/", optionalAuth, validate(videoQuerySchema), getVideosController);
router.get("/:id", optionalAuth, validate(videoIdParamSchema), getVideoDetailController);
router.get("/:id/transcripts", optionalAuth, validate(videoIdParamSchema), getVideoTranscriptsController);
router.post("/", requireAuth, requireRole("admin"), validate(createVideoSchema), createVideoController);
router.patch("/:id", requireAuth, requireRole("admin"), validate(updateVideoSchema), updateVideoController);
router.delete("/:id", requireAuth, requireRole("admin"), validate(videoIdParamSchema), deleteVideoController);
router.post(
  "/:id/analyze-transcript",
  requireAuth,
  requireRole("admin"),
  validate(videoIdParamSchema),
  analyzeVideoTranscriptController,
);
router.patch("/:id/publish", requireAuth, requireRole("admin"), validate(publishVideoSchema), publishVideoController);

export default router;
