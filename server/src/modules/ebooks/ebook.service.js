import { Readable } from "node:stream";
import path from "node:path";
import { cloudinary } from "../../config/cloudinary.js";
import { createHttpError } from "../../utils/createHttpError.js";
import { Ebook } from "./ebook.model.js";
import { EbookBookmark } from "./ebookBookmark.model.js";
import { EbookProgress } from "./ebookProgress.model.js";
import { EbookReaderSetting } from "./ebookReaderSetting.model.js";

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

function uploadBuffer(file, options = {}) {
  return new Promise((resolve, reject) => {
    const extension = path.extname(file.originalname).toLowerCase().replace(".", "");
    const publicId = `${Date.now()}-${slugify(path.basename(file.originalname, path.extname(file.originalname))) || "ebook"}`;
    const stream = cloudinary.uploader.upload_stream(
      { folder: options.folder || "meomeo/ebooks", public_id: publicId, resource_type: options.resourceType || "raw", format: extension, use_filename: false, unique_filename: false },
      (error, result) => {
        if (error) return reject(createHttpError(502, "Ebook file upload failed"));
        return resolve(result);
      },
    );
    Readable.from(file.buffer).pipe(stream);
  });
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
  const result = await uploadBuffer(file);
  let coverResult = null;
  try {
    if (coverFile) coverResult = await uploadBuffer(coverFile, { folder: "meomeo/ebook-covers", resourceType: "image" });
  } catch (error) {
    try { await cloudinary.uploader.destroy(result.public_id, { resource_type: "raw" }); } catch { /* best effort cleanup */ }
    throw error;
  }
  const isPublished = data.isPublished ?? false;
  return Ebook.create({
    ...data,
    slug: await uniqueSlug(data.slug || data.title),
    format: extension,
    fileUrl: result.secure_url,
    filePublicId: result.public_id,
    fileSize: file.size,
    originalFilename: file.originalname,
    coverUrl: coverResult?.secure_url || "",
    coverPublicId: coverResult?.public_id || "",
    isPublished,
    publishedAt: isPublished ? new Date() : null,
    createdBy: adminUser.id,
  });
}

export async function updateEbook(id, data) {
  const ebook = await getEbookById(id, { admin: true });
  Object.assign(ebook, data);
  if (data.slug !== undefined) ebook.slug = await uniqueSlug(data.slug, id);
  if (data.isPublished !== undefined) ebook.publishedAt = data.isPublished ? (ebook.publishedAt || new Date()) : null;
  await ebook.save();
  return ebook;
}

export async function deleteEbook(id) {
  const ebook = await getEbookById(id, { admin: true });
  try { await cloudinary.uploader.destroy(ebook.filePublicId, { resource_type: "raw" }); } catch { /* metadata deletion should still complete */ }
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
