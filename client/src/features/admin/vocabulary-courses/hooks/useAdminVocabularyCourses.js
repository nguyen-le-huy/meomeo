import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdminVocabularyCourse,
  deleteAdminVocabularyCourse,
  getAdminVocabularyCourseById,
  getAdminVocabularyCourses,
  togglePublishAdminVocabularyCourse,
  updateAdminVocabularyCourse,
} from "../services/adminVocabularyCourseApi.js";

export function useAdminVocabularyCourses(params) {
  return useQuery({
    queryKey: ["admin", "vocabulary-courses", params],
    queryFn: async () => {
      const response = await getAdminVocabularyCourses(params);
      return response.data.data;
    },
  });
}

export function useAdminVocabularyCourse(id) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["admin", "vocabulary-course", id],
    queryFn: async () => {
      const response = await getAdminVocabularyCourseById(id);
      return response.data.data.course;
    },
  });
}

export function useCreateAdminVocabularyCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAdminVocabularyCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vocabulary-courses"] });
    },
  });
}

export function useUpdateAdminVocabularyCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateAdminVocabularyCourse(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vocabulary-courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "vocabulary-course", variables.id] });
    },
  });
}

export function useDeleteAdminVocabularyCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAdminVocabularyCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vocabulary-courses"] });
    },
  });
}

export function useTogglePublishAdminVocabularyCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: togglePublishAdminVocabularyCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vocabulary-courses"] });
    },
  });
}
