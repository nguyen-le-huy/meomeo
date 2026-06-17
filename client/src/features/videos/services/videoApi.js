import { apiClient } from "../../../services/apiClient.js";

export function getVideos(params) {
  return apiClient.get("/videos", { params });
}

export function getVideo(id) {
  return apiClient.get(`/videos/${id}`);
}

export function getVideoTranscripts(id) {
  return apiClient.get(`/videos/${id}/transcripts`);
}

export function createVideo(data) {
  return apiClient.post("/videos", data);
}

export function updateVideo(id, data) {
  return apiClient.patch(`/videos/${id}`, data);
}

export function deleteVideo(id) {
  return apiClient.delete(`/videos/${id}`);
}

export function publishVideo(id, isPublished) {
  return apiClient.patch(`/videos/${id}/publish`, { isPublished });
}

export function analyzeVideoTranscript(id) {
  return apiClient.post(`/videos/${id}/analyze-transcript`);
}

export function checkDictation(data) {
  return apiClient.post("/dictation/check", data);
}

export function createTranscriptSegment(data) {
  return apiClient.post("/transcripts", data);
}

export function updateTranscriptSegment(segmentId, data) {
  return apiClient.patch(`/transcripts/${segmentId}`, data);
}

export function mergeTranscriptSegment(segmentId) {
  return apiClient.post(`/transcripts/${segmentId}/merge-next`);
}
