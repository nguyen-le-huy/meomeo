import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Maximize, Minimize, Pause, Play, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/button.jsx";
import { Badge } from "../../../components/ui/badge.jsx";
import { LoadingState } from "../../../components/ui/spinner.jsx";
import SegmentYoutubePlayer from "../../videos/components/SegmentYoutubePlayer.jsx";
import BilingualSubtitleList from "../components/BilingualSubtitleList.jsx";
import BilingualAdminToolbar from "../components/BilingualAdminToolbar.jsx";
import { useAuthStore } from "../../auth/stores/authStore.js";
import {
  useBilingualVideo,
  useDeleteBilingualSegments,
  useGenerateVietsub,
  useUpdateBilingualSegment,
} from "../hooks/useBilingualWatch.js";

export default function BilingualWatchPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data, isLoading, error } = useBilingualVideo(id);
  const generateVietsubMutation = useGenerateVietsub(id);
  const updateSegmentMutation = useUpdateBilingualSegment(id);
  const deleteSegmentsMutation = useDeleteBilingualSegments(id);

  const video = data?.video;
  const segments = data?.segments || [];

  const activeIndex = segments.findIndex(
    (segment) => currentTime >= segment.startTime && currentTime < segment.endTime,
  );
  const activeSegment = activeIndex >= 0 ? segments[activeIndex] : null;

  const handleTimeChange = useCallback((time) => {
    setCurrentTime(time);
  }, []);

  const handleSeek = useCallback(
    (startTime) => {
      setIsVideoEnded(false);
      playerRef.current?.playFrom(startTime);
    },
    [],
  );

  const handleTogglePlay = useCallback(
    (e) => {
      e.stopPropagation();
      if (isPlaying) {
        playerRef.current?.pauseVideo();
      } else if (isVideoEnded) {
        playerRef.current?.playFrom(0);
      } else {
        playerRef.current?.playFrom(currentTime || 0);
      }
    },
    [currentTime, isPlaying, isVideoEnded],
  );

  const handleToggleFullscreen = useCallback(
    (e) => {
      e.stopPropagation();
      const el = playerContainerRef.current;
      if (!el) return;
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        el.requestFullscreen?.();
      }
    },
    [],
  );

  useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const handleVietsubDone = useCallback(() => {
    generateVietsubMutation.reset?.();
    queryClient.invalidateQueries({ queryKey: ["bilingual-video", id] });
    queryClient.invalidateQueries({ queryKey: ["video", id] });
    queryClient.invalidateQueries({ queryKey: ["video-transcripts", id] });
  }, [generateVietsubMutation, id, queryClient]);

  const overlayButtonLabel = isVideoEnded ? "Phát lại" : currentTime > 0.5 ? "Tiếp tục" : "Bắt đầu xem";

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-canvas">
        <LoadingState label="Đang tải video..." />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-canvas">
        <p className="font-display text-2xl">Không tìm thấy video</p>
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Về thư viện
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <section className="h-[calc(100vh-4rem)] overflow-hidden bg-canvas xl:block">
      <div className="flex h-full flex-col xl:grid xl:h-full xl:grid-cols-[minmax(0,1fr)_minmax(360px,560px)]">
        <div className="flex shrink-0 flex-col xl:overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e6dfd8] bg-canvas px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <Button asChild size="sm" variant="ghost">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h4 className="line-clamp-1 font-display text-sm font-medium">{video.title}</h4>
              </div>
            </div>
          </div>

          <div className="relative" ref={playerContainerRef}>
            <SegmentYoutubePlayer
              ref={playerRef}
              continuous
              onEndedChange={setIsVideoEnded}
              onReadyChange={setIsPlayerReady}
              onPlayingChange={setIsPlaying}
              onTimeChange={handleTimeChange}
              title={video.title}
              youtubeVideoId={video.youtubeVideoId}
            />

            <div
              className="pointer-events-auto absolute inset-0 z-10"
              onClick={handleTogglePlay}
            >
              {!isPlaying ? (
                <div className="flex h-full w-full items-center justify-center">
                  <button
                    className="flex flex-col items-center gap-3 rounded-xl bg-[#181715]/85 px-8 py-6 transition hover:bg-[#181715]/95"
                    onClick={handleTogglePlay}
                    type="button"
                  >
                    {isVideoEnded ? (
                      <RefreshCw className="h-10 w-10 text-coral" />
                    ) : (
                      <Play className="h-10 w-10 text-coral" fill="currentColor" />
                    )}
                    <span className="text-sm text-canvas">{overlayButtonLabel}</span>
                  </button>
                </div>
              ) : null}

              {isPlaying && activeSegment ? (
                <div className="pointer-events-none absolute bottom-1.5 left-1/2 w-[94%] max-w-2xl -translate-x-1/2 space-y-0 rounded-lg bg-black p-[5px] text-center sm:bottom-4 sm:space-y-1">
                  <p className="font-normal leading-snug text-[#fdd835] text-[11px] sm:text-xl [text-shadow:0_0_3px_rgba(0,0,0,0.8)]">
                    {activeSegment.text}
                  </p>
                  {activeSegment.translationText ? (
                    <p className="font-normal leading-snug text-white/90 text-[10px] sm:text-lg [text-shadow:0_0_3px_rgba(0,0,0,0.8)]">
                      {activeSegment.translationText}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {isPlaying ? (
                <button
                  className="absolute bottom-3 left-3 rounded-full bg-[#181715]/85 p-2.5 opacity-0 transition hover:opacity-100"
                  onClick={handleTogglePlay}
                  type="button"
                >
                  <Pause className="h-5 w-5 text-canvas" />
                </button>
              ) : null}

              <Button
                aria-label={isFullscreen ? "Thoát toàn màn hình" : "Xem toàn màn hình"}
                className="absolute bottom-3 right-3 hidden rounded-full bg-coal/85 opacity-60 hover:bg-coal hover:opacity-100 sm:inline-flex"
                onClick={handleToggleFullscreen}
                size="icon"
                type="button"
                variant="secondary"
              >
                {isFullscreen ? <Minimize className="h-5 w-5 text-canvas" /> : <Maximize className="h-5 w-5 text-canvas" />}
              </Button>
            </div>
          </div>

          {isAdmin ? (
            <div className="border-t border-[#e6dfd8] px-4 py-4 sm:px-6">
              <BilingualAdminToolbar
                bilingualError={video.bilingualError}
                bilingualStatus={video.bilingualStatus}
                generateVietsubMutation={generateVietsubMutation}
                hasSegments={segments.length > 0}
                onVietsubDone={handleVietsubDone}
                segments={segments}
                transcriptStatus={video.transcriptStatus}
                videoId={id}
              />
            </div>
          ) : null}
        </div>

        <aside className="hidden border-l border-[#e6dfd8] xl:block xl:overflow-y-auto">
          <div className="sticky top-0 z-10 border-b border-[#e6dfd8] bg-canvas px-5 py-3">
            <h3 className="font-display text-lg font-medium">Phụ đề song ngữ</h3>
            <p className="text-xs text-ink-muted">{segments.length} đoạn</p>
          </div>
          <BilingualSubtitleList
            activeIndex={activeIndex}
            canEdit={isAdmin}
            onSeek={handleSeek}
            onUpdateSegment={(segmentId, segmentData) =>
              updateSegmentMutation.mutateAsync({ data: segmentData, segmentId })
            }
            onDeleteSegments={(segmentIds) => deleteSegmentsMutation.mutateAsync(segmentIds)}
            segments={segments}
          />
        </aside>

        <div className="flex min-h-0 flex-1 flex-col xl:hidden">
          <div className="shrink-0 border-b border-[#e6dfd8] bg-canvas px-5 py-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-medium">Phụ đề song ngữ</h3>
            <p className="text-xs text-ink-muted">{segments.length} đoạn</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <BilingualSubtitleList
              activeIndex={activeIndex}
              canEdit={isAdmin}
              onSeek={handleSeek}
              onUpdateSegment={(segmentId, segmentData) =>
                updateSegmentMutation.mutateAsync({ data: segmentData, segmentId })
              }
              onDeleteSegments={(segmentIds) => deleteSegmentsMutation.mutateAsync(segmentIds)}
              segments={segments}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
