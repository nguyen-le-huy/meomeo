import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkImportVocabularyItems,
  createVocabularyItem,
  deleteVocabularyItem,
  generateAudioForVocabularyCourse,
  generateAudioForVocabularyItem,
  getVocabularyItemById,
  getVocabularyItemsByCourse,
  togglePublishVocabularyItem,
  updateVocabularyItem,
} from "../services/adminVocabularyApi.js";

export function useVocabularyItems(courseId, params) {
  return useQuery({
    enabled: Boolean(courseId),
    queryKey: ["admin", "vocabulary-items", courseId, params],
    queryFn: async () => {
      const response = await getVocabularyItemsByCourse(courseId, params);
      return response.data.data;
    },
  });
}

export function useVocabularyItem(itemId) {
  return useQuery({
    enabled: Boolean(itemId),
    queryKey: ["admin", "vocabulary-item", itemId],
    queryFn: async () => {
      const response = await getVocabularyItemById(itemId);
      return response.data.data.item;
    },
  });
}

function invalidateVocabulary(queryClient) {
  queryClient.invalidateQueries({ queryKey: ["admin", "vocabulary-items"] });
  queryClient.invalidateQueries({ queryKey: ["admin", "vocabulary-item"] });
}

export function useCreateVocabularyItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }) => createVocabularyItem(courseId, data),
    onSuccess: () => invalidateVocabulary(queryClient),
  });
}

export function useUpdateVocabularyItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }) => updateVocabularyItem(itemId, data),
    onSuccess: () => invalidateVocabulary(queryClient),
  });
}

export function useDeleteVocabularyItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVocabularyItem,
    onSuccess: () => invalidateVocabulary(queryClient),
  });
}

export function useTogglePublishVocabularyItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: togglePublishVocabularyItem,
    onSuccess: () => invalidateVocabulary(queryClient),
  });
}

export function useBulkImportVocabularyItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, items }) => bulkImportVocabularyItems(courseId, items),
    onSuccess: () => invalidateVocabulary(queryClient),
  });
}

export function useGenerateAudioForVocabularyItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, options }) => generateAudioForVocabularyItem(itemId, options),
    onSuccess: () => invalidateVocabulary(queryClient),
  });
}

export function useGenerateAudioForVocabularyCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, options }) => generateAudioForVocabularyCourse(courseId, options),
    onSuccess: () => invalidateVocabulary(queryClient),
  });
}
