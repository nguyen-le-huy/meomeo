import { Play, RefreshCw } from "lucide-react";
import { Button } from "../../../components/ui/button.jsx";
import { Badge } from "../../../components/ui/badge.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select.jsx";
import { Spinner } from "../../../components/ui/spinner.jsx";
import { formatDuration } from "../utils/dictationText.js";
import { useUpdateVideo } from "../hooks/useVideoLearning.js";
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
  const updateVideoMutation = useUpdateVideo();
  return (
    <section className="min-w-0 max-w-full overflow-hidden bg-white shadow-[0_18px_45px_rgba(20,20,19,0.07)] md:rounded-2xl md:border md:border-[#e6dfd8] md:p-4 dark:border-[#2e2b27] dark:bg-[#1f1e1b] xl:flex xl:h-full xl:min-h-0 xl:flex-col">
      <div className="mb-4 hidden items-center justify-between gap-3 xl:flex">
        <h2 className="eyebrow">Video lesson</h2>
        {video.duration ? (
          <Badge className="rounded-full bg-cream-soft px-3 py-1 text-coal dark:border dark:border-[#2e2b27] dark:bg-[#252320] dark:text-[#faf9f5]">{formatDuration(video.duration)}</Badge>
        ) : null}
      </div>
      <div className="space-y-4">
        <SegmentYoutubePlayer
          className="xl:h-[min(34vh,300px)]"
          disableInteraction
          fitDesktop
          onPlayingChange={onPlayingChange}
          onReadyChange={onReadyChange}
          ref={playerRef}
          segment={segment}
          title={video.title}
          youtubeVideoId={video.youtubeVideoId}
        />
        <div className="hidden xl:block xl:shrink-0">
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-coal/65">Điều khiển</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              className="h-12 rounded-xl bg-coal text-canvas hover:bg-coral-dark dark:bg-[#faf9f5] dark:text-[#181715]"
              disabled={!segment || !isYoutubeReady}
              onClick={onStartFirstSegment}
              type="button"
              variant="secondary"
            >
              <Play size={18} /> Bắt đầu
            </Button>
            <Button
              className="h-12 rounded-xl border-[#d8d0c6] bg-white shadow-sm hover:bg-cream-soft dark:border-[#2e2b27] dark:bg-[#252320] dark:text-[#faf9f5] dark:hover:bg-[#2c2925]"
              disabled={!segment || !isYoutubeReady}
              onClick={onReplayCurrentSegment}
              type="button"
              variant="outline"
            >
              <RefreshCw size={18} /> Phát lại
            </Button>
          </div>
        </div>
        <div className="hidden min-h-0 border-t border-[#e6dfd8] dark:border-[#2e2b27] pt-4 xl:block">
          <p className="text-xl font-semibold leading-tight text-coal">{video.title}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-ink-muted">YouTube · {video.level}</span>
            {isAdmin ? (
              <div className="flex items-center gap-1.5">
                <Select
                  disabled={updateVideoMutation.isPending}
                  onValueChange={(val) => {
                    updateVideoMutation.mutate({
                      id: video._id,
                      data: { language: val },
                    });
                  }}
                  value={video.language || (video.transcriptLanguage === "zh" ? "zh-CN" : video.transcriptLanguage === "es" ? "es-ES" : "en-US")}
                >
                  <SelectTrigger className="h-7 w-auto min-w-[125px] rounded-full border-[#e6dfd8] bg-cream-soft px-2.5 text-xs font-bold text-ink-body shadow-none hover:bg-cream dark:border-[#2e2b27] dark:bg-[#252320] dark:text-[#faf9f5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">🇺🇸 Tiếng Anh</SelectItem>
                    <SelectItem value="zh-CN">🇨🇳 Tiếng Trung</SelectItem>
                    <SelectItem value="es-ES">🇪🇸 Tây Ban Nha</SelectItem>
                  </SelectContent>
                </Select>
                {updateVideoMutation.isPending && <Spinner className="h-3.5 w-3.5 text-coral" />}
              </div>
            ) : (
              <Badge className="rounded-full border border-[#e6dfd8] bg-cream-soft text-xs font-semibold text-ink-body dark:border-[#2e2b27] dark:bg-[#252320] dark:text-[#faf9f5]">
                {video.language === "zh-CN" || video.transcriptLanguage === "zh"
                  ? "🇨🇳 Tiếng Trung"
                  : video.language === "es-ES" || video.transcriptLanguage === "es"
                  ? "🇪🇸 Tây Ban Nha"
                  : "🇺🇸 Tiếng Anh"}
              </Badge>
            )}
          </div>
          {isAdmin ? (
            <Button
              className="mt-3 rounded-xl border-[#d8d0c6] bg-white shadow-sm hover:bg-cream-soft"
              disabled={analyzeMutation.isPending}
              onClick={() => {
                if (video.bilingualStatus === "completed") {
                  const ok = window.confirm("Phân tích lại transcript sẽ xóa Vietsub hiện có. Bạn có muốn tiếp tục?");
                  if (!ok) return;
                }
                analyzeMutation.mutate();
              }}
              type="button"
              variant="outline"
            >
              {analyzeMutation.isPending ? <Spinner size="sm" /> : <RefreshCw size={16} />}
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
