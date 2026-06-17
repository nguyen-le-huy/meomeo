import { Play, RefreshCw } from "lucide-react";
import { inactiveButtonClass } from "../constants/videoLearning.constants.js";
import { formatDuration } from "../utils/dictationText.js";
import SegmentYoutubePlayer from "./SegmentYoutubePlayer.jsx";

export default function VideoColumn({
  analyzeMutation,
  isAdmin,
  isYoutubeReady,
  onPlayingChange,
  onReadyChange,
  onReplayCurrentSegment,
  onStartFirstSegment,
  playerRef,
  segment,
  video,
}) {
  return (
    <section className="min-w-0 max-w-full overflow-hidden bg-white md:rounded-2xl md:border md:border-[#d9e2ec] md:p-4 md:shadow-sm xl:min-h-[calc(100vh-2rem)]">
      <div className="mb-4 hidden items-center justify-between gap-3 xl:flex">
        <h2 className="text-sm font-black uppercase tracking-wide text-coal">Video</h2>
        {video.duration ? (
          <span className="inline-flex items-center gap-2 rounded-xl bg-[#f3f6fb] px-3 py-1.5 text-sm font-black text-coal/75">
            <span className="h-2 w-2 rounded-full bg-coal/45" />
            {formatDuration(video.duration)}
          </span>
        ) : null}
      </div>
      <div className="space-y-4">
        <SegmentYoutubePlayer
          onPlayingChange={onPlayingChange}
          onReadyChange={onReadyChange}
          ref={playerRef}
          segment={segment}
          title={video.title}
          youtubeVideoId={video.youtubeVideoId}
        />
        <div className="hidden xl:block">
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-coal/65">Điều khiển</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[#292f68] px-4 text-base font-black uppercase text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!segment || !isYoutubeReady}
              onClick={onStartFirstSegment}
              type="button"
            >
              <Play size={18} /> Bắt đầu
            </button>
            <button
              className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[#3b99d8] px-4 text-base font-black uppercase text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!segment || !isYoutubeReady}
              onClick={onReplayCurrentSegment}
              type="button"
            >
              <RefreshCw size={18} /> Phát lại
            </button>
          </div>
        </div>
        <div className="hidden border-t border-coal/10 pt-4 xl:block">
          <p className="text-sm font-black leading-tight text-coal">{video.title}</p>
          <p className="mt-1 text-sm font-bold text-coal/55">YouTube - {video.level}</p>
          {isAdmin ? (
            <button
              className={`${inactiveButtonClass} mt-3`}
              disabled={analyzeMutation.isPending}
              onClick={() => analyzeMutation.mutate()}
              type="button"
            >
              <RefreshCw className={analyzeMutation.isPending ? "animate-spin" : ""} size={16} />
              {analyzeMutation.isPending ? "Đang phân tích..." : "Phân tích transcript"}
            </button>
          ) : null}
          {video.transcriptStatus === "failed" && video.transcriptError ? (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
              {video.transcriptError}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
