import { Readable } from "node:stream";
import path from "node:path";
import { createRequire } from "node:module";
import { cloudinary } from "../../config/cloudinary.js";
import { config } from "../../config/env.js";
import { deleteR2Object, getR2ObjectStream, putR2Object } from "../../config/r2.js";
import { createHttpError } from "../../utils/createHttpError.js";
import { Ebook } from "./ebook.model.js";
import { EbookBookmark } from "./ebookBookmark.model.js";
import { EbookProgress } from "./ebookProgress.model.js";
import { EbookReaderSetting } from "./ebookReaderSetting.model.js";

const require = createRequire(import.meta.url);
const cloudinaryUploader = require("cloudinary/lib/uploader.js");

function slugify(value) {
  return String(value || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 240);
}

async function uniqueSlug(input, currentId) {
  const base = slugify(input) || `ebook-${Date.now()}`;
  let slug = base;
  let suffix = 2;
  while (await Ebook.exists({ slug, ...(currentId ? { _id: { $ne: currentId } } : {}) })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

function uploadStreamBuffer(file, uploadOptions) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(createHttpError(502, `Ebook file upload failed: ${error.message || "Cloudinary upload error"}`));
        return resolve(result);
      },
    );
    Readable.from(file.buffer).pipe(stream);
  });
}

function uploadLargeBuffer(file, uploadOptions) {
  return new Promise((resolve, reject) => {
    const chunkSize = 6_000_000;
    const stream = cloudinaryUploader.upload_large_stream(
      null,
      (result) => {
        if (result?.error) return reject(result.error);
        return resolve(result);
      },
      {
        ...uploadOptions,
        chunk_size: chunkSize,
        part_size: chunkSize,
      },
    );

    stream.on("error", (error) => {
      reject(error);
    });

    Readable.from(file.buffer).pipe(stream);
  }).catch((error) => {
    throw createHttpError(502, `Ebook file upload failed: ${error.message || "Cloudinary upload error"}`);
  });
}

function uploadBuffer(file, options = {}) {
  const extension = path.extname(file.originalname).toLowerCase().replace(".", "");
  const publicId = `${Date.now()}-${slugify(path.basename(file.originalname, path.extname(file.originalname))) || "ebook"}`;
  const resourceType = options.resourceType || "raw";
  const uploadOptions = {
    folder: options.folder || "meomeo/ebooks",
    public_id: publicId,
    resource_type: resourceType,
    format: extension,
    use_filename: false,
    unique_filename: false,
  };

  if (resourceType === "raw") return uploadLargeBuffer(file, uploadOptions);
  return uploadStreamBuffer(file, uploadOptions);
}

function buildR2Key(file) {
  const extension = path.extname(file.originalname).toLowerCase();
  const basename = slugify(path.basename(file.originalname, extension)) || "ebook";
  const prefix = config.r2.ebookPrefix.replace(/^\/+|\/+$/g, "") || "ebooks";
  return `${prefix}/${Date.now()}-${basename}${extension}`;
}

async function uploadEbookToR2(file) {
  const key = buildR2Key(file);
  try {
    const result = await putR2Object({
      key,
      body: file.buffer,
      contentType: file.mimetype || "application/octet-stream",
      contentLength: file.size,
    });
    const publicUrl = config.r2.publicBaseUrl
      ? `${config.r2.publicBaseUrl.replace(/\/+$/g, "")}/${encodeURI(key)}`
      : "";
    return {
      bucket: result.bucket,
      key: result.key,
      url: publicUrl || `/api/ebooks/file/${encodeURIComponent(result.key)}`,
    };
  } catch (error) {
    throw createHttpError(502, `R2 ebook upload failed: ${error.message || "Cloudflare R2 error"}`);
  }
}

