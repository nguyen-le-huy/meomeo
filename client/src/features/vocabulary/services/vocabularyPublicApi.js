import { apiClient } from "../../../services/apiClient.js";

export const getPublishedVocabularyCourses = () => apiClient.get("/courses/vocabulary/published", { params: { limit: 100, sort: "order" } });
export const getPublishedVocabularyCourse = (courseId) => apiClient.get(`/courses/vocabulary/published/${courseId}`);
export const getPublishedVocabularyItems = (courseId) => apiClient.get(`/vocabulary/student/courses/${courseId}/items`, { params: { limit: 100, sort: "order" } });
export const getPublishedVocabularyExercises = (courseId) => apiClient.get(`/vocabulary/public/courses/${courseId}/exercises`);
