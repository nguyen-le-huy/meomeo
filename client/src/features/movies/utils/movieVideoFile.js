const MIME_BY_EXTENSION = {
  mkv: "video/x-matroska",
  mov: "video/quicktime",
  mp4: "video/mp4",
  webm: "video/webm",
};

export const MOVIE_VIDEO_ACCEPT = ".mp4,.mov,.webm,.mkv,video/mp4,video/quicktime,video/webm,video/x-matroska,video/matroska";

export function getMovieVideoMimeType(file) {
  const extension = file?.name?.split(".").pop()?.toLowerCase();
  return MIME_BY_EXTENSION[extension] || file?.type || "video/mp4";
}
