import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../services/vocabularyAdminApi.js";

export function useVocabularyCourses() {
  return useQuery({
    queryKey: ["admin-vocabulary-courses"],
    queryFn: async () => (await api.getVocabularyCourses()).data.data.items,
  });
}

export function useVocabularyItems(courseId) {
  return useQuery({
    enabled: Boolean(courseId),
    queryKey: ["admin-vocabulary-items", courseId],
    queryFn: async () => (await api.getVocabularyItems(courseId)).data.data.items,
  });
}

export function useVocabularyExercises(courseId) {
  return useQuery({
    enabled: Boolean(courseId),
    queryKey: ["admin-vocabulary-exercises", courseId],
    queryFn: async () => (await api.getVocabularyExercises(courseId)).data.data.exercises,
  });
}

export function useVocabularyAdminMutations() {
  const queryClient = useQueryClient();
  const invalidateCourses = () => queryClient.invalidateQueries({ queryKey: ["admin-vocabulary-courses"] });
  const invalidateItems = (courseId) => queryClient.invalidateQueries({ queryKey: ["admin-vocabulary-items", courseId] });
  const invalidateExercises = (courseId) => queryClient.invalidateQueries({ queryKey: ["admin-vocabulary-exercises", courseId] });

  return {
    createCourse: useMutation({ mutationFn: api.createVocabularyCourse, onSuccess: invalidateCourses }),
    updateCourse: useMutation({ mutationFn: ({ id, data }) => api.updateVocabularyCourse(id, data), onSuccess: invalidateCourses }),
    deleteCourse: useMutation({ mutationFn: api.deleteVocabularyCourse, onSuccess: invalidateCourses }),
    toggleCourse: useMutation({ mutationFn: api.toggleVocabularyCourse, onSuccess: invalidateCourses }),
    createItem: useMutation({ mutationFn: ({ courseId, data }) => api.createVocabularyItem(courseId, data), onSuccess: (_, variables) => invalidateItems(variables.courseId) }),
    updateItem: useMutation({ mutationFn: ({ itemId, courseId, data }) => api.updateVocabularyItem(itemId, data), onSuccess: (_, variables) => invalidateItems(variables.courseId) }),
    deleteItem: useMutation({ mutationFn: ({ itemId }) => api.deleteVocabularyItem(itemId), onSuccess: (_, variables) => invalidateItems(variables.courseId) }),
    generateAudio: useMutation({ mutationFn: ({ itemId, data }) => api.generateVocabularyAudio(itemId, data), onSuccess: (_, variables) => invalidateItems(variables.courseId) }),
    generateCourseAudio: useMutation({ mutationFn: ({ courseId, data }) => api.generateVocabularyCourseAudio(courseId, data), onSuccess: (_, variables) => invalidateItems(variables.courseId) }),
    generateItems: useMutation({ mutationFn: ({ courseId, data }) => api.generateVocabularyWithAi(courseId, data), onSuccess: (_, variables) => invalidateItems(variables.courseId) }),
    saveExercise: useMutation({ mutationFn: ({ courseId, lessonKey, data }) => api.saveVocabularyExercise(courseId, lessonKey, data), onSuccess: (_, variables) => invalidateExercises(variables.courseId) }),
    deleteExercise: useMutation({ mutationFn: ({ courseId, lessonKey }) => api.deleteVocabularyExercise(courseId, lessonKey), onSuccess: (_, variables) => invalidateExercises(variables.courseId) }),
    generateExercise: useMutation({ mutationFn: ({ courseId, lessonKey, data }) => api.generateVocabularyExercise(courseId, lessonKey, data), onSuccess: (_, variables) => invalidateExercises(variables.courseId) }),
  };
}
