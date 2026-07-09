import { Router } from "express";
import {
  createReadingController,
  deleteReadingController,
  getLatestReadingController,
  getReadingByIdController,
  getReadingBySlugController,
  getReadingsController,
  publishReadingController,
  updateReadingController,
} from "./reading.controller.js";
import {
  createReadingSchema,
  publishReadingSchema,
  readingIdParamSchema,
  readingQuerySchema,
  readingSlugParamSchema,
  updateReadingSchema,
} from "./reading.validation.js";
import {
  submitAttemptController,
  getMyAttemptController,
  getAttemptsController,
  deleteAttemptController,
} from "./attempt.controller.js";
import {
  submitAttemptSchema,
  getAttemptsSchema,
  deleteAttemptSchema,
} from "./attempt.validation.js";
import { optionalAuth, requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = Router();

router.get("/", optionalAuth, validate(readingQuerySchema), getReadingsController);
router.get("/latest", optionalAuth, getLatestReadingController);
router.get("/admin/:id", requireAuth, requireRole("admin"), validate(readingIdParamSchema), getReadingByIdController);

router.post("/:id/attempt", optionalAuth, validate(submitAttemptSchema), submitAttemptController);
router.get("/:id/attempt/mine", optionalAuth, validate(getAttemptsSchema), getMyAttemptController);
router.get("/:id/attempts", requireAuth, requireRole("admin"), validate(getAttemptsSchema), getAttemptsController);
router.delete("/:id/attempts/:attemptId", requireAuth, requireRole("admin"), validate(deleteAttemptSchema), deleteAttemptController);

router.get("/:slug", optionalAuth, validate(readingSlugParamSchema), getReadingBySlugController);
router.post("/", requireAuth, requireRole("admin"), validate(createReadingSchema), createReadingController);
router.patch("/:id", requireAuth, requireRole("admin"), validate(updateReadingSchema), updateReadingController);
router.delete("/:id", requireAuth, requireRole("admin"), validate(readingIdParamSchema), deleteReadingController);
router.patch("/:id/publish", requireAuth, requireRole("admin"), validate(publishReadingSchema), publishReadingController);

export default router;
