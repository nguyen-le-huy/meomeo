import { apiClient } from "../../../services/apiClient.js";

export const getEbooks = (params) => apiClient.get("/ebooks", { params });
export const getEbook = (slug) => apiClient.get(`/ebooks/${slug}`);
export const getEbookReaderSettings = () => apiClient.get("/ebooks/reader-settings");
export const getEbookProgresses = (sessionId) => apiClient.get("/ebooks/progresses", { params: { sessionId } });
export const saveEbookReaderSettings = (data) => apiClient.put("/ebooks/reader-settings", data);
export const createEbook = (formData) => apiClient.post("/ebooks", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const updateEbook = (id, data) => apiClient.patch(`/ebooks/${id}`, data);
export const deleteEbook = (id) => apiClient.delete(`/ebooks/${id}`);
export const publishEbook = (id, isPublished) => apiClient.patch(`/ebooks/${id}/publish`, { isPublished });
export const getEbookProgress = (id, sessionId) => apiClient.get(`/ebooks/${id}/progress`, { params: { sessionId } });
export const saveEbookProgress = (id, data) => apiClient.put(`/ebooks/${id}/progress`, data);
export const getEbookBookmarks = (id, sessionId) => apiClient.get(`/ebooks/${id}/bookmarks`, { params: { sessionId } });
export const createEbookBookmark = (id, data) => apiClient.post(`/ebooks/${id}/bookmarks`, data);
export const deleteEbookBookmark = (id, bookmarkId, sessionId) => apiClient.delete(`/ebooks/${id}/bookmarks/${bookmarkId}`, { params: { sessionId } });
