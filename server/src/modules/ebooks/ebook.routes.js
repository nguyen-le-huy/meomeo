import { Router } from "express";
import { optionalAuth, requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { ebookUpload } from "../../middlewares/ebookUpload.middleware.js";
import {
  bookmarkDeleteSchema, bookmarkQuerySchema, bookmarkRequestSchema, createEbookSchema, ebookIdParamSchema,
  ebookQuerySchema, ebookSlugParamSchema, progressListQuerySchema, progressQuerySchema, progressRequestSchema, publishEbookSchema, readerSettingsRequestSchema, updateEbookSchema,
} from "./ebook.validation.js";
import {
  createBookmarkController, createEbookController, deleteBookmarkController, deleteEbookController, getEbookByIdController,
  getEbookController, getProgressController, getReaderSettingsController, listBookmarksController, listEbooksController, listProgressesController, publishEbookController,
  saveProgressController, saveReaderSettingsController, streamEbookFileController, updateEbookController,
} from "./ebook.controller.js";

const router = Router();

router.get("/", optionalAuth, validate(ebookQuerySchema), listEbooksController);
router.get("/reader-settings", optionalAuth, getReaderSettingsController);
router.put("/reader-settings", optionalAuth, validate(readerSettingsRequestSchema), saveReaderSettingsController);
router.get("/progresses", optionalAuth, validate(progressListQuerySchema), listProgressesController);
router.get("/admin/:id", requireAuth, requireRole("admin"), validate(ebookIdParamSchema), getEbookByIdController);
router.get("/:id/progress", optionalAuth, validate(progressQuerySchema), getProgressController);
router.put("/:id/progress", optionalAuth, validate(progressRequestSchema), saveProgressController);
router.get("/:id/bookmarks", optionalAuth, validate(bookmarkQuerySchema), listBookmarksController);
router.post("/:id/bookmarks", optionalAuth, validate(bookmarkRequestSchema), createBookmarkController);
router.delete("/:id/bookmarks/:bookmarkId", optionalAuth, validate(bookmarkDeleteSchema), deleteBookmarkController);
router.get("/:id/file", optionalAuth, validate(ebookIdParamSchema), streamEbookFileController);
router.get("/:slug", optionalAuth, validate(ebookSlugParamSchema), getEbookController);
router.post("/", requireAuth, requireRole("admin"), ebookUpload.fields([{ name: "file", maxCount: 1 }, { name: "cover", maxCount: 1 }]), validate(createEbookSchema), createEbookController);
router.patch("/:id", requireAuth, requireRole("admin"), ebookUpload.fields([{ name: "cover", maxCount: 1 }]), validate(updateEbookSchema), updateEbookController);
router.delete("/:id", requireAuth, requireRole("admin"), validate(ebookIdParamSchema), deleteEbookController);
router.patch("/:id/publish", requireAuth, requireRole("admin"), validate(publishEbookSchema), publishEbookController);

export default router;
