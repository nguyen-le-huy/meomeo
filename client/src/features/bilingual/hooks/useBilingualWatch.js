import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBilingualVideo, generateVietsub } from "../services/bilingualApi.js";

export function useBilingualVideo(id) {
  return useQuery({
    queryKey: ["bilingual-video", id],
    queryFn: () => getBilingualVideo(id).then((res) => res.data.data),
    enabled: Boolean(id),
    retry: 1,
  });
}

export function useGenerateVietsub(id) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => generateVietsub(id, data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bilingual-video", id] });
      queryClient.invalidateQueries({ queryKey: ["video", id] });
      queryClient.invalidateQueries({ queryKey: ["video-transcripts", id] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["bilingual-video", id] });
    },
  });
}
