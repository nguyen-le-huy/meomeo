import { Router } from "express";
import { getBilingualVideoController, generateVietsubController } from "./bilingual.controller.js";
import { generateVietsubSchema, videoIdParamSchema } from "./bilingual.validation.js";
import { optionalAuth, requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = Router();

router.get("/:id/bilingual", optionalAuth, validate(videoIdParamSchema), getBilingualVideoController);
router.post(
  "/:id/generate-vietsub",
  requireAuth,
  requireRole("admin"),
  validate(generateVietsubSchema),
  generateVietsubController,
);

export default router;
