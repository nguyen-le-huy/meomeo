import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEbook, deleteEbook, getEbook, getEbookProgresses, getEbooks, publishEbook, updateEbook } from "../services/ebookApi.js";

const invalidate = (client) => client.invalidateQueries({ queryKey: ["ebooks"] });

export function useEbooks(params) {
  return useQuery({ queryKey: ["ebooks", params], queryFn: async () => (await getEbooks(params)).data.data.ebooks });
}

export function useEbook(slug) {
  return useQuery({ enabled: Boolean(slug), queryKey: ["ebook", slug], queryFn: async () => (await getEbook(slug)).data.data.ebook });
}

export function useEbookProgresses(sessionId) {
  return useQuery({
    enabled: Boolean(sessionId),
    queryKey: ["ebook-progresses", sessionId],
    queryFn: async () => (await getEbookProgresses(sessionId)).data.data.progresses,
  });
}

export function useCreateEbook() { const client = useQueryClient(); return useMutation({ mutationFn: createEbook, onSuccess: () => invalidate(client) }); }
export function useUpdateEbook() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, data }) => updateEbook(id, data), onSuccess: () => invalidate(client) }); }
export function useDeleteEbook() { const client = useQueryClient(); return useMutation({ mutationFn: deleteEbook, onSuccess: () => invalidate(client) }); }
export function usePublishEbook() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, isPublished }) => publishEbook(id, isPublished), onSuccess: () => invalidate(client) }); }
