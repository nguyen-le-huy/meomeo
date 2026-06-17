import { Router } from "express";
import {
  createSegmentController,
  deleteSegmentController,
  mergeSegmentController,
  reorderSegmentsController,
  updateSegmentController,
} from "./transcript.controller.js";
import {
  createSegmentSchema,
  reorderSegmentsSchema,
  segmentIdParamSchema,
  updateSegmentSchema,
} from "./transcript.validation.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = Router();

router.post("/", requireAuth, requireRole("admin"), validate(createSegmentSchema), createSegmentController);
router.patch("/:segmentId", requireAuth, requireRole("admin"), validate(updateSegmentSchema), updateSegmentController);
router.post(
  "/:segmentId/merge-next",
  requireAuth,
  requireRole("admin"),
  validate(segmentIdParamSchema),
  mergeSegmentController,
);
router.post("/reorder", requireAuth, requireRole("admin"), validate(reorderSegmentsSchema), reorderSegmentsController);
router.delete(
  "/:segmentId",
  requireAuth,
  requireRole("admin"),
  validate(segmentIdParamSchema),
  deleteSegmentController,
);

export default router;
