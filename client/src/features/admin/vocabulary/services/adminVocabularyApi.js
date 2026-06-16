import { apiClient } from "../../../../services/apiClient.js";

export function getVocabularyItemsByCourse(courseId, params) {
  return apiClient.get(`/vocabulary/courses/${courseId}/items`, { params });
}

export function createVocabularyItem(courseId, data) {
  return apiClient.post(`/vocabulary/courses/${courseId}/items`, data);
}

export function getVocabularyItemById(itemId) {
  return apiClient.get(`/vocabulary/items/${itemId}`);
}

export function updateVocabularyItem(itemId, data) {
  return apiClient.patch(`/vocabulary/items/${itemId}`, data);
}

export function deleteVocabularyItem(itemId) {
  return apiClient.delete(`/vocabulary/items/${itemId}`);
}

export function togglePublishVocabularyItem(itemId) {
  return apiClient.patch(`/vocabulary/items/${itemId}/toggle-publish`);
}

export function bulkImportVocabularyItems(courseId, items) {
  return apiClient.post(`/vocabulary/courses/${courseId}/items/bulk-import`, { items });
}

export function generateAudioForVocabularyItem(itemId, options) {
  return apiClient.post(`/vocabulary/items/${itemId}/generate-audio`, options);
}

export function generateAudioForVocabularyCourse(courseId, options) {
  return apiClient.post(`/vocabulary/courses/${courseId}/generate-audio`, options);
}
