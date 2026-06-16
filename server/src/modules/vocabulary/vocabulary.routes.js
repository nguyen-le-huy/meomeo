import { Router } from "express";
import {
  bulkImportVocabularyItemsController,
  createVocabularyItemController,
  deleteVocabularyItemController,
  generateAudioForVocabularyCourseController,
  generateAudioForVocabularyItemController,
  getStudentVocabularyItemsByCourseController,
  getVocabularyHealth,
  getVocabularyItemDetailController,
  getVocabularyItemsByCourseController,
  togglePublishVocabularyItemController,
  updateVocabularyItemController,
} from "./vocabulary.controller.js";
import {
  bulkImportVocabularyItemsSchema,
  courseIdParamSchema,
  createVocabularyItemSchema,
  generateAudioForCourseSchema,
  generateAudioForItemSchema,
  updateVocabularyItemSchema,
  vocabularyItemIdParamSchema,
  vocabularyItemQuerySchema,
} from "./vocabulary.validation.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = Router();

router.get("/health", getVocabularyHealth);
router.get(
  "/student/courses/:courseId/items",
  requireAuth,
  requireRole("admin", "student"),
  validate(vocabularyItemQuerySchema),
  getStudentVocabularyItemsByCourseController,
);
router.get(
  "/courses/:courseId/items",
  requireAuth,
  requireRole("admin"),
  validate(vocabularyItemQuerySchema),
  getVocabularyItemsByCourseController,
);
router.post(
  "/courses/:courseId/items",
  requireAuth,
  requireRole("admin"),
  validate(createVocabularyItemSchema),
  createVocabularyItemController,
);
router.post(
  "/courses/:courseId/items/bulk-import",
  requireAuth,
  requireRole("admin"),
  validate(bulkImportVocabularyItemsSchema),
  bulkImportVocabularyItemsController,
);
router.post(
  "/courses/:courseId/generate-audio",
  requireAuth,
  requireRole("admin"),
  validate(generateAudioForCourseSchema),
  generateAudioForVocabularyCourseController,
);
router.get(
  "/items/:itemId",
  requireAuth,
  requireRole("admin"),
  validate(vocabularyItemIdParamSchema),
  getVocabularyItemDetailController,
);
router.patch(
  "/items/:itemId",
  requireAuth,
  requireRole("admin"),
  validate(updateVocabularyItemSchema),
  updateVocabularyItemController,
);
router.delete(
  "/items/:itemId",
  requireAuth,
  requireRole("admin"),
  validate(vocabularyItemIdParamSchema),
  deleteVocabularyItemController,
);
router.patch(
  "/items/:itemId/toggle-publish",
  requireAuth,
  requireRole("admin"),
  validate(vocabularyItemIdParamSchema),
  togglePublishVocabularyItemController,
);
router.post(
  "/items/:itemId/generate-audio",
  requireAuth,
  requireRole("admin"),
  validate(generateAudioForItemSchema),
  generateAudioForVocabularyItemController,
);

export default router;
