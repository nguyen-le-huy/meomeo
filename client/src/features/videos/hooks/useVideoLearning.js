import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTopic, deleteTopic, reorderTopics, updateTopic } from "../../topics/services/topicApi.js";
import {
  analyzeVideoTranscript,
  assessShadowing,
  checkDictation,
  createTranscriptSegment,
  createVideo,
  deleteVideo,
  getVideo,
  getVideos,
  getVideoTranscripts,
  mergeTranscriptSegment,
  publishVideo,
  updateTranscriptSegment,
  updateVideo,
  saveShadowingSessionProgress,
  submitShadowingSession,
  getMyShadowingSession,
  getMyShadowingSessions,
  getShadowingSessions,
  deleteShadowingSession,
} from "../services/videoApi.js";
import { getTopics } from "../../topics/services/topicApi.js";

export function useTopics(params) {
  return useQuery({
    queryKey: ["topics", params],
    queryFn: async () => {
      const response = await getTopics(params);
      return response.data.data.topics;
    },
  });
}

export function useVideos(params) {
  return useQuery({
    queryKey: ["videos", params],
    queryFn: async () => {
      const response = await getVideos(params);
      return response.data.data.videos;
    },
  });
}

export function useVideo(id) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["video", id],
    queryFn: async () => {
      const response = await getVideo(id);
      return response.data.data.video;
    },
  });
}

export function useVideoTranscripts(id) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["video-transcripts", id],
    queryFn: async () => {
      const response = await getVideoTranscripts(id);
      return response.data.data.segments;
    },
  });
}

function invalidateLibrary(queryClient) {
  queryClient.invalidateQueries({ queryKey: ["topics"] });
  queryClient.invalidateQueries({ queryKey: ["videos"] });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTopic,
    onSuccess: () => invalidateLibrary(queryClient),
  });
}

export function useUpdateTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateTopic(id, data),
    onSuccess: () => invalidateLibrary(queryClient),
  });
}

export function useReorderTopics() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderTopics,
    onSuccess: () => invalidateLibrary(queryClient),
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTopic,
    onSuccess: () => invalidateLibrary(queryClient),
  });
}

export function useCreateVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVideo,
    onSuccess: () => invalidateLibrary(queryClient),
  });
}

export function useUpdateVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateVideo(id, data),
    onSuccess: (_, variables) => {
      invalidateLibrary(queryClient);
      queryClient.invalidateQueries({ queryKey: ["video", variables.id] });
    },
  });
}

export function useDeleteVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVideo,
    onSuccess: () => invalidateLibrary(queryClient),
  });
}

export function usePublishVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPublished }) => publishVideo(id, isPublished),
    onSuccess: (_, variables) => {
      invalidateLibrary(queryClient);
      queryClient.invalidateQueries({ queryKey: ["video", variables.id] });
    },
  });
}

export function useAnalyzeVideoTranscript(videoId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => analyzeVideoTranscript(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video", videoId] });
      queryClient.invalidateQueries({ queryKey: ["video-transcripts", videoId] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

export function useCheckDictation() {
  return useMutation({ mutationFn: checkDictation });
}

export function useAssessShadowing() {
  return useMutation({ mutationFn: assessShadowing });
}

export function useCreateTranscriptSegment(videoId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => createTranscriptSegment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video", videoId] });
      queryClient.invalidateQueries({ queryKey: ["video-transcripts", videoId] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

export function useUpdateTranscriptSegment(videoId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ segmentId, data }) => updateTranscriptSegment(segmentId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["video-transcripts", videoId] }),
  });
}

export function useMergeTranscriptSegment(videoId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mergeTranscriptSegment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["video-transcripts", videoId] }),
  });
}

export function useSubmitShadowingSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitShadowingSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shadowing-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["my-shadowing-session"] });
      queryClient.invalidateQueries({ queryKey: ["my-shadowing-sessions"] });
    },
  });
}

export function useSaveShadowingSessionProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveShadowingSessionProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shadowing-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["my-shadowing-session"] });
      queryClient.invalidateQueries({ queryKey: ["my-shadowing-sessions"] });
    },
  });
}

export function useMyShadowingSession(videoId, sessionId, options = {}) {
  return useQuery({
    queryKey: ["my-shadowing-session", videoId, sessionId],
    queryFn: () => getMyShadowingSession(videoId, sessionId).then((r) => r.data.data.shadowingSession),
    enabled: Boolean(videoId) && Boolean(sessionId),
    ...options,
  });
}

export function useMyShadowingSessions(sessionId, options = {}) {
  return useQuery({
    queryKey: ["my-shadowing-sessions", sessionId],
    queryFn: () => getMyShadowingSessions(sessionId).then((r) => r.data.data.shadowingSessions),
    enabled: Boolean(sessionId),
    ...options,
  });
}

export function useShadowingSessions(videoId, options = {}) {
  return useQuery({
    queryKey: ["shadowing-sessions", videoId],
    queryFn: () => getShadowingSessions(videoId).then((r) => r.data.data.shadowingSessions),
    enabled: Boolean(videoId),
    ...options,
  });
}

export function useDeleteShadowingSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteShadowingSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shadowing-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["my-shadowing-session"] });
      queryClient.invalidateQueries({ queryKey: ["my-shadowing-sessions"] });
    },
  });
}