function buildFilter(query = {}, admin = false) {
  const filter = {};
  if (!admin || !query.includeUnpublished) filter.isPublished = true;
  if (query.search) filter.$or = [
    { title: { $regex: query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
    { author: { $regex: query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
  ];
  return filter;
}

export async function listEbooks(query, options = {}) {
  return Ebook.find(buildFilter(query, options.admin)).sort({ publishedAt: -1, createdAt: -1 });
}

export async function getEbookBySlug(slug, options = {}) {
  const filter = { slug };
  if (!options.admin) filter.isPublished = true;
  const ebook = await Ebook.findOne(filter);
  if (!ebook) throw createHttpError(404, "Ebook not found");
  return ebook;
}

export async function getEbookById(id, options = {}) {
  const filter = { _id: id };
  if (!options.admin) filter.isPublished = true;
  const ebook = await Ebook.findOne(filter);
  if (!ebook) throw createHttpError(404, "Ebook not found");
  return ebook;
}

export async function createEbook(data, file, coverFile, adminUser) {
  if (!file) throw createHttpError(400, "Ebook file is required");
  const extension = path.extname(file.originalname).toLowerCase().slice(1);
  const result = await uploadEbookToR2(file);
  let coverResult = null;
  try {
    if (coverFile) coverResult = await uploadBuffer(coverFile, { folder: "meomeo/ebook-covers", resourceType: "image" });
  } catch (error) {
    try { await deleteR2Object(result.key); } catch { /* best effort cleanup */ }
    throw error;
  }
  const isPublished = data.isPublished ?? false;
  return Ebook.create({
    ...data,
    slug: await uniqueSlug(data.slug || data.title),
    format: extension,
    fileUrl: result.url,
    filePublicId: result.key,
    fileStorageProvider: "r2",
    fileStorageBucket: result.bucket,
    fileStorageKey: result.key,
    fileSize: file.size,
    originalFilename: file.originalname,
    coverUrl: coverResult?.secure_url || "",
    coverPublicId: coverResult?.public_id || "",
    isPublished,
    publishedAt: isPublished ? new Date() : null,
    createdBy: adminUser.id,
  });
}

export async function updateEbook(id, data, coverFile) {
  const ebook = await getEbookById(id, { admin: true });
  const { removeCover, ...fields } = data;
  Object.assign(ebook, fields);
  if (data.slug !== undefined) ebook.slug = await uniqueSlug(data.slug, id);
  if (data.isPublished !== undefined) ebook.publishedAt = data.isPublished ? (ebook.publishedAt || new Date()) : null;

  if (coverFile) {
    const nextCover = await uploadBuffer(coverFile, { folder: "meomeo/ebook-covers", resourceType: "image" });
    const oldCoverPublicId = ebook.coverPublicId;
    ebook.coverUrl = nextCover.secure_url;
    ebook.coverPublicId = nextCover.public_id;
    if (oldCoverPublicId) {
      try { await cloudinary.uploader.destroy(oldCoverPublicId, { resource_type: "image" }); } catch { /* best effort cleanup */ }
    }
  } else if (removeCover) {
    const oldCoverPublicId = ebook.coverPublicId;
    ebook.coverUrl = "";
    ebook.coverPublicId = "";
    if (oldCoverPublicId) {
      try { await cloudinary.uploader.destroy(oldCoverPublicId, { resource_type: "image" }); } catch { /* best effort cleanup */ }
    }
  }

  await ebook.save();
  return ebook;
}

export async function deleteEbook(id) {
  const ebook = await getEbookById(id, { admin: true });
  if (ebook.fileStorageProvider === "r2") {
    try { await deleteR2Object(ebook.fileStorageKey || ebook.filePublicId); } catch { /* metadata deletion should still complete */ }
  } else {
    try { await cloudinary.uploader.destroy(ebook.filePublicId, { resource_type: "raw" }); } catch { /* metadata deletion should still complete */ }
  }
  if (ebook.coverPublicId) {
    try { await cloudinary.uploader.destroy(ebook.coverPublicId, { resource_type: "image" }); } catch { /* best effort cleanup */ }
  }
  await ebook.deleteOne();
  await Promise.all([
    EbookProgress.deleteMany({ ebookId: id }),
    EbookBookmark.deleteMany({ ebookId: id }),
  ]);
  return { id };
}

export async function getEbookFile(id, range, options = {}) {
  const ebook = await getEbookById(id, options);
  if (ebook.fileStorageProvider !== "r2") {
    return { ebook, redirectUrl: ebook.fileUrl };
  }

  const normalizedRange = /^bytes=\d*-\d*$/.test(range || "") ? range : undefined;
  try {
    const object = await getR2ObjectStream(ebook.fileStorageKey || ebook.filePublicId, normalizedRange);
    return { ebook, object, isPartial: Boolean(normalizedRange && object.ContentRange) };
  } catch (error) {
    throw createHttpError(502, `Could not read ebook file from R2: ${error.message || "Cloudflare R2 error"}`);
  }
}

export async function publishEbook(id, isPublished) {
  return updateEbook(id, { isPublished });
}

export async function getProgress(id, sessionId, options = {}) {
  await getEbookById(id, options);
  return EbookProgress.findOne({ ebookId: id, sessionId });
}

export async function listProgresses(sessionId) {
  return EbookProgress.find({ sessionId }).select("ebookId progress page updatedAt location");
}

export async function saveProgress(id, data, options = {}) {
  await getEbookById(id, options);
  return EbookProgress.findOneAndUpdate({ ebookId: id, sessionId: data.sessionId }, { ...data, ebookId: id, updatedAt: new Date() }, { upsert: true, new: true, setDefaultsOnInsert: true });
}

export async function listBookmarks(id, sessionId, options = {}) {
  await getEbookById(id, options);
  return EbookBookmark.find({ ebookId: id, sessionId }).sort({ createdAt: -1 });
}

export async function createBookmark(id, data, options = {}) {
  await getEbookById(id, options);
  return EbookBookmark.findOneAndUpdate({ ebookId: id, sessionId: data.sessionId, cfi: data.cfi }, { ...data, ebookId: id }, { upsert: true, new: true, setDefaultsOnInsert: true });
}

export async function deleteBookmark(id, bookmarkId, sessionId, options = {}) {
  await getEbookById(id, options);
  const bookmark = await EbookBookmark.findOneAndDelete({ _id: bookmarkId, ebookId: id, sessionId });
  if (!bookmark) throw createHttpError(404, "Bookmark not found");
  return { id: bookmarkId };
}

export async function getReaderSettings() {
  return EbookReaderSetting.findOneAndUpdate(
    { key: "global" },
    { $setOnInsert: { key: "global" } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

export async function saveReaderSettings(data) {
  return EbookReaderSetting.findOneAndUpdate(
    { key: "global" },
    { ...data, key: "global" },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}
