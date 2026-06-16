import { Router } from "express";
import {
  createVocabularyCourseController,
  deleteVocabularyCourseController,
  getCourseHealth,
  getPublishedVocabularyCoursesController,
  getVocabularyCourseDetailController,
  getVocabularyCoursesController,
  togglePublishVocabularyCourseController,
  updateVocabularyCourseController,
} from "./course.controller.js";
import {
  courseIdParamSchema,
  courseQuerySchema,
  createVocabularyCourseSchema,
  updateVocabularyCourseSchema,
} from "./course.validation.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = Router();

router.get("/health", getCourseHealth);
router.get(
  "/vocabulary/published",
  requireAuth,
  requireRole("admin", "student"),
  validate(courseQuerySchema),
  getPublishedVocabularyCoursesController,
);
router.get(
  "/vocabulary",
  requireAuth,
  requireRole("admin"),
  validate(courseQuerySchema),
  getVocabularyCoursesController,
);
router.post(
  "/vocabulary",
  requireAuth,
  requireRole("admin"),
  validate(createVocabularyCourseSchema),
  createVocabularyCourseController,
);
router.get(
  "/vocabulary/:id",
  requireAuth,
  requireRole("admin"),
  validate(courseIdParamSchema),
  getVocabularyCourseDetailController,
);
router.patch(
  "/vocabulary/:id",
  requireAuth,
  requireRole("admin"),
  validate(updateVocabularyCourseSchema),
  updateVocabularyCourseController,
);
router.delete(
  "/vocabulary/:id",
  requireAuth,
  requireRole("admin"),
  validate(courseIdParamSchema),
  deleteVocabularyCourseController,
);
router.patch(
  "/vocabulary/:id/toggle-publish",
  requireAuth,
  requireRole("admin"),
  validate(courseIdParamSchema),
  togglePublishVocabularyCourseController,
);

export default router;
