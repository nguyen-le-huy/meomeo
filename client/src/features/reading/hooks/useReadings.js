import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReading,
  deleteReading,
  getLatestReading,
  getReading,
  getReadings,
  publishReading,
  updateReading,
} from "../services/readingApi.js";

function invalidateReadings(queryClient) {
  queryClient.invalidateQueries({ queryKey: ["readings"] });
  queryClient.invalidateQueries({ queryKey: ["latest-reading"] });
}

export function useReadings(params) {
  return useQuery({
    queryKey: ["readings", params],
    queryFn: async () => {
      const response = await getReadings(params);
      return response.data.data.readings;
    },
  });
}

export function useLatestReading() {
  return useQuery({
    queryKey: ["latest-reading"],
    queryFn: async () => {
      const response = await getLatestReading();
      return response.data.data.reading;
    },
  });
}

export function useReading(slug) {
  return useQuery({
    enabled: Boolean(slug),
    queryKey: ["reading", slug],
    queryFn: async () => {
      const response = await getReading(slug);
      return response.data.data.reading;
    },
  });
}

export function useCreateReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReading,
    onSuccess: () => invalidateReadings(queryClient),
  });
}

export function useUpdateReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateReading(id, data),
    onSuccess: (_, variables) => {
      invalidateReadings(queryClient);
      queryClient.invalidateQueries({ queryKey: ["reading"] });
      if (variables?.data?.slug) queryClient.invalidateQueries({ queryKey: ["reading", variables.data.slug] });
    },
  });
}

export function useDeleteReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteReading,
    onSuccess: () => invalidateReadings(queryClient),
  });
}

export function usePublishReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPublished }) => publishReading(id, isPublished),
    onSuccess: () => invalidateReadings(queryClient),
  });
}
