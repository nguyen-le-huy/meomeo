import { apiClient } from "../../../services/apiClient.js";

export function getBilingualVideo(id) {
  return apiClient.get(`/videos/${id}/bilingual`);
}

export function generateVietsub(id, data = {}) {
  return apiClient.post(`/videos/${id}/generate-vietsub`, data);
}
