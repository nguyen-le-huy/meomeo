import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBilingualVideo, generateVietsub } from "../services/bilingualApi.js";
import {
  analyzeVideoTranscript,
  deleteTranscriptSegments,
  updateTranscriptSegment,
} from "../../videos/services/videoApi.js";

export function useBilingualVideo(id) {
  return useQuery({
    queryKey: ["bilingual-video", id],
    queryFn: () => getBilingualVideo(id).then((res) => res.data.data),
    enabled: Boolean(id),
    retry: 1,
    refetchInterval: (query) => {
      const status = query.state.data?.video?.transcriptStatus;
      return status === "pending" || status === "processing" ? 3000 : false;
    },
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

export function useAnalyzeBilingualTranscript(id) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => analyzeVideoTranscript(id).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bilingual-video", id] });
      queryClient.invalidateQueries({ queryKey: ["video", id] });
      queryClient.invalidateQueries({ queryKey: ["video-transcripts", id] });
    },
  });
}

export function useUpdateBilingualSegment(id) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ segmentId, data }) => updateTranscriptSegment(segmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bilingual-video", id] });
      queryClient.invalidateQueries({ queryKey: ["video-transcripts", id] });
    },
  });
}

export function useDeleteBilingualSegments(id) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTranscriptSegments,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bilingual-video", id] });
      queryClient.invalidateQueries({ queryKey: ["video", id] });
      queryClient.invalidateQueries({ queryKey: ["video-transcripts", id] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}
