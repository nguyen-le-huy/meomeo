import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMovie,
  deleteMovie,
  generateMovieVietsub,
  getMovie,
  getMovieLibrary,
  getMoviePlayback,
  importMovieSubtitle,
  markUploadCompleted,
  publishMovie,
  setMovieHero,
  syncStreamStatus,
  updateMovie,
} from "../services/movieApi.js";

export function useMovieLibrary(params, options = {}) {
  return useQuery({
    queryKey: ["movie-library", params],
    queryFn: () => getMovieLibrary(params).then((response) => response.data.data),
    retry: 1,
    refetchInterval: options.refetchInterval,
  });
}

export function useMovieDetail(id, options = {}) {
  return useQuery({
    queryKey: ["movie", id],
    queryFn: () => getMovie(id).then((response) => response.data.data),
    enabled: Boolean(id) && options.enabled !== false,
    retry: 1,
  });
}

export function useMoviePlayback(id, options = {}) {
  return useQuery({
    queryKey: ["movie-playback", id],
    queryFn: () => getMoviePlayback(id).then((response) => response.data.data.playback),
    enabled: Boolean(id) && options.enabled !== false,
    staleTime: 60_000,
    retry: 1,
    refetchInterval: options.refetchInterval,
  });
}

export function useMovieAdminMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["movie-library"] });
    queryClient.invalidateQueries({ queryKey: ["movie"] });
  };

  return {
    create: useMutation({ mutationFn: createMovie, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, data }) => updateMovie(id, data), onSuccess: invalidate }),
    setHero: useMutation({ mutationFn: ({ id, thumbnail }) => setMovieHero(id, thumbnail), onSuccess: invalidate }),
    publish: useMutation({ mutationFn: ({ id, isPublished }) => publishMovie(id, isPublished), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: ({ id, deleteAsset }) => deleteMovie(id, deleteAsset), onSuccess: invalidate }),
    sync: useMutation({ mutationFn: syncStreamStatus, onSuccess: invalidate }),
    markUploaded: useMutation({ mutationFn: markUploadCompleted, onSuccess: invalidate }),
    importSubtitle: useMutation({
      mutationFn: ({ id, language, file, dryRun }) => importMovieSubtitle(id, language, file, dryRun),
      onSuccess: invalidate,
    }),
    generateVietsub: useMutation({
      mutationFn: ({ id, force }) => generateMovieVietsub(id, { force }),
      onSuccess: invalidate,
    }),
  };
}
