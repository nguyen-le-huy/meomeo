export function normalizeMovie(movie) {
  if (!movie) return null;
  return {
    ...movie,
    id: String(movie._id || movie.id),
    poster: movie.posterUrl || movie.poster || movie.thumbnailUrl || movie.backdropUrl || movie.backdrop,
    backdrop: movie.heroThumbnailUrl || movie.backdropUrl || movie.backdrop || movie.thumbnailUrl || movie.posterUrl || movie.poster,
    year: movie.releaseYear || movie.year || new Date(movie.createdAt || Date.now()).getFullYear(),
    age: movie.ageRating || movie.age || "13+",
    duration: typeof movie.duration === "number" ? formatDuration(movie.duration) : movie.duration || "Đang cập nhật",
    rating: Number(movie.rating || 0),
  };
}

export function flattenMovieLibrary(library) {
  const seen = new Set();
  if (library?.movies) {
    return library.movies.flatMap((movie) => {
      const normalized = normalizeMovie(movie);
      if (!normalized?.id || seen.has(normalized.id)) return [];
      seen.add(normalized.id);
      return [normalized];
    });
  }
  return (library?.categories || []).flatMap((category) =>
    (category.movies || []).flatMap((movie) => {
      const normalized = normalizeMovie(movie);
      if (!normalized?.id || seen.has(normalized.id)) return [];
      seen.add(normalized.id);
      return [{ ...normalized, category }];
    }),
  );
}

export function formatDuration(seconds) {
  const value = Math.max(0, Number(seconds) || 0);
  if (!value) return "Đang cập nhật";
  const hours = Math.floor(value / 3600);
  const minutes = Math.round((value % 3600) / 60);
  return hours ? `${hours}g ${minutes}p` : `${minutes}p`;
}
