import { Router } from "express";
import {
  createTopicController,
  deleteTopicController,
  getTopicVideosController,
  getTopicsController,
  updateTopicController,
} from "./topic.controller.js";
import {
  createTopicSchema,
  topicIdParamSchema,
  topicQuerySchema,
  topicSlugParamSchema,
  updateTopicSchema,
} from "./topic.validation.js";
import { optionalAuth, requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = Router();

router.get("/", optionalAuth, validate(topicQuerySchema), getTopicsController);
router.get("/:slug/videos", optionalAuth, validate(topicSlugParamSchema), getTopicVideosController);
router.post("/", requireAuth, requireRole("admin"), validate(createTopicSchema), createTopicController);
router.patch("/:id", requireAuth, requireRole("admin"), validate(updateTopicSchema), updateTopicController);
router.delete("/:id", requireAuth, requireRole("admin"), validate(topicIdParamSchema), deleteTopicController);

export default router;
