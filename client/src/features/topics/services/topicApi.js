import { apiClient } from "../../../services/apiClient.js";

export function getTopics(params) {
  return apiClient.get("/topics", { params });
}

export function createTopic(data) {
  return apiClient.post("/topics", data);
}

export function updateTopic(id, data) {
  return apiClient.patch(`/topics/${id}`, data);
}

export function deleteTopic(id) {
  return apiClient.delete(`/topics/${id}`);
}
