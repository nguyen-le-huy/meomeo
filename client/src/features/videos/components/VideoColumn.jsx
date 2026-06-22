import { Play, RefreshCw } from "lucide-react";
import { Button } from "../../../components/ui/button.jsx";
import { Badge } from "../../../components/ui/badge.jsx";
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
    <section className="min-w-0 max-w-full overflow-hidden bg-canvas md:rounded-xl md:border md:border-[#e6dfd8] md:p-4 xl:min-h-[calc(100vh-6rem)]">
      <div className="mb-4 hidden items-center justify-between gap-3 xl:flex">
        <h2 className="eyebrow">Video lesson</h2>
        {video.duration ? (
          <Badge variant="secondary">{formatDuration(video.duration)}</Badge>
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
            <Button
              className="h-12"
              disabled={!segment || !isYoutubeReady}
              onClick={onStartFirstSegment}
              type="button"
              variant="secondary"
            >
              <Play size={18} /> Bắt đầu
            </Button>
            <Button
              className="h-12"
              disabled={!segment || !isYoutubeReady}
              onClick={onReplayCurrentSegment}
              type="button"
              variant="outline"
            >
              <RefreshCw size={18} /> Phát lại
            </Button>
          </div>
        </div>
        <div className="hidden border-t border-coal/10 pt-4 xl:block">
          <p className="font-display text-xl leading-tight text-coal">{video.title}</p>
          <p className="mt-1 text-sm text-ink-muted">YouTube · {video.level}</p>
          {isAdmin ? (
            <Button
              className="mt-3"
              disabled={analyzeMutation.isPending}
              onClick={() => analyzeMutation.mutate()}
              type="button"
              variant="outline"
            >
              <RefreshCw className={analyzeMutation.isPending ? "animate-spin" : ""} size={16} />
              {analyzeMutation.isPending ? "Đang phân tích..." : "Phân tích transcript"}
            </Button>
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
