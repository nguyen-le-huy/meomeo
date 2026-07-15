import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import {
  createBookmark, createEbook, deleteBookmark, deleteEbook, getEbookById, getEbookBySlug,
  getEbookFile, getProgress, getReaderSettings, listBookmarks, listEbooks, listProgresses, publishEbook, saveProgress, saveReaderSettings, updateEbook,
} from "./ebook.service.js";

const isAdmin = (req) => req.user?.role === "admin";

function getApiOrigin(req) {
  return `${req.protocol}://${req.get("host")}`;
}

function serializeEbook(ebook, req) {
  const data = ebook?.toObject ? ebook.toObject() : { ...ebook };
  if (data.fileStorageProvider === "r2") {
    data.fileUrl = `${getApiOrigin(req)}/api/ebooks/${data._id}/file`;
  }
  return data;
}

export const listEbooksController = asyncHandler(async (req, res) => {
  const ebooks = await listEbooks(req.validated.query, { admin: isAdmin(req) });
  return successResponse(res, "Ebooks fetched successfully", { ebooks: ebooks.map((ebook) => serializeEbook(ebook, req)) });
});

export const getEbookController = asyncHandler(async (req, res) => successResponse(res, "Ebook fetched successfully", { ebook: serializeEbook(await getEbookBySlug(req.validated.params.slug, { admin: isAdmin(req) }), req) }));
export const getEbookByIdController = asyncHandler(async (req, res) => successResponse(res, "Ebook fetched successfully", { ebook: serializeEbook(await getEbookById(req.validated.params.id, { admin: true }), req) }));
export const createEbookController = asyncHandler(async (req, res) => successResponse(res, "Ebook created successfully", { ebook: serializeEbook(await createEbook(req.validated.body, req.files?.file?.[0], req.files?.cover?.[0], req.user), req) }, 201));
export const updateEbookController = asyncHandler(async (req, res) => successResponse(res, "Ebook updated successfully", { ebook: serializeEbook(await updateEbook(req.validated.params.id, req.validated.body, req.files?.cover?.[0]), req) }));
export const deleteEbookController = asyncHandler(async (req, res) => successResponse(res, "Ebook deleted successfully", await deleteEbook(req.validated.params.id)));
export const publishEbookController = asyncHandler(async (req, res) => successResponse(res, "Ebook publish status updated successfully", { ebook: serializeEbook(await publishEbook(req.validated.params.id, req.validated.body.isPublished), req) }));
export const streamEbookFileController = asyncHandler(async (req, res) => {
  const { ebook, object, redirectUrl, isPartial } = await getEbookFile(req.validated.params.id, req.headers.range, { admin: isAdmin(req) });
  if (redirectUrl) return res.redirect(302, redirectUrl);

  const filename = encodeURIComponent(ebook.originalFilename || `${ebook.slug}.${ebook.format}`);
  res.status(isPartial ? 206 : 200);
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Type", object.ContentType || (ebook.format === "pdf" ? "application/pdf" : "application/epub+zip"));
  res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${filename}`);
  if (object.ContentLength !== undefined) res.setHeader("Content-Length", String(object.ContentLength));
  if (object.ContentRange) res.setHeader("Content-Range", object.ContentRange);
  if (object.ETag) res.setHeader("ETag", object.ETag);
  return object.Body.pipe(res);
});
export const getProgressController = asyncHandler(async (req, res) => successResponse(res, "Ebook progress fetched successfully", { progress: await getProgress(req.validated.params.id, req.validated.query.sessionId, { admin: isAdmin(req) }) }));
export const listProgressesController = asyncHandler(async (req, res) => successResponse(res, "Ebook progresses fetched successfully", { progresses: await listProgresses(req.validated.query.sessionId) }));
export const saveProgressController = asyncHandler(async (req, res) => successResponse(res, "Ebook progress saved successfully", { progress: await saveProgress(req.validated.params.id, req.validated.body, { admin: isAdmin(req) }) }));
export const listBookmarksController = asyncHandler(async (req, res) => successResponse(res, "Ebook bookmarks fetched successfully", { bookmarks: await listBookmarks(req.validated.params.id, req.validated.query.sessionId, { admin: isAdmin(req) }) }));
export const createBookmarkController = asyncHandler(async (req, res) => successResponse(res, "Ebook bookmark saved successfully", { bookmark: await createBookmark(req.validated.params.id, req.validated.body, { admin: isAdmin(req) }) }, 201));
export const deleteBookmarkController = asyncHandler(async (req, res) => successResponse(res, "Ebook bookmark deleted successfully", await deleteBookmark(req.validated.params.id, req.validated.params.bookmarkId, req.validated.query.sessionId, { admin: isAdmin(req) })));
export const getReaderSettingsController = asyncHandler(async (req, res) => successResponse(res, "Ebook reader settings fetched successfully", { settings: await getReaderSettings() }));
export const saveReaderSettingsController = asyncHandler(async (req, res) => successResponse(res, "Ebook reader settings saved successfully", { settings: await saveReaderSettings(req.validated.body) }));
