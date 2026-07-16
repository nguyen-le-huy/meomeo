import { apiClient } from "../../../services/apiClient.js";

export const getVocabularyCourses = () => apiClient.get("/courses/vocabulary", { params: { limit: 100, sort: "order" } });
export const createVocabularyCourse = (data) => apiClient.post("/courses/vocabulary", data);
export const updateVocabularyCourse = (id, data) => apiClient.patch(`/courses/vocabulary/${id}`, data);
export const deleteVocabularyCourse = (id) => apiClient.delete(`/courses/vocabulary/${id}`);
export const toggleVocabularyCourse = (id) => apiClient.patch(`/courses/vocabulary/${id}/toggle-publish`);

export const getVocabularyItems = (courseId) => apiClient.get(`/vocabulary/courses/${courseId}/items`, { params: { limit: 100, sort: "order" } });
export const createVocabularyItem = (courseId, data) => apiClient.post(`/vocabulary/courses/${courseId}/items`, data);
export const updateVocabularyItem = (itemId, data) => apiClient.patch(`/vocabulary/items/${itemId}`, data);
export const deleteVocabularyItem = (itemId) => apiClient.delete(`/vocabulary/items/${itemId}`);
export const generateVocabularyAudio = (itemId, data) => apiClient.post(`/vocabulary/items/${itemId}/generate-audio`, data);
export const generateVocabularyCourseAudio = (courseId, data) => apiClient.post(`/vocabulary/courses/${courseId}/generate-audio`, data);
export const generateVocabularyWithAi = (courseId, data) => apiClient.post(`/vocabulary/courses/${courseId}/generate-ai`, data);

export const getVocabularyExercises = (courseId) => apiClient.get(`/vocabulary/courses/${courseId}/exercises`);
export const saveVocabularyExercise = (courseId, lessonKey, data) => apiClient.put(`/vocabulary/courses/${courseId}/exercises/${lessonKey}`, data);
export const deleteVocabularyExercise = (courseId, lessonKey) => apiClient.delete(`/vocabulary/courses/${courseId}/exercises/${lessonKey}`);
export const generateVocabularyExercise = (courseId, lessonKey, data) => apiClient.post(`/vocabulary/courses/${courseId}/exercises/${lessonKey}/generate-ai`, data);
