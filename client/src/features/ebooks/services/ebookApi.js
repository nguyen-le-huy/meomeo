import { apiClient } from "../../../services/apiClient.js";

export const getEbooks = (params) => apiClient.get("/ebooks", { params });
export const getEbook = (slug) => apiClient.get(`/ebooks/${slug}`);
export const getEbookReaderSettings = () => apiClient.get("/ebooks/reader-settings");
export const getEbookProgresses = (sessionId) => apiClient.get("/ebooks/progresses", { params: { sessionId } });
export const saveEbookReaderSettings = (data) => apiClient.put("/ebooks/reader-settings", data);
export async function createEbook(formData) {
  const file = formData.get("file");
  if (!file) return apiClient.post("/ebooks", formData, { headers: { "Content-Type": "multipart/form-data" } });

  const contentType = file.type || "application/octet-stream";
  const uploadResponse = await apiClient.post("/ebooks/upload-url", {
    originalFilename: file.name,
    fileSize: file.size,
    contentType,
  });
  const upload = uploadResponse.data.data;
  const r2Response = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!r2Response.ok) {
    throw new Error(`Không upload được file ebook lên R2 (${r2Response.status}).`);
  }

  const completeData = new FormData();
  for (const field of ["title", "slug", "description", "author", "level", "language", "isPublished"]) {
    const value = formData.get(field);
    if (value !== null && value !== undefined && value !== "") completeData.append(field, value);
  }
  const cover = formData.get("cover");
  if (cover) completeData.append("cover", cover);
  completeData.append("originalFilename", file.name);
  completeData.append("fileSize", String(file.size));
  completeData.append("contentType", contentType);
  completeData.append("fileStorageBucket", upload.bucket);
  completeData.append("fileStorageKey", upload.key);
  completeData.append("fileUrl", upload.fileUrl || "");
  return apiClient.post("/ebooks/direct", completeData, { headers: { "Content-Type": "multipart/form-data" } });
}
export const updateEbook = (id, data) => apiClient.patch(`/ebooks/${id}`, data, data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined);
export const deleteEbook = (id) => apiClient.delete(`/ebooks/${id}`);
export const publishEbook = (id, isPublished) => apiClient.patch(`/ebooks/${id}/publish`, { isPublished });
export const getEbookProgress = (id, sessionId) => apiClient.get(`/ebooks/${id}/progress`, { params: { sessionId } });
export const saveEbookProgress = (id, data) => apiClient.put(`/ebooks/${id}/progress`, data);
export const getEbookBookmarks = (id, sessionId) => apiClient.get(`/ebooks/${id}/bookmarks`, { params: { sessionId } });
export const createEbookBookmark = (id, data) => apiClient.post(`/ebooks/${id}/bookmarks`, data);
export const deleteEbookBookmark = (id, bookmarkId, sessionId) => apiClient.delete(`/ebooks/${id}/bookmarks/${bookmarkId}`, { params: { sessionId } });
