import multer from "multer";
import { createHttpError } from "../utils/createHttpError.js";

const allowedExtensions = new Set([".epub", ".pdf"]);
const allowedMimeTypes = new Set(["application/epub+zip", "application/pdf", "application/octet-stream"]);
const allowedCoverMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxCoverFileSize = 10 * 1024 * 1024;

function fileFilter(req, file, cb) {
  const extension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));
  if (file.fieldname === "cover") {
    if (!allowedCoverMimeTypes.has(file.mimetype)) {
      return cb(createHttpError(400, "Cover must be a JPG, PNG, or WebP image smaller than 10MB"));
    }
    return cb(null, true);
  }
  if (file.fieldname !== "file" || !allowedExtensions.has(extension) || !allowedMimeTypes.has(file.mimetype)) {
    return cb(createHttpError(400, "Only EPUB and PDF files are allowed"));
  }
  return cb(null, true);
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { files: 2 },
});

function rejectLargeCover(req, res, next) {
  const cover = Array.isArray(req.files?.cover) ? req.files.cover[0] : null;
  if (cover?.size > maxCoverFileSize) {
    return next(createHttpError(400, "Cover must be a JPG, PNG, or WebP image smaller than 10MB"));
  }
  return next();
}

export const ebookUpload = {
  fields(fields) {
    return [upload.fields(fields), rejectLargeCover];
  },
};
