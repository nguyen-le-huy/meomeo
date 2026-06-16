import { apiClient } from "../../../../services/apiClient.js";

export function getAdminVocabularyCourses(params) {
  return apiClient.get("/courses/vocabulary", { params });
}

export function createAdminVocabularyCourse(data) {
  return apiClient.post("/courses/vocabulary", data);
}

export function getAdminVocabularyCourseById(id) {
  return apiClient.get(`/courses/vocabulary/${id}`);
}

export function updateAdminVocabularyCourse(id, data) {
  return apiClient.patch(`/courses/vocabulary/${id}`, data);
}

export function deleteAdminVocabularyCourse(id) {
  return apiClient.delete(`/courses/vocabulary/${id}`);
}

export function togglePublishAdminVocabularyCourse(id) {
  return apiClient.patch(`/courses/vocabulary/${id}/toggle-publish`);
}
