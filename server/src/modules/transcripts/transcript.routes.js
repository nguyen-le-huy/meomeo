import { Router } from "express";
import {
  bulkUpdateTranslationsController,
  createSegmentController,
  deleteSegmentController,
  deleteSegmentsController,
  mergeSegmentController,
  reorderSegmentsController,
  updateSegmentController,
} from "./transcript.controller.js";
import {
  bulkUpdateTranslationsSchema,
  createSegmentSchema,
  deleteSegmentsSchema,
  reorderSegmentsSchema,
  segmentIdParamSchema,
  updateSegmentSchema,
} from "./transcript.validation.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = Router();

router.post("/", requireAuth, requireRole("admin"), validate(createSegmentSchema), createSegmentController);
router.patch(
  "/translations/bulk",
  requireAuth,
  requireRole("admin"),
  validate(bulkUpdateTranslationsSchema),
  bulkUpdateTranslationsController,
);
router.patch("/:segmentId", requireAuth, requireRole("admin"), validate(updateSegmentSchema), updateSegmentController);
router.post(
  "/:segmentId/merge-next",
  requireAuth,
  requireRole("admin"),
  validate(segmentIdParamSchema),
  mergeSegmentController,
);
router.post("/reorder", requireAuth, requireRole("admin"), validate(reorderSegmentsSchema), reorderSegmentsController);
router.delete("/", requireAuth, requireRole("admin"), validate(deleteSegmentsSchema), deleteSegmentsController);
router.delete(
  "/:segmentId",
  requireAuth,
  requireRole("admin"),
  validate(segmentIdParamSchema),
  deleteSegmentController,
);

export default router;
