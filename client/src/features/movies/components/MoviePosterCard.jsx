import { Play, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { useState } from "react";
import EditMovieDialog from "./EditMovieDialog.jsx";

function getProgressState(movie, localProgress) {
  if (movie.streamStatus === "ready") return null;
  if (movie.streamStatus === "processing") {
    const value = Math.round(movie.encodeProgress || 0);
    return { label: `Đang encode ${value}%`, value };
  }
  const value = localProgress ?? Math.round(movie.uploadProgress || 0);
  return { label: `Đang upload ${value}%`, value };
}

export default function MoviePosterCard({ editMutation, isAdmin, isDeleting, movie, onDelete, onResume, onSelect }) {
  const [isResuming, setIsResuming] = useState(false);
  const [localProgress, setLocalProgress] = useState(null);
  const [resumeError, setResumeError] = useState("");
  const progressState = getProgressState(movie, localProgress);
  const canResume = isAdmin && ["created", "uploading"].includes(movie.streamStatus);

  async function resumeUpload(file) {
    if (!file) return;
    setIsResuming(true);
    setResumeError("");
    try {
      await onResume(movie, file, setLocalProgress);
    } catch (error) {
      setLocalProgress(null);
      setResumeError(error.message || "Không thể tiếp tục upload");
    } finally {
      setIsResuming(false);
    }
  }

  return (
    <article className="group min-w-0">
      <button
        aria-label={`Xem ${movie.title}`}
        className="block w-full min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e06f50]"
        onClick={() => onSelect(movie)}
        type="button"
      >
        <span className="relative block aspect-[2/3] overflow-hidden rounded-sm bg-[#211f1c] ring-1 ring-white/10">
          <img alt={movie.title} className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.035]" loading="lazy" src={movie.poster} />
          <span className="absolute inset-0 bg-black/5 transition group-hover:bg-black/25" />
          <span className="absolute right-0 top-0 rounded-bl-sm bg-[#f5c518] px-2 py-1 text-xs font-extrabold text-black sm:text-sm shadow-md">{movie.rating.toFixed(1)}</span>
          {movie.streamStatus && movie.streamStatus !== "ready" ? <span className="absolute left-0 top-0 rounded-br-sm bg-black/80 px-2 py-1 text-[10px] font-bold uppercase text-amber-300 sm:text-xs">{movie.streamStatus}</span> : !movie.isPublished && movie._id ? <span className="absolute left-0 top-0 rounded-br-sm bg-black/80 px-2 py-1 text-[10px] font-bold uppercase text-white/70 sm:text-xs">Draft</span> : null}
          <span className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100"><span className="grid h-10 w-10 place-items-center rounded-full border border-white/40 bg-black/55 text-white backdrop-blur-sm"><Play fill="currentColor" size={16} /></span></span>
          {progressState ? (
            <span className="absolute inset-x-0 bottom-0 bg-black/85 px-2 py-2">
              <span className="mb-1 flex justify-between text-[10px] font-semibold text-white/80"><span>{progressState.label}</span><span>{progressState.value}%</span></span>
              <span className="block h-1.5 overflow-hidden rounded-full bg-white/20"><span className="block h-full bg-[#e06f50] transition-all duration-300" style={{ width: `${progressState.value}%` }} /></span>
            </span>
          ) : null}
        </span>
        <h3 className="mt-2 truncate text-sm font-semibold text-white/90 sm:text-base">{movie.title} ({movie.year})</h3>
        <span className="mt-1 flex min-w-0 items-center gap-2 text-xs text-white/50 sm:text-sm"><span className="rounded border border-white/30 px-1 py-0.5 text-[10px] leading-none sm:text-xs">1080p</span><span>{movie.year}</span><span aria-hidden="true">•</span><span className="truncate">{movie.duration}</span></span>
      </button>

      {isAdmin ? (
        <div className="mt-2 flex gap-2">
          <EditMovieDialog movie={movie} mutation={editMutation} />
          <button
            aria-label={`Xóa ${movie.title}`}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded border border-red-400/25 text-xs font-semibold text-red-300/80 transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-40"
            disabled={isDeleting}
            onClick={() => onDelete(movie)}
            title="Xóa phim"
            type="button"
          >
            {isDeleting ? <RefreshCw className="animate-spin" size={14} /> : <Trash2 size={14} />} {isDeleting ? "Đang xóa" : "Xóa"}
          </button>
        </div>
      ) : null}

      {canResume ? (
        <label className={`mt-2 flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded border border-white/15 text-xs font-semibold text-white/75 transition hover:bg-white/10 ${isResuming ? "pointer-events-none opacity-50" : ""}`}>
          {isResuming ? <RefreshCw className="animate-spin" size={14} /> : <UploadCloud size={14} />}
          {isResuming ? `Đang upload ${localProgress || 0}%` : movie.uploadProgress > 0 ? "Tiếp tục upload" : "Chọn lại video để upload"}
          <input accept="video/mp4,video/quicktime,video/webm" className="sr-only" disabled={isResuming} onChange={(event) => resumeUpload(event.target.files?.[0])} type="file" />
        </label>
      ) : null}
      {resumeError || movie.streamError ? <p className="mt-1 line-clamp-2 text-xs text-red-300">{resumeError || movie.streamError}</p> : null}
    </article>
  );
}
