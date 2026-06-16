import { Readable } from "node:stream";
import { cloudinary } from "../../config/cloudinary.js";
import { mediaSizeLimits } from "../../middlewares/upload.middleware.js";
import { createHttpError } from "../../utils/createHttpError.js";

export async function getHealth() {
  return { module: "media", status: "ok" };
}

function getMediaKind(mimetype) {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("audio/")) return "audio";
  if (mimetype.startsWith("video/")) return "video";
  return null;
}

function getCloudinaryOptions(file) {
  const mediaKind = getMediaKind(file.mimetype);

  if (!mediaKind) {
    throw createHttpError(400, "Only image, audio, and video files are allowed");
  }

  if (file.size > mediaSizeLimits[mediaKind]) {
    const maxMb = mediaSizeLimits[mediaKind] / 1024 / 1024;
    throw createHttpError(400, `${mediaKind} files must be ${maxMb}MB or smaller`);
  }

  const folderByMediaKind = {
    image: "images",
    audio: "audio",
    video: "videos",
  };

  return {
    folder: `meomeo-toeic/${folderByMediaKind[mediaKind]}`,
    resource_type: mediaKind === "image" ? "image" : "video",
    use_filename: true,
    unique_filename: true,
  };
}

function uploadBufferToCloudinary(file, options) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        return reject(createHttpError(502, "Cloudinary upload failed"));
      }

      return resolve(result);
    });

    Readable.from(file.buffer).pipe(uploadStream);
  });
}

export async function uploadMedia(file) {
  if (!file) {
    throw createHttpError(400, "No media file was uploaded");
  }

  const options = getCloudinaryOptions(file);
  const result = await uploadBufferToCloudinary(file, options);

  return {
    url: result.url,
    secureUrl: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    format: result.format,
    bytes: result.bytes,
    duration: result.duration || null,
    originalFilename: file.originalname,
  };
}
