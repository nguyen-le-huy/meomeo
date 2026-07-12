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

export function assessShadowing(data) {
  return apiClient.post("/shadowing/assess", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function createTranscriptSegment(data) {
  return apiClient.post("/transcripts", data);
}

export function updateTranscriptSegment(segmentId, data) {
  return apiClient.patch(`/transcripts/${segmentId}`, data);
}

export function deleteTranscriptSegments(segmentIds) {
  return apiClient.delete("/transcripts", { data: { segmentIds } });
}

export function mergeTranscriptSegment(segmentId) {
  return apiClient.post(`/transcripts/${segmentId}/merge-next`);
}

export function submitShadowingSession(data) {
  return apiClient.post("/shadowing/sessions", data);
}

export function saveShadowingSessionProgress(data) {
  return apiClient.put("/shadowing/sessions/progress", data);
}

export function getMyShadowingSession(videoId, sessionId) {
  return apiClient.get("/shadowing/sessions/mine", { params: { videoId, sessionId } });
}

export function getMyShadowingSessions(sessionId) {
  return apiClient.get("/shadowing/sessions/mine/all", { params: { sessionId } });
}

export function getShadowingSessions(videoId) {
  return apiClient.get("/shadowing/sessions", { params: { videoId } });
}

export function deleteShadowingSession(id) {
  return apiClient.delete(`/shadowing/sessions/${id}`);
}
