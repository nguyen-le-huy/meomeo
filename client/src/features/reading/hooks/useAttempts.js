import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { submitAttempt, getMyAttempt, getAttempts, deleteAttempt } from "../services/readingApi.js";

export function useSubmitAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ readingId, ...data }) => submitAttempt(readingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reading-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["my-reading-attempt"] });
    },
  });
}

export function useMyAttempt(readingId, sessionId, options = {}) {
  return useQuery({
    queryKey: ["my-reading-attempt", readingId, sessionId],
    queryFn: () => getMyAttempt(readingId, sessionId).then((res) => res.data.data.attempt),
    enabled: Boolean(readingId) && Boolean(sessionId),
    retry: 1,
    ...options,
  });
}

export function useAttempts(readingId, options = {}) {
  return useQuery({
    queryKey: ["reading-attempts", readingId],
    queryFn: () => getAttempts(readingId).then((res) => res.data.data.attempts),
    enabled: Boolean(readingId),
    ...options,
  });
}

export function useDeleteAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ readingId, attemptId }) => deleteAttempt(readingId, attemptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reading-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["my-reading-attempt"] });
    },
  });
}
