import { apiClient } from "../../../services/apiClient.js";

export function getReadings(params) {
  return apiClient.get("/readings", { params });
}

export function getLatestReading() {
  return apiClient.get("/readings/latest");
}

export function getReading(slug) {
  return apiClient.get(`/readings/${slug}`);
}

export function createReading(data) {
  return apiClient.post("/readings", data);
}

export function updateReading(id, data) {
  return apiClient.patch(`/readings/${id}`, data);
}

export function deleteReading(id) {
  return apiClient.delete(`/readings/${id}`);
}

export function publishReading(id, isPublished) {
  return apiClient.patch(`/readings/${id}/publish`, { isPublished });
}

export function submitAttempt(readingId, data) {
  return apiClient.post(`/readings/${readingId}/attempt`, data);
}

export function getMyAttempt(readingId, sessionId) {
  return apiClient.get(`/readings/${readingId}/attempt/mine`, { params: { sessionId } });
}

export function getAttempts(readingId) {
  return apiClient.get(`/readings/${readingId}/attempts`);
}

export function deleteAttempt(readingId, attemptId) {
  return apiClient.delete(`/readings/${readingId}/attempts/${attemptId}`);
}
