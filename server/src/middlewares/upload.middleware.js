import multer from "multer";
import { createHttpError } from "../utils/createHttpError.js";

const allowedMediaTypes = ["image/", "audio/", "video/"];
export const mediaSizeLimits = {
  image: 5 * 1024 * 1024,
  audio: 20 * 1024 * 1024,
  video: 100 * 1024 * 1024,
};

function fileFilter(req, file, cb) {
  const isAllowed = allowedMediaTypes.some((type) => file.mimetype.startsWith(type));

  if (!isAllowed) {
    return cb(createHttpError(400, "Only image, audio, and video files are allowed"));
  }

  return cb(null, true);
}

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: mediaSizeLimits.video,
  },
});
