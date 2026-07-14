import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import {
  createBookmark, createEbook, deleteBookmark, deleteEbook, getEbookById, getEbookBySlug,
  getProgress, getReaderSettings, listBookmarks, listEbooks, listProgresses, publishEbook, saveProgress, saveReaderSettings, updateEbook,
} from "./ebook.service.js";

const isAdmin = (req) => req.user?.role === "admin";

export const listEbooksController = asyncHandler(async (req, res) => successResponse(res, "Ebooks fetched successfully", { ebooks: await listEbooks(req.validated.query, { admin: isAdmin(req) }) }));
export const getEbookController = asyncHandler(async (req, res) => successResponse(res, "Ebook fetched successfully", { ebook: await getEbookBySlug(req.validated.params.slug, { admin: isAdmin(req) }) }));
export const getEbookByIdController = asyncHandler(async (req, res) => successResponse(res, "Ebook fetched successfully", { ebook: await getEbookById(req.validated.params.id, { admin: true }) }));
export const createEbookController = asyncHandler(async (req, res) => successResponse(res, "Ebook created successfully", { ebook: await createEbook(req.validated.body, req.files?.file?.[0], req.files?.cover?.[0], req.user) }, 201));
export const updateEbookController = asyncHandler(async (req, res) => successResponse(res, "Ebook updated successfully", { ebook: await updateEbook(req.validated.params.id, req.validated.body) }));
export const deleteEbookController = asyncHandler(async (req, res) => successResponse(res, "Ebook deleted successfully", await deleteEbook(req.validated.params.id)));
export const publishEbookController = asyncHandler(async (req, res) => successResponse(res, "Ebook publish status updated successfully", { ebook: await publishEbook(req.validated.params.id, req.validated.body.isPublished) }));
export const getProgressController = asyncHandler(async (req, res) => successResponse(res, "Ebook progress fetched successfully", { progress: await getProgress(req.validated.params.id, req.validated.query.sessionId, { admin: isAdmin(req) }) }));
export const listProgressesController = asyncHandler(async (req, res) => successResponse(res, "Ebook progresses fetched successfully", { progresses: await listProgresses(req.validated.query.sessionId) }));
export const saveProgressController = asyncHandler(async (req, res) => successResponse(res, "Ebook progress saved successfully", { progress: await saveProgress(req.validated.params.id, req.validated.body, { admin: isAdmin(req) }) }));
export const listBookmarksController = asyncHandler(async (req, res) => successResponse(res, "Ebook bookmarks fetched successfully", { bookmarks: await listBookmarks(req.validated.params.id, req.validated.query.sessionId, { admin: isAdmin(req) }) }));
export const createBookmarkController = asyncHandler(async (req, res) => successResponse(res, "Ebook bookmark saved successfully", { bookmark: await createBookmark(req.validated.params.id, req.validated.body, { admin: isAdmin(req) }) }, 201));
export const deleteBookmarkController = asyncHandler(async (req, res) => successResponse(res, "Ebook bookmark deleted successfully", await deleteBookmark(req.validated.params.id, req.validated.params.bookmarkId, req.validated.query.sessionId, { admin: isAdmin(req) })));
export const getReaderSettingsController = asyncHandler(async (req, res) => successResponse(res, "Ebook reader settings fetched successfully", { settings: await getReaderSettings() }));
export const saveReaderSettingsController = asyncHandler(async (req, res) => successResponse(res, "Ebook reader settings saved successfully", { settings: await saveReaderSettings(req.validated.body) }));
