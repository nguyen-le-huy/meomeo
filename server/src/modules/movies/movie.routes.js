import { Router } from "express";
import multer from "multer";
import {
  createMovieController,
  deleteMovieController,
  generateMovieVietsubController,
  getMovieDetailController,
  getMovieLibraryController,
  getMoviePlaybackController,
  getPublishEligibilityController,
  getStreamStatusController,
  getReuploadCredentialsController,
  getUploadCredentialsController,
  importEnglishSubtitleController,
  importVietnameseSubtitleController,
  importViPlainTextController,
  markUploadCompletedController,
  publishMovieController,
  reportUploadProgressController,
  setFeaturedMovieController,
  setHomeFeaturedMovieController,
  updateMovieController,
} from "./movie.controller.js";
import {
  createMovieSchema,
  generateMovieVietsubSchema,
  movieIdParamSchema,
  movieLibraryQuerySchema,
  publishMovieSchema,
  subtitleImportSchema,
  uploadCredentialsSchema,
  uploadProgressSchema,
  updateMovieSchema,
  viPlainTextImportSchema,
} from "./movie.validation.js";
import { optionalAuth, requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = Router();
const subtitleUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    const allowed = /\.(srt|vtt)$/i.test(file.originalname) || ["text/plain", "text/vtt", "application/x-subrip"].includes(file.mimetype);
    callback(allowed ? null : new Error("Only SRT and VTT subtitle files are allowed"), allowed);
  },
});
const heroThumbnailUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    const allowed = file.mimetype.startsWith("image/") && /\.(jpe?g|png|webp)$/i.test(file.originalname);
    callback(allowed ? null : new Error("Hero thumbnail must be a JPG, PNG, or WebP image"), allowed);
  },
});
const movieAssetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    const isPoster = file.fieldname === "poster" && file.mimetype.startsWith("image/");
    const isSubtitle = ["subtitle", "viSubtitle"].includes(file.fieldname)
      && (/\.srt$/i.test(file.originalname) || ["text/plain", "application/x-subrip"].includes(file.mimetype));
    const allowed = isPoster || isSubtitle;
    callback(allowed ? null : new Error("Poster must be an image and subtitle must be an SRT file"), allowed);
  },
});

const adminOnly = [requireAuth, requireRole("admin")];

router.get("/library", optionalAuth, validate(movieLibraryQuerySchema), getMovieLibraryController);
router.post(
  "/",
  ...adminOnly,
  movieAssetUpload.fields([
    { name: "poster", maxCount: 1 },
    { name: "subtitle", maxCount: 1 },
    { name: "viSubtitle", maxCount: 1 },
  ]),
  validate(createMovieSchema),
  createMovieController,
);
router.get("/:id", optionalAuth, validate(movieIdParamSchema), getMovieDetailController);
router.get("/:id/playback", optionalAuth, validate(movieIdParamSchema), getMoviePlaybackController);
router.patch("/:id", ...adminOnly, heroThumbnailUpload.single("poster"), validate(updateMovieSchema), updateMovieController);
router.post(
  "/:id/hero",
  ...adminOnly,
  heroThumbnailUpload.single("thumbnail"),
  validate(movieIdParamSchema),
  setFeaturedMovieController,
);
router.post(
  "/:id/home-hero",
  ...adminOnly,
  validate(movieIdParamSchema),
  setHomeFeaturedMovieController,
);
router.delete("/:id", ...adminOnly, validate(movieIdParamSchema), deleteMovieController);
router.post("/:id/upload-credentials", ...adminOnly, validate(uploadCredentialsSchema), getUploadCredentialsController);
router.post("/:id/reupload-credentials", ...adminOnly, validate(uploadCredentialsSchema), getReuploadCredentialsController);
router.patch("/:id/upload-completed", ...adminOnly, validate(movieIdParamSchema), markUploadCompletedController);
router.patch("/:id/upload-progress", ...adminOnly, validate(uploadProgressSchema), reportUploadProgressController);
router.get("/:id/stream-status", ...adminOnly, validate(movieIdParamSchema), getStreamStatusController);
router.get("/:id/publish-eligibility", ...adminOnly, validate(movieIdParamSchema), getPublishEligibilityController);
router.patch("/:id/publish", ...adminOnly, validate(publishMovieSchema), publishMovieController);
router.post(
  "/:id/subtitles/en/import",
  ...adminOnly,
  subtitleUpload.single("file"),
  validate(subtitleImportSchema),
  importEnglishSubtitleController,
);
router.post(
  "/:id/subtitles/vi/import",
  ...adminOnly,
  subtitleUpload.single("file"),
  validate(subtitleImportSchema),
  importVietnameseSubtitleController,
);
router.post(
  "/:id/subtitles/vi/import-text",
  ...adminOnly,
  validate(viPlainTextImportSchema),
  importViPlainTextController,
);
router.post(
  "/:id/subtitles/vi/generate",
  ...adminOnly,
  validate(generateMovieVietsubSchema),
  generateMovieVietsubController,
);

export default router;
