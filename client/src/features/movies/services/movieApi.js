import { apiClient } from "../../../services/apiClient.js";

export function getMovieLibrary(params) {
  return apiClient.get("/movies/library", { params });
}

export function getMovie(id) {
  return apiClient.get(`/movies/${id}`);
}

export function getMoviePlayback(id) {
  return apiClient.get(`/movies/${id}/playback`);
}

export function createMovie(data) {
  return apiClient.post("/movies", data, {
    headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
}

export function updateMovie(id, data) {
  return apiClient.patch(`/movies/${id}`, data, {
    headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
}

export function setMovieHero(id, thumbnail) {
  const formData = new FormData();
  formData.append("thumbnail", thumbnail);
  return apiClient.post(`/movies/${id}/hero`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function getUploadCredentials(id, fileMetadata) {
  return apiClient.post(`/movies/${id}/upload-credentials`, fileMetadata, { timeout: 15_000 });
}

export function markUploadCompleted(id) {
  return apiClient.patch(`/movies/${id}/upload-completed`, undefined, { timeout: 10_000 });
}

export function reportUploadProgress(id, data) {
  return apiClient.patch(`/movies/${id}/upload-progress`, data, { timeout: 8_000 });
}

export function syncStreamStatus(id) {
  return apiClient.get(`/movies/${id}/stream-status`, { timeout: 15_000 });
}

export function publishMovie(id, isPublished) {
  return apiClient.patch(`/movies/${id}/publish`, { isPublished });
}

export function deleteMovie(id, deleteAsset = false) {
  return apiClient.delete(`/movies/${id}`, { params: { deleteAsset } });
}

export function importMovieSubtitle(id, language, file, dryRun = true) {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post(`/movies/${id}/subtitles/${language}/import`, formData, {
    params: { dryRun },
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function generateMovieVietsub(id, options = {}) {
  return apiClient.post(`/movies/${id}/subtitles/vi/generate`, options);
}

export function importViPlainText(id, content, dryRun = true) {
  return apiClient.post(`/movies/${id}/subtitles/vi/import-text`, { content }, { params: { dryRun } });
}
